require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');

// Initialize
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const app = express();

// Keep server alive on Render
app.get('/', (req, res) => res.send('Vitfe bot is running! 🚀'));
app.listen(process.env.PORT || 3000);

// Categories
const CATEGORIES = {
  '1': '🔧 Mécanicien',
  '2': '❄️ Technicien Frigo/Clim',
  '3': '⚡ Électricien',
  '4': '🚿 Plombier',
  '5': '🪡 Couturier/Tailleur',
  '6': '📱 Réparateur Téléphone',
  '7': '🏠 Menuisier',
  '8': '🎨 Peintre',
  '9': '🍽️ Traiteur/Cuisinier',
  '10': '🛵 Livraison',
  '11': '➕ Autre'
};

// User sessions — tracks conversation state
const sessions = {};

// Timeout trackers — 5 min per request
const requestTimeouts = {};

function setRequestTimeout(chatId, requestId) {
  // Clear any existing timeout
  if (requestTimeouts[chatId]) clearTimeout(requestTimeouts[chatId]);

  requestTimeouts[chatId] = setTimeout(async () => {
    // Check if request is still pending
    const { data: request } = await supabase
      .from('requests')
      .select('status')
      .eq('id', requestId)
      .single();

    if (request && request.status === 'pending') {
      // Update request to expired
      await supabase
        .from('requests')
        .update({ status: 'expired' })
        .eq('id', requestId);

      // Notify user
      bot.sendMessage(chatId,
        `😔 *Aucun prestataire disponible pour le moment.*\n\n` +
        `Tous nos prestataires sont occupés. Réessayez dans 1 heure ou contactez-nous directement:\n` +
        `📞 *+221777527465*\n\n` +
        `Tapez /start pour une nouvelle demande.`,
        { parse_mode: 'Markdown' }
      );

      clearSession(chatId);
    }

    delete requestTimeouts[chatId];
  }, 5 * 60 * 1000); // 5 minutes
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

function getSession(chatId) {
  if (!sessions[chatId]) sessions[chatId] = { state: 'idle', data: {} };
  return sessions[chatId];
}

function clearSession(chatId) {
  sessions[chatId] = { state: 'idle', data: {} };
}

function categoryMenu() {
  return Object.entries(CATEGORIES)
    .map(([k, v]) => `${k}. ${v}`)
    .join('\n');
}

async function findAvailableProviders(category) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('category', category)
    .eq('is_available', true)
    .eq('is_verified', true)
    .order('rating', { ascending: false });

  if (error) console.error('Error finding providers:', error);
  return data || [];
}

async function saveRequest(userPhone, category, description, address) {
  const { data, error } = await supabase
    .from('requests')
    .insert([{ user_phone: userPhone, category, description, address, status: 'pending' }])
    .select()
    .single();

  if (error) console.error('Error saving request:', error);
  return data;
}

async function notifyProviders(providers, request, bot) {
  for (const provider of providers) {
    if (provider.telegram_chat_id) {
      await bot.sendMessage(provider.telegram_chat_id,
        `🔔 *Nouvelle demande Vitfe!*\n\n` +
        `📋 Service: ${request.category}\n` +
        `📍 Adresse: ${request.address || 'Non précisé'}\n` +
        `💬 Détails: ${request.description || 'Aucun détail'}\n\n` +
        `Voulez-vous accepter cette demande?\n` +
        `Répondez *OUI_${request.id}* pour accepter\n` +
        `Répondez *NON_${request.id}* pour décliner`,
        { parse_mode: 'Markdown' }
      );
    }
  }
}

async function updateProviderAvailability(phone, isAvailable) {
  const { error } = await supabase
    .from('providers')
    .update({ is_available: isAvailable, last_active: new Date() })
    .eq('phone', phone);

  if (error) console.error('Error updating availability:', error);
}

async function getProviderByTelegramId(chatId) {
  const { data } = await supabase
    .from('providers')
    .select('*')
    .eq('telegram_chat_id', String(chatId))
    .single();
  return data;
}

async function saveRating(requestId, providerId, userPhone, score, comment) {
  const { error } = await supabase
    .from('ratings')
    .insert([{ request_id: requestId, provider_id: providerId, user_phone: userPhone, score, comment }]);

  if (!error) {
    // Update provider average rating
    const { data: ratings } = await supabase
      .from('ratings')
      .select('score')
      .eq('provider_id', providerId);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      await supabase
        .from('providers')
        .update({ rating: avg.toFixed(1), total_ratings: ratings.length })
        .eq('id', providerId);
    }
  }
}

// ─────────────────────────────────────────
// BOT COMMANDS
// ─────────────────────────────────────────

// /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  clearSession(chatId);

  await bot.sendMessage(chatId,
    `👋 *Bienvenue sur Vitfe!*\n\n` +
    `Vitfe connecte instantanément les clients aux meilleurs prestataires de services à Dakar.\n\n` +
    `Que souhaitez-vous faire?\n\n` +
    `1️⃣ J'ai besoin d'un service\n` +
    `2️⃣ Je suis prestataire\n\n` +
    `Répondez avec le numéro de votre choix.`,
    { parse_mode: 'Markdown' }
  );

  getSession(chatId).state = 'main_menu';
});

// /dispo — provider toggles availability
bot.onText(/\/dispo/, async (msg) => {
  const chatId = msg.chat.id;
  const provider = await getProviderByTelegramId(chatId);

  if (!provider) {
    return bot.sendMessage(chatId, '❌ Vous n\'êtes pas enregistré comme prestataire. Tapez /start pour commencer.');
  }

  const newStatus = !provider.is_available;
  await updateProviderAvailability(provider.phone, newStatus);

  bot.sendMessage(chatId,
    newStatus
      ? '✅ Vous êtes maintenant *disponible*. Vous recevrez les nouvelles demandes.'
      : '⏸️ Vous êtes maintenant *indisponible*. Vous ne recevrez pas de demandes.',
    { parse_mode: 'Markdown' }
  );
});

// /stats — provider sees their stats
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const provider = await getProviderByTelegramId(chatId);

  if (!provider) {
    return bot.sendMessage(chatId, '❌ Vous n\'êtes pas enregistré comme prestataire.');
  }

  const { data: ratings } = await supabase
    .from('ratings')
    .select('score, comment')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })
    .limit(5);

  let reviewsText = '';
  if (ratings && ratings.length > 0) {
    reviewsText = '\n\n⭐ *Derniers avis:*\n' + ratings.map(r =>
      `${'⭐'.repeat(r.score)} ${r.comment || 'Pas de commentaire'}`
    ).join('\n');
  }

  bot.sendMessage(chatId,
    `📊 *Vos statistiques Vitfe*\n\n` +
    `👤 ${provider.first_name} ${provider.last_name}\n` +
    `🔧 ${provider.category}\n` +
    `📍 ${provider.city}\n` +
    `🟢 Disponible: ${provider.is_available ? 'Oui' : 'Non'}\n` +
    `✅ Vérifié: ${provider.is_verified ? 'Oui' : 'Non'}\n\n` +
    `📈 *Ce mois-ci:*\n` +
    `🔔 Demandes reçues: ${provider.total_requests || 0}\n` +
    `✅ Acceptées: ${provider.total_accepted || 0}\n` +
    `⭐ Note moyenne: ${provider.rating || 'Pas encore noté'}/5\n` +
    `🗳️ Nombre d'avis: ${provider.total_ratings || 0}` +
    reviewsText,
    { parse_mode: 'Markdown' }
  );
});

// /aide
bot.onText(/\/aide/, async (msg) => {
  bot.sendMessage(msg.chat.id,
    `ℹ️ *Commandes Vitfe:*\n\n` +
    `/start — Recommencer\n` +
    `/dispo — Activer/désactiver disponibilité (prestataires)\n` +
    `/stats — Voir vos statistiques (prestataires)\n` +
    `/aide — Afficher cette aide\n\n` +
    `📞 *Support:* +221777527465`,
    { parse_mode: 'Markdown' }
  );
});

// ─────────────────────────────────────────
// MAIN MESSAGE HANDLER
// ─────────────────────────────────────────

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith('/')) return;

  const session = getSession(chatId);

  // ── Handle provider accepting/declining requests ──
  if (text.startsWith('OUI_') || text.startsWith('NON_')) {
    const parts = text.split('_');
    const action = parts[0];
    const requestId = parts[1];

    const provider = await getProviderByTelegramId(chatId);
    if (!provider) return;

    if (action === 'OUI') {
      // Update request
      const { data: request } = await supabase
        .from('requests')
        .update({ provider_id: provider.id, status: 'accepted', accepted_at: new Date() })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (!request) {
        return bot.sendMessage(chatId, '❌ Cette demande a déjà été acceptée par un autre prestataire.');
      }

      // Update provider stats
      await supabase
        .from('providers')
        .update({
          total_accepted: (provider.total_accepted || 0) + 1,
          is_available: false
        })
        .eq('id', provider.id);

      // Cancel timeout — provider accepted
      if (requestTimeouts[request.user_phone]) {
        clearTimeout(requestTimeouts[request.user_phone]);
        delete requestTimeouts[request.user_phone];
      }
      // Also try by chatId match
      Object.keys(requestTimeouts).forEach(key => {
        if (sessions[key]?.data?.requestId === request.id) {
          clearTimeout(requestTimeouts[key]);
          delete requestTimeouts[key];
        }
      });

      // Notify provider
      bot.sendMessage(chatId,
        `✅ *Demande acceptée!*\n\n` +
        `📞 Contactez le client: ${request.user_phone}\n` +
        `📍 Adresse: ${request.address || 'À confirmer avec le client'}\n\n` +
        `Une fois le travail terminé, tapez:\n*TERMINE_${requestId}*`,
        { parse_mode: 'Markdown' }
      );

      // Notify user
      const userSessions = Object.entries(sessions).find(([id, s]) =>
        s.data.requestId === requestId
      );

      if (userSessions) {
        const userChatId = userSessions[0];
        bot.sendMessage(userChatId,
          `✅ *Bonne nouvelle!*\n\n` +
          `${provider.first_name} ${provider.last_name} a accepté votre demande!\n` +
          `📞 Contact: ${provider.phone}\n` +
          `⭐ Note: ${provider.rating || 'Nouveau'}/5\n\n` +
          `Il/elle arrive bientôt. Bonne chance! 🙏`,
          { parse_mode: 'Markdown' }
        );
      }

    } else {
      bot.sendMessage(chatId, '👍 Demande déclinée. Vous recevrez la prochaine.');
    }
    return;
  }

  // ── Handle job completion ──
  if (text.startsWith('TERMINE_')) {
    const requestId = text.split('_')[1];
    const provider = await getProviderByTelegramId(chatId);
    if (!provider) return;

    await supabase
      .from('requests')
      .update({ status: 'completed', completed_at: new Date() })
      .eq('id', requestId);

    await supabase
      .from('providers')
      .update({ is_available: true })
      .eq('id', provider.id);

    bot.sendMessage(chatId, '✅ Parfait! Travail marqué comme terminé. Vous êtes de nouveau disponible.');

    // Ask user to rate
    const { data: request } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (request) {
      const userSessions = Object.entries(sessions).find(([id, s]) =>
        s.data.requestId === requestId
      );

      if (userSessions) {
        const userChatId = userSessions[0];
        sessions[userChatId] = {
          state: 'rating',
          data: { requestId, providerId: provider.id, providerName: `${provider.first_name} ${provider.last_name}` }
        };

        bot.sendMessage(userChatId,
          `🌟 *Évaluez votre prestataire*\n\n` +
          `Comment était votre expérience avec ${provider.first_name} ${provider.last_name}?\n\n` +
          `1️⃣ ⭐ Très mauvais\n` +
          `2️⃣ ⭐⭐ Mauvais\n` +
          `3️⃣ ⭐⭐⭐ Correct\n` +
          `4️⃣ ⭐⭐⭐⭐ Bien\n` +
          `5️⃣ ⭐⭐⭐⭐⭐ Excellent`,
          { parse_mode: 'Markdown' }
        );
      }
    }
    return;
  }

  // ── STATE MACHINE ──
  switch (session.state) {

    // Main menu
    case 'main_menu':
      if (text === '1') {
        session.state = 'select_category';
        bot.sendMessage(chatId,
          `🔍 *Quel service recherchez-vous?*\n\n${categoryMenu()}\n\nRépondez avec le numéro.`,
          { parse_mode: 'Markdown' }
        );
      } else if (text === '2') {
        session.state = 'provider_register';
        bot.sendMessage(chatId,
          `👷 *Inscription prestataire Vitfe*\n\n` +
          `Pour commencer, quel est votre *prénom*?`,
          { parse_mode: 'Markdown' }
        );
        session.data.step = 'first_name';
      } else {
        bot.sendMessage(chatId, 'Veuillez répondre avec *1* ou *2*.', { parse_mode: 'Markdown' });
      }
      break;

    // User: select category
    case 'select_category':
      if (CATEGORIES[text]) {
        session.data.category = CATEGORIES[text];
        session.state = 'get_address';
        bot.sendMessage(chatId,
          `📍 *${CATEGORIES[text]}*\n\nQuelle est votre adresse à Dakar?\n(Ex: Plateau, Rue 10, près du marché)`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(chatId, `Veuillez choisir un numéro entre 1 et ${Object.keys(CATEGORIES).length}.`);
      }
      break;

    // User: get address
    case 'get_address':
      session.data.address = text;
      session.state = 'get_description';
      bot.sendMessage(chatId,
        `💬 Décrivez brièvement votre problème:\n(Ex: "Mon frigo ne refroidit plus depuis hier")`,
        { parse_mode: 'Markdown' }
      );
      break;

    // User: get description → find providers
    case 'get_description':
      session.data.description = text;
      session.state = 'waiting';

      await bot.sendMessage(chatId, '🔍 Recherche du meilleur prestataire disponible...');

      // Save request
      const request = await saveRequest(
        String(chatId),
        session.data.category,
        session.data.description,
        session.data.address
      );

      if (request) {
        session.data.requestId = request.id;

        // Find providers
        const categoryKey = Object.entries(CATEGORIES).find(([k, v]) => v === session.data.category)?.[0];
        const providers = await findAvailableProviders(session.data.category);

        // Update request count for providers
        for (const p of providers) {
          await supabase
            .from('providers')
            .update({ total_requests: (p.total_requests || 0) + 1 })
            .eq('id', p.id);
        }

        if (providers.length === 0) {
          session.state = 'idle';
          bot.sendMessage(chatId,
            `😔 *Aucun prestataire disponible pour le moment.*\n\n` +
            `Réessayez dans 1 heure ou contactez-nous directement:\n📞 +221777527465`,
            { parse_mode: 'Markdown' }
          );
        } else {
          await notifyProviders(providers, request, bot);
          bot.sendMessage(chatId,
            `✅ *Demande envoyée!*\n\n` +
            `Nous avons notifié *${providers.length} prestataire(s)* disponible(s).\n` +
            `Vous serez contacté(e) très bientôt.\n\n` +
            `⏱️ Si personne ne répond dans 5 minutes, nous vous préviendrons.\n\n` +
            `📞 Support: +221777527465`,
            { parse_mode: 'Markdown' }
          );
          // Start 5-minute timeout
          setRequestTimeout(chatId, request.id);
        }
      }
      break;

    // Rating flow
    case 'rating':
      const score = parseInt(text);
      if (score >= 1 && score <= 5) {
        session.data.score = score;
        session.state = 'rating_comment';
        bot.sendMessage(chatId,
          `Voulez-vous laisser un commentaire? (Tapez votre commentaire ou *IGNORER*)`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(chatId, 'Veuillez répondre avec un chiffre entre 1 et 5.');
      }
      break;

    case 'rating_comment':
      const comment = text === 'IGNORER' ? null : text;
      await saveRating(
        session.data.requestId,
        session.data.providerId,
        String(chatId),
        session.data.score,
        comment
      );
      clearSession(chatId);
      bot.sendMessage(chatId,
        `⭐ *Merci pour votre avis!*\n\nVotre évaluation aide la communauté Vitfe.\n\nTapez /start pour une nouvelle demande.`,
        { parse_mode: 'Markdown' }
      );
      break;

    // Provider registration flow
    case 'provider_register':
      await handleProviderRegistration(chatId, text, session, bot);
      break;

    default:
      // Unknown message — guide user back
      bot.sendMessage(chatId,
        `👋 Tapez /start pour commencer.\n\n` +
        `Besoin d'aide? Contactez-nous:\n📞 +221777527465`,
        { parse_mode: 'Markdown' }
      );
  }
});

// ─────────────────────────────────────────
// PROVIDER REGISTRATION
// ─────────────────────────────────────────

async function handleProviderRegistration(chatId, text, session, bot) {
  const step = session.data.step;

  if (step === 'first_name') {
    session.data.first_name = text;
    session.data.step = 'last_name';
    bot.sendMessage(chatId, `Votre *nom de famille*?`, { parse_mode: 'Markdown' });

  } else if (step === 'last_name') {
    session.data.last_name = text;
    session.data.step = 'phone';
    bot.sendMessage(chatId, `Votre *numéro WhatsApp*? (Ex: +221771234567)`, { parse_mode: 'Markdown' });

  } else if (step === 'phone') {
    session.data.phone = text;
    session.data.step = 'category';
    bot.sendMessage(chatId,
      `Votre *métier*?\n\n${categoryMenu()}\n\nRépondez avec le numéro.`,
      { parse_mode: 'Markdown' }
    );

  } else if (step === 'category') {
    if (!CATEGORIES[text]) {
      return bot.sendMessage(chatId, 'Veuillez choisir un numéro valide.');
    }
    session.data.category = CATEGORIES[text];
    session.data.step = 'address';
    bot.sendMessage(chatId, `Votre *adresse* à Dakar?`, { parse_mode: 'Markdown' });

  } else if (step === 'address') {
    session.data.address = text;
    session.data.step = 'password';
    bot.sendMessage(chatId,
      `Créez un *mot de passe* pour votre tableau de bord Vitfe.\n(Minimum 6 caractères)`,
      { parse_mode: 'Markdown' }
    );

  } else if (step === 'password') {
    if (text.length < 6) {
      return bot.sendMessage(chatId, '❌ Mot de passe trop court. Minimum 6 caractères.');
    }
    session.data.password = text;

    // Save provider to database
    const { data, error } = await supabase
      .from('providers')
      .insert([{
        first_name: session.data.first_name,
        last_name: session.data.last_name,
        phone: session.data.phone,
        password: session.data.password,
        category: session.data.category,
        city: 'Dakar',
        address: session.data.address,
        telegram_chat_id: String(chatId),
        is_available: true,
        is_verified: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Provider registration error:', error);
      if (error.code === '23505') {
        bot.sendMessage(chatId, '❌ Ce numéro est déjà enregistré sur Vitfe.');
      } else {
        bot.sendMessage(chatId, '❌ Erreur lors de l\'inscription. Réessayez avec /start.');
      }
    } else {
      clearSession(chatId);
      bot.sendMessage(chatId,
        `🎉 *Bienvenue sur Vitfe, ${session.data.first_name}!*\n\n` +
        `✅ Votre compte a été créé.\n` +
        `⏳ En attente de vérification CNI.\n\n` +
        `*Prochaine étape:*\n` +
        `Envoyez une photo de votre CNI recto-verso à:\n` +
        `📞 +221777527465 sur WhatsApp\n\n` +
        `Une fois vérifié, vous recevrez les demandes de clients!\n\n` +
        `*Commandes utiles:*\n` +
        `/dispo — Activer/désactiver disponibilité\n` +
        `/stats — Voir vos statistiques\n` +
        `/aide — Aide`,
        { parse_mode: 'Markdown' }
      );
    }
  }
}

console.log('🚀 Vitfe bot is running...');

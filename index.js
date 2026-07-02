require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const express = require('express');

// Initialize
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { 
  polling: {
    autoStart: true,
    params: { timeout: 10 }
  }
});

// Clean shutdown — prevents 409 conflicts on Render redeploy
process.on('SIGTERM', () => {
  console.log('SIGTERM received — stopping bot polling...');
  bot.stopPolling().then(() => {
    console.log('Bot polling stopped cleanly.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  bot.stopPolling().then(() => process.exit(0));
});
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const app = express();

app.get('/', (req, res) => res.send('Vitfe bot is running! 🚀'));
app.listen(process.env.PORT || 3000);

// ─────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────

const MSG = {
  fr: {
    welcome_lang: `👋 *Bienvenue sur Vitfe!*\n\nChoisissez votre langue / Choose your language:\n\n1️⃣ Français\n2️⃣ English`,
    main_menu: `👋 *Bienvenue sur Vitfe!*\n\nVitfe connecte instantanément les clients aux meilleurs prestataires de services à Dakar.\n\nQue souhaitez-vous faire?\n\n1️⃣ J'ai besoin d'un service\n2️⃣ Je suis prestataire\n\nRépondez avec le numéro de votre choix.`,
    pick_category: `🔍 *Quel service recherchez-vous?*\n\n{categories}\n\nRépondez avec le numéro.`,
    ask_address: `📍 *{category}*\n\nQuelle est votre adresse à Dakar?\n(Ex: Plateau, Rue 10, près du marché)`,
    ask_description: `💬 Décrivez brièvement votre problème:\n(Ex: "Mon frigo ne refroidit plus depuis hier")`,
    searching: `🔍 Recherche du meilleur prestataire disponible...`,
    no_provider: `😔 *Aucun prestataire disponible pour le moment.*\n\nRéessayez dans 1 heure ou contactez-nous:\n📞 *+221777527465*\n\nTapez /start pour une nouvelle demande.`,
    request_sent: `✅ *Demande envoyée!*\n\nNous avons notifié *{count} prestataire(s)* disponible(s).\nVous serez contacté(e) très bientôt.\n\n⏱️ Si personne ne répond dans 5 minutes, nous vous préviendrons.\n\n📞 Support: +221777527465`,
    timeout: `😔 *Aucun prestataire disponible pour le moment.*\n\nTous nos prestataires sont occupés. Réessayez dans 1 heure ou contactez-nous:\n📞 *+221777527465*\n\nTapez /start pour une nouvelle demande.`,
    provider_notify: `🔔 *Nouvelle demande Vitfe!*\n\n📋 Service: {category}\n📍 Adresse: {address}\n💬 Détails: {description}\n\nVoulez-vous accepter cette demande?\nRépondez *OUI_{id}* pour accepter\nRépondez *NON_{id}* pour décliner`,
    provider_accepted_notify: `✅ *Bonne nouvelle!*\n\n{name} a accepté votre demande!\n📞 Contact: {phone}\n⭐ Note: {rating}\n\nIl/elle arrive bientôt. Bonne chance! 🙏`,
    provider_accepted: `✅ *Demande acceptée!*\n\n📞 Contactez le client: {phone}\n📍 Adresse: {address}\n\nUne fois le travail terminé, tapez:\n*TERMINE_{id}*`,
    already_taken: `❌ *Désolé, cette demande a déjà été acceptée par un autre prestataire.*\n\nVous recevrez la prochaine! 💪`,
    declined: `👍 Demande déclinée. Vous recevrez la prochaine.`,
    job_done: `✅ Parfait! Travail marqué comme terminé. Vous êtes de nouveau disponible.`,
    rate_provider: `🌟 *Évaluez votre prestataire*\n\nComment était votre expérience avec {name}?\n\n1️⃣ ⭐ Très mauvais\n2️⃣ ⭐⭐ Mauvais\n3️⃣ ⭐⭐⭐ Correct\n4️⃣ ⭐⭐⭐⭐ Bien\n5️⃣ ⭐⭐⭐⭐⭐ Excellent`,
    rate_invalid: `Veuillez répondre avec un chiffre entre 1 et 5.`,
    ask_comment: `Voulez-vous laisser un commentaire? (Tapez votre commentaire ou *IGNORER*)`,
    rating_thanks: `⭐ *Merci pour votre avis!*\n\nVotre évaluation aide la communauté Vitfe.\n\nTapez /start pour une nouvelle demande.`,
    provider_space: `👷 *Espace Prestataire Vitfe*\n\nÊtes-vous déjà inscrit sur vitfe.vercel.app?\n\n1️⃣ Oui, j'ai déjà un compte\n2️⃣ Non, je veux m'inscrire`,
    ask_phone_link: `📱 Entrez le numéro WhatsApp utilisé lors de votre inscription:\n(Ex: +221771234567)`,
    account_not_found: `❌ Aucun compte trouvé avec ce numéro.\n\nVérifiez le numéro ou tapez /start pour vous inscrire.`,
    account_linked: `✅ *Compte lié avec succès!*\n\nBienvenue {name}! 🎉\n\n{verified}\n\n*Commandes utiles:*\n/dispo — Activer/désactiver disponibilité\n/stats — Voir vos statistiques\n/aide — Aide`,
    verified_yes: `✅ Votre compte est vérifié. Vous recevrez les demandes de clients!`,
    verified_no: `⏳ Votre CNI est en cours de vérification.\nEnvoyez votre CNI à +221777527465 sur WhatsApp si ce n'est pas encore fait.`,
    register_start: `👷 *Inscription prestataire Vitfe*\n\nPour commencer, quel est votre *prénom*?`,
    ask_lastname: `Votre *nom de famille*?`,
    ask_phone: `Votre *numéro WhatsApp*? (Ex: +221771234567)`,
    ask_job: `Votre *métier*?\n\n{categories}\n\nRépondez avec le numéro.`,
    ask_address_provider: `Votre *adresse* à Dakar?`,
    ask_password: `Créez un *mot de passe* pour votre tableau de bord Vitfe.\n(Minimum 6 caractères)`,
    password_short: `❌ Mot de passe trop court. Minimum 6 caractères.`,
    already_registered: `❌ Ce numéro est déjà enregistré sur Vitfe.`,
    register_error: `❌ Erreur lors de l'inscription. Réessayez avec /start.`,
    register_success: `🎉 *Bienvenue sur Vitfe, {name}!*\n\n✅ Votre compte a été créé.\n⏳ En attente de vérification CNI.\n\n*Prochaine étape:*\nEnvoyez une photo de votre CNI recto-verso à:\n📞 +221777527465 sur WhatsApp\n\nUne fois vérifié, vous recevrez les demandes de clients!\n\n*Commandes utiles:*\n/dispo — Activer/désactiver disponibilité\n/stats — Voir vos statistiques\n/aide — Aide`,
    not_provider: `❌ Vous n'êtes pas enregistré comme prestataire. Tapez /start pour commencer.`,
    now_available: `✅ Vous êtes maintenant *disponible*. Vous recevrez les nouvelles demandes.`,
    now_unavailable: `⏸️ Vous êtes maintenant *indisponible*. Vous ne recevrez pas de demandes.`,
    stats: `📊 *Vos statistiques Vitfe*\n\n👤 {name}\n🔧 {category}\n📍 {city}\n🟢 Disponible: {available}\n✅ Vérifié: {verified}\n\n📈 *Ce mois-ci:*\n🔔 Demandes reçues: {requests}\n✅ Acceptées: {accepted}\n⭐ Note moyenne: {rating}\n🗳️ Nombre d'avis: {total_ratings}`,
    stats_reviews: `\n\n⭐ *Derniers avis:*\n{reviews}`,
    yes_label: `Oui`,
    no_label: `Non`,
    help: `ℹ️ *Commandes Vitfe:*\n\n/start — Recommencer\n/dispo — Activer/désactiver disponibilité (prestataires)\n/stats — Voir vos statistiques (prestataires)\n/aide — Afficher cette aide\n\n📞 *Support:* +221777527465`,
    invalid_choice: `Veuillez répondre avec *1* ou *2*.`,
    invalid_category: `Veuillez choisir un numéro valide.`,
    fallback: `👋 Tapez /start pour commencer.\n\nBesoin d'aide? Contactez-nous:\n📞 +221777527465`,
    checkin: `👋 *Bonjour {name}!*\n\nÊtes-vous toujours disponible pour des missions ce mois-ci?\n\nRépondez *OUI* pour rester visible dans les résultats Vitfe.\n\n⏱️ Sans réponse sous 48h, votre profil sera temporairement masqué jusqu'à votre prochaine confirmation.`,
    checkin_confirmed: `✅ *Merci!* Vous restez visible dans les résultats Vitfe ce mois-ci. 🙌`,
  },
  en: {
    welcome_lang: `👋 *Welcome to Vitfe!*\n\nChoose your language / Choisissez votre langue:\n\n1️⃣ Français\n2️⃣ English`,
    main_menu: `👋 *Welcome to Vitfe!*\n\nVitfe instantly connects clients with the best service providers in Dakar.\n\nWhat would you like to do?\n\n1️⃣ I need a service\n2️⃣ I am a provider\n\nReply with the number of your choice.`,
    pick_category: `🔍 *What service are you looking for?*\n\n{categories}\n\nReply with the number.`,
    ask_address: `📍 *{category}*\n\nWhat is your address in Dakar?\n(Ex: Plateau, Street 10, near the market)`,
    ask_description: `💬 Briefly describe your problem:\n(Ex: "My fridge stopped cooling since yesterday")`,
    searching: `🔍 Searching for the best available provider...`,
    no_provider: `😔 *No provider available at the moment.*\n\nTry again in 1 hour or contact us:\n📞 *+221777527465*\n\nType /start for a new request.`,
    request_sent: `✅ *Request sent!*\n\nWe notified *{count} available provider(s)*.\nYou will be contacted very soon.\n\n⏱️ If nobody responds within 5 minutes, we will let you know.\n\n📞 Support: +221777527465`,
    timeout: `😔 *No provider available at the moment.*\n\nAll our providers are busy. Try again in 1 hour or contact us:\n📞 *+221777527465*\n\nType /start for a new request.`,
    provider_notify: `🔔 *New Vitfe Request!*\n\n📋 Service: {category}\n📍 Address: {address}\n💬 Details: {description}\n\nDo you want to accept this request?\nReply *OUI_{id}* to accept\nReply *NON_{id}* to decline`,
    provider_accepted_notify: `✅ *Good news!*\n\n{name} accepted your request!\n📞 Contact: {phone}\n⭐ Rating: {rating}\n\nThey are on their way. Good luck! 🙏`,
    provider_accepted: `✅ *Request accepted!*\n\n📞 Contact the client: {phone}\n📍 Address: {address}\n\nOnce the job is done, type:\n*TERMINE_{id}*`,
    already_taken: `❌ *Sorry, this request has already been accepted by another provider.*\n\nYou will get the next one! 💪`,
    declined: `👍 Request declined. You will get the next one.`,
    job_done: `✅ Great! Job marked as complete. You are available again.`,
    rate_provider: `🌟 *Rate your provider*\n\nHow was your experience with {name}?\n\n1️⃣ ⭐ Very bad\n2️⃣ ⭐⭐ Bad\n3️⃣ ⭐⭐⭐ OK\n4️⃣ ⭐⭐⭐⭐ Good\n5️⃣ ⭐⭐⭐⭐⭐ Excellent`,
    rate_invalid: `Please reply with a number between 1 and 5.`,
    ask_comment: `Would you like to leave a comment? (Type your comment or *SKIP*)`,
    rating_thanks: `⭐ *Thank you for your review!*\n\nYour rating helps the Vitfe community.\n\nType /start for a new request.`,
    provider_space: `👷 *Vitfe Provider Area*\n\nAre you already registered on vitfe.vercel.app?\n\n1️⃣ Yes, I already have an account\n2️⃣ No, I want to register`,
    ask_phone_link: `📱 Enter the WhatsApp number used when you signed up:\n(Ex: +221771234567)`,
    account_not_found: `❌ No account found with this number.\n\nCheck the number or type /start to register.`,
    account_linked: `✅ *Account linked successfully!*\n\nWelcome {name}! 🎉\n\n{verified}\n\n*Useful commands:*\n/dispo — Toggle availability\n/stats — View your stats\n/aide — Help`,
    verified_yes: `✅ Your account is verified. You will receive client requests!`,
    verified_no: `⏳ Your ID is being verified.\nSend your ID to +221777527465 on WhatsApp if you haven't done so yet.`,
    register_start: `👷 *Vitfe Provider Registration*\n\nLet's start — what is your *first name*?`,
    ask_lastname: `Your *last name*?`,
    ask_phone: `Your *WhatsApp number*? (Ex: +221771234567)`,
    ask_job: `Your *profession*?\n\n{categories}\n\nReply with the number.`,
    ask_address_provider: `Your *address* in Dakar?`,
    ask_password: `Create a *password* for your Vitfe dashboard.\n(Minimum 6 characters)`,
    password_short: `❌ Password too short. Minimum 6 characters.`,
    already_registered: `❌ This number is already registered on Vitfe.`,
    register_error: `❌ Registration error. Try again with /start.`,
    register_success: `🎉 *Welcome to Vitfe, {name}!*\n\n✅ Your account has been created.\n⏳ Waiting for ID verification.\n\n*Next step:*\nSend a photo of your ID (front and back) to:\n📞 +221777527465 on WhatsApp\n\nOnce verified, you will receive client requests!\n\n*Useful commands:*\n/dispo — Toggle availability\n/stats — View your stats\n/aide — Help`,
    not_provider: `❌ You are not registered as a provider. Type /start to begin.`,
    now_available: `✅ You are now *available*. You will receive new requests.`,
    now_unavailable: `⏸️ You are now *unavailable*. You will not receive requests.`,
    stats: `📊 *Your Vitfe Stats*\n\n👤 {name}\n🔧 {category}\n📍 {city}\n🟢 Available: {available}\n✅ Verified: {verified}\n\n📈 *This month:*\n🔔 Requests received: {requests}\n✅ Accepted: {accepted}\n⭐ Average rating: {rating}\n🗳️ Number of reviews: {total_ratings}`,
    stats_reviews: `\n\n⭐ *Latest reviews:*\n{reviews}`,
    yes_label: `Yes`,
    no_label: `No`,
    help: `ℹ️ *Vitfe Commands:*\n\n/start — Restart\n/dispo — Toggle availability (providers)\n/stats — View your stats (providers)\n/aide — Show this help\n\n📞 *Support:* +221777527465`,
    invalid_choice: `Please reply with *1* or *2*.`,
    invalid_category: `Please choose a valid number.`,
    fallback: `👋 Type /start to begin.\n\nNeed help? Contact us:\n📞 +221777527465`,
    checkin: `👋 *Hello {name}!*\n\nAre you still available for jobs this month?\n\nReply *OUI* to stay visible in Vitfe results.\n\n⏱️ Without a response within 48h, your profile will be temporarily hidden until your next confirmation.`,
    checkin_confirmed: `✅ *Thank you!* You remain visible in Vitfe results this month. 🙌`,
  }
};

// Translation helper — replaces {placeholders} with values
function t(lang, key, vars = {}) {
  const l = lang || 'fr';
  let msg = MSG[l][key] || MSG['fr'][key] || key;
  Object.entries(vars).forEach(([k, v]) => {
    msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return msg;
}

// Categories — bilingual
const CATEGORIES_FR = {
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

const CATEGORIES_EN = {
  '1': '🔧 Mechanic',
  '2': '❄️ Fridge/AC Technician',
  '3': '⚡ Electrician',
  '4': '🚿 Plumber',
  '5': '🪡 Tailor/Seamstress',
  '6': '📱 Phone Repair',
  '7': '🏠 Carpenter',
  '8': '🎨 Painter',
  '9': '🍽️ Caterer/Cook',
  '10': '🛵 Delivery',
  '11': '➕ Other'
};

// Keep CATEGORIES as French for backward compatibility with DB values
const CATEGORIES = CATEGORIES_FR;

function categoryMenu(lang = 'fr') {
  const cats = lang === 'en' ? CATEGORIES_EN : CATEGORIES_FR;
  return Object.entries(cats).map(([k, v]) => `${k}. ${v}`).join('\n');
}

function getCategoryName(num, lang = 'fr') {
  const cats = lang === 'en' ? CATEGORIES_EN : CATEGORIES_FR;
  return cats[num] || CATEGORIES_FR[num];
}

// ─────────────────────────────────────────
// SESSION MANAGEMENT (In-Memory)
// ─────────────────────────────────────────

const requestTimeouts = {};
const memorySessions = {};

async function getSession(chatId) {
  return memorySessions[String(chatId)] || { state: 'idle', data: {}, lang: 'fr' };
}

async function setSession(chatId, state, sessionData = {}, lang = null) {
  const existing = memorySessions[String(chatId)] || { lang: 'fr' };
  const finalLang = lang || existing.lang || 'fr';
  memorySessions[String(chatId)] = { state, data: sessionData, lang: finalLang };
  console.log(`[SESSION] chatId:${chatId} state:${state} lang:${finalLang}`);
}

async function clearSession(chatId) {
  delete memorySessions[String(chatId)];
}

function setRequestTimeout(chatId, requestId, lang) {
  if (requestTimeouts[chatId]) clearTimeout(requestTimeouts[chatId]);
  requestTimeouts[chatId] = setTimeout(async () => {
    const { data: request } = await supabase.from('requests').select('status').eq('id', requestId).single();
    if (request && request.status === 'pending') {
      await supabase.from('requests').update({ status: 'expired' }).eq('id', requestId);
      bot.sendMessage(chatId, t(lang, 'timeout'), { parse_mode: 'Markdown' });
      clearSession(chatId);
    }
    delete requestTimeouts[chatId];
  }, 5 * 60 * 1000);
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

async function findAvailableProviders(category) {
  const { data, error } = await supabase
    .from('providers').select('*')
    .eq('category', category).eq('is_available', true).eq('is_verified', true)
    .order('rating', { ascending: false });
  if (error) console.error('Error finding providers:', error);
  return data || [];
}

async function saveRequest(userPhone, category, description, address) {
  const { data, error } = await supabase
    .from('requests')
    .insert([{ user_phone: userPhone, category, description, address, status: 'pending' }])
    .select().single();
  if (error) console.error('Error saving request:', error);
  return data;
}

async function notifyProviders(providers, request, userLang) {
  for (const provider of providers) {
    if (!provider.telegram_chat_id) continue;
    const provLang = 'fr'; // providers always get French for now
    await bot.sendMessage(provider.telegram_chat_id,
      t(provLang, 'provider_notify', {
        category: request.category,
        address: request.address || (userLang === 'en' ? 'Not specified' : 'Non précisé'),
        description: request.description || (userLang === 'en' ? 'No details' : 'Aucun détail'),
        id: request.id
      }),
      { parse_mode: 'Markdown' }
    );
  }
}

async function updateProviderAvailability(phone, isAvailable) {
  await supabase.from('providers').update({ is_available: isAvailable, last_active: new Date() }).eq('phone', phone);
}

async function getProviderByTelegramId(chatId) {
  const { data } = await supabase.from('providers').select('*').eq('telegram_chat_id', String(chatId)).single();
  return data;
}

async function saveRating(requestId, providerId, userPhone, score, comment) {
  await supabase.from('ratings').insert([{ request_id: requestId, provider_id: providerId, user_phone: userPhone, score, comment }]);
  const { data: ratings } = await supabase.from('ratings').select('score').eq('provider_id', providerId);
  if (ratings && ratings.length > 0) {
    const avg = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
    await supabase.from('providers').update({ rating: avg.toFixed(1), total_ratings: ratings.length }).eq('id', providerId);
  }
}

// ─────────────────────────────────────────
// MONTHLY CHECK-IN
// ─────────────────────────────────────────

async function sendMonthlyCheckIns() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: providers, error } = await supabase
    .from('providers').select('*').eq('is_verified', true)
    .or(`last_checkin.is.null,last_checkin.lt.${thirtyDaysAgo.toISOString()}`);
  if (error || !providers) return;
  for (const provider of providers) {
    if (!provider.telegram_chat_id) continue;
    try {
      await bot.sendMessage(provider.telegram_chat_id,
        t('fr', 'checkin', { name: provider.first_name }),
        { parse_mode: 'Markdown' }
      );
      await supabase.from('providers').update({ checkin_sent_at: new Date() }).eq('id', provider.id);
    } catch (e) {
      console.error(`Check-in failed for provider ${provider.id}:`, e.message);
    }
  }
  console.log(`📋 Monthly check-in sent to ${providers.length} provider(s).`);
}

async function hideUnresponsiveProviders() {
  const fortyEightHoursAgo = new Date();
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
  const { data: providers, error } = await supabase
    .from('providers').select('id, first_name, checkin_sent_at, last_checkin')
    .not('checkin_sent_at', 'is', null)
    .lt('checkin_sent_at', fortyEightHoursAgo.toISOString());
  if (error || !providers) return;
  for (const provider of providers) {
    const confirmedAfterCheckin = provider.last_checkin &&
      new Date(provider.last_checkin) > new Date(provider.checkin_sent_at);
    if (!confirmedAfterCheckin) {
      await supabase.from('providers').update({ is_available: false }).eq('id', provider.id);
      console.log(`⏸️ Provider ${provider.first_name} auto-hidden — no check-in response.`);
    }
  }
}

setInterval(sendMonthlyCheckIns, 24 * 60 * 60 * 1000);
setInterval(hideUnresponsiveProviders, 60 * 60 * 1000);
setTimeout(sendMonthlyCheckIns, 60 * 1000);
setTimeout(hideUnresponsiveProviders, 90 * 1000);

// ─────────────────────────────────────────
// BOT COMMANDS
// ─────────────────────────────────────────

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await clearSession(chatId);
  await setSession(chatId, 'pick_lang', {});
  await bot.sendMessage(chatId, t('fr', 'welcome_lang'), { parse_mode: 'Markdown' });
});

bot.onText(/\/dispo/, async (msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);
  const lang = session.lang || 'fr';
  const provider = await getProviderByTelegramId(chatId);
  if (!provider) return bot.sendMessage(chatId, t(lang, 'not_provider'));
  const newStatus = !provider.is_available;
  await updateProviderAvailability(provider.phone, newStatus);
  bot.sendMessage(chatId, t(lang, newStatus ? 'now_available' : 'now_unavailable'), { parse_mode: 'Markdown' });
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const session = await getSession(chatId);
  const lang = session.lang || 'fr';
  const provider = await getProviderByTelegramId(chatId);
  if (!provider) return bot.sendMessage(chatId, t(lang, 'not_provider'));

  const { data: ratings } = await supabase
    .from('ratings').select('score, comment').eq('provider_id', provider.id)
    .order('created_at', { ascending: false }).limit(5);

  let statsMsg = t(lang, 'stats', {
    name: `${provider.first_name} ${provider.last_name}`,
    category: provider.category,
    city: provider.city,
    available: provider.is_available ? (lang === 'en' ? 'Yes' : 'Oui') : (lang === 'en' ? 'No' : 'Non'),
    verified: provider.is_verified ? (lang === 'en' ? 'Yes' : 'Oui') : (lang === 'en' ? 'No' : 'Non'),
    requests: provider.total_requests || 0,
    accepted: provider.total_accepted || 0,
    rating: provider.rating || (lang === 'en' ? 'Not yet rated' : 'Pas encore noté'),
    total_ratings: provider.total_ratings || 0
  });

  if (ratings && ratings.length > 0) {
    const reviewLines = ratings.map(r => `${'⭐'.repeat(r.score)} ${r.comment || (lang === 'en' ? 'No comment' : 'Pas de commentaire')}`).join('\n');
    statsMsg += t(lang, 'stats_reviews', { reviews: reviewLines });
  }

  bot.sendMessage(chatId, statsMsg, { parse_mode: 'Markdown' });
});

bot.onText(/\/aide/, async (msg) => {
  const session = await getSession(msg.chat.id);
  bot.sendMessage(msg.chat.id, t(session.lang || 'fr', 'help'), { parse_mode: 'Markdown' });
});

// ─────────────────────────────────────────
// MAIN MESSAGE HANDLER
// ─────────────────────────────────────────

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text || text.startsWith('/')) return;

  const session = await getSession(chatId);
  const lang = session.lang || 'fr';

  console.log(`[DEBUG] chatId:${chatId} state:${session.state} lang:${lang} text:${text}`);
  if (text.toUpperCase() === 'OUI' && session.state !== 'waiting') {
    const provider = await getProviderByTelegramId(chatId);
    if (provider) {
      await supabase.from('providers').update({ last_checkin: new Date(), is_available: true }).eq('id', provider.id);
      return bot.sendMessage(chatId, t(lang, 'checkin_confirmed'), { parse_mode: 'Markdown' });
    }
  }

  // ── Provider accepting/declining requests ──
  if (text.startsWith('OUI_') || text.startsWith('NON_')) {
    const parts = text.split('_');
    const action = parts[0];
    const requestId = parts[1];
    const provider = await getProviderByTelegramId(chatId);
    if (!provider) return;

    if (action === 'OUI') {
      const { data: updatedRequests, error: updateError } = await supabase
        .from('requests')
        .update({ provider_id: provider.id, status: 'accepted', accepted_at: new Date() })
        .eq('id', requestId).eq('status', 'pending').select();

      const request = updatedRequests?.[0];
      if (!request || updateError) {
        return bot.sendMessage(chatId, t(lang, 'already_taken'), { parse_mode: 'Markdown' });
      }

      await supabase.from('providers').update({
        total_accepted: (provider.total_accepted || 0) + 1,
        is_available: false
      }).eq('id', provider.id);

      bot.sendMessage(chatId,
        t(lang, 'provider_accepted', {
          phone: request.user_phone,
          address: request.address || (lang === 'en' ? 'To confirm with client' : 'À confirmer avec le client'),
          id: requestId
        }),
        { parse_mode: 'Markdown' }
      );

      // Notify user — find their session
      const { data: userSession } = await supabase
        .from('sessions').select('*').eq('session_data->>requestId', requestId).single().catch(() => ({ data: null }));

      if (userSession) {
        const userLang = userSession.lang || 'fr';
        bot.sendMessage(userSession.chat_id,
          t(userLang, 'provider_accepted_notify', {
            name: `${provider.first_name} ${provider.last_name}`,
            phone: provider.phone,
            rating: provider.rating || (userLang === 'en' ? 'New' : 'Nouveau')
          }),
          { parse_mode: 'Markdown' }
        );
      }

    } else {
      bot.sendMessage(chatId, t(lang, 'declined'));
    }
    return;
  }

  // ── Job completion ──
  if (text.startsWith('TERMINE_')) {
    const requestId = text.split('_')[1];
    const provider = await getProviderByTelegramId(chatId);
    if (!provider) return;

    await supabase.from('requests').update({ status: 'completed', completed_at: new Date() }).eq('id', requestId);
    await supabase.from('providers').update({ is_available: true }).eq('id', provider.id);
    bot.sendMessage(chatId, t(lang, 'job_done'));

    // Ask user to rate
    const { data: request } = await supabase.from('requests').select('*').eq('id', requestId).single();
    if (request) {
      const { data: userSession } = await supabase
        .from('sessions').select('*').eq('chat_id', request.user_phone).single().catch(() => ({ data: null }));
      const userLang = userSession?.lang || 'fr';
      await setSession(request.user_phone, 'rating', { requestId, providerId: provider.id, providerName: `${provider.first_name} ${provider.last_name}` }, userLang);
      bot.sendMessage(request.user_phone,
        t(userLang, 'rate_provider', { name: `${provider.first_name} ${provider.last_name}` }),
        { parse_mode: 'Markdown' }
      );
    }
    return;
  }

  // ── STATE MACHINE ──
  switch (session.state) {

    // Language picker
    case 'pick_lang':
    case 'idle':
      if (text === '1') {
        await setSession(chatId, 'main_menu', {}, 'fr');
        bot.sendMessage(chatId, t('fr', 'main_menu'), { parse_mode: 'Markdown' });
      } else if (text === '2') {
        await setSession(chatId, 'main_menu', {}, 'en');
        bot.sendMessage(chatId, t('en', 'main_menu'), { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, t('fr', 'welcome_lang'), { parse_mode: 'Markdown' });
      }
      break;

    case 'main_menu':
      if (text === '1') {
        await setSession(chatId, 'select_category', {}, lang);
        bot.sendMessage(chatId, t(lang, 'pick_category', { categories: categoryMenu(lang) }), { parse_mode: 'Markdown' });
      } else if (text === '2') {
        await setSession(chatId, 'provider_new_or_existing', {}, lang);
        bot.sendMessage(chatId, t(lang, 'provider_space'), { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, t(lang, 'invalid_choice'), { parse_mode: 'Markdown' });
      }
      break;

    case 'select_category':
      if (CATEGORIES_FR[text]) {
        const categoryFR = CATEGORIES_FR[text]; // always store French in DB
        const categoryDisplay = getCategoryName(text, lang); // show in user's language
        await setSession(chatId, 'get_address', { category: categoryFR }, lang);
        bot.sendMessage(chatId, t(lang, 'ask_address', { category: categoryDisplay }), { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, t(lang, 'invalid_category'));
      }
      break;

    case 'get_address':
      await setSession(chatId, 'get_description', { ...session.data, address: text }, lang);
      bot.sendMessage(chatId, t(lang, 'ask_description'), { parse_mode: 'Markdown' });
      break;

    case 'get_description':
      await setSession(chatId, 'waiting', { ...session.data, description: text }, lang);
      await bot.sendMessage(chatId, t(lang, 'searching'));

      const request = await saveRequest(String(chatId), session.data.category, text, session.data.address);
      if (request) {
        await setSession(chatId, 'waiting', { ...session.data, description: text, requestId: request.id }, lang);
        const providers = await findAvailableProviders(session.data.category);
        for (const p of providers) {
          await supabase.from('providers').update({ total_requests: (p.total_requests || 0) + 1 }).eq('id', p.id);
        }
        if (providers.length === 0) {
          await clearSession(chatId);
          bot.sendMessage(chatId, t(lang, 'no_provider'), { parse_mode: 'Markdown' });
        } else {
          await notifyProviders(providers, request, lang);
          bot.sendMessage(chatId, t(lang, 'request_sent', { count: providers.length }), { parse_mode: 'Markdown' });
          setRequestTimeout(chatId, request.id, lang);
        }
      }
      break;

    case 'rating':
      const score = parseInt(text);
      if (score >= 1 && score <= 5) {
        await setSession(chatId, 'rating_comment', { ...session.data, score }, lang);
        bot.sendMessage(chatId, t(lang, 'ask_comment'), { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, t(lang, 'rate_invalid'));
      }
      break;

    case 'rating_comment':
      const skipWord = lang === 'en' ? 'SKIP' : 'IGNORER';
      const comment = (text.toUpperCase() === 'SKIP' || text.toUpperCase() === 'IGNORER') ? null : text;
      await saveRating(session.data.requestId, session.data.providerId, String(chatId), session.data.score, comment);
      await clearSession(chatId);
      bot.sendMessage(chatId, t(lang, 'rating_thanks'), { parse_mode: 'Markdown' });
      break;

    case 'provider_new_or_existing':
      if (text === '1') {
        await setSession(chatId, 'provider_link', {}, lang);
        bot.sendMessage(chatId, t(lang, 'ask_phone_link'), { parse_mode: 'Markdown' });
      } else if (text === '2') {
        await setSession(chatId, 'provider_register', { step: 'first_name' }, lang);
        bot.sendMessage(chatId, t(lang, 'register_start'), { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, t(lang, 'invalid_choice'), { parse_mode: 'Markdown' });
      }
      break;

    case 'provider_link':
      const { data: existingProvider } = await supabase.from('providers').select('*').eq('phone', text).single();
      if (!existingProvider) {
        bot.sendMessage(chatId, t(lang, 'account_not_found'), { parse_mode: 'Markdown' });
        await clearSession(chatId);
      } else {
        await supabase.from('providers').update({ telegram_chat_id: String(chatId) }).eq('phone', text);
        await clearSession(chatId);
        bot.sendMessage(chatId,
          t(lang, 'account_linked', {
            name: `${existingProvider.first_name} ${existingProvider.last_name}`,
            verified: t(lang, existingProvider.is_verified ? 'verified_yes' : 'verified_no')
          }),
          { parse_mode: 'Markdown' }
        );
      }
      break;

    case 'provider_register':
      await handleProviderRegistration(chatId, text, session, lang);
      break;

    default:
      bot.sendMessage(chatId, t(lang, 'fallback'), { parse_mode: 'Markdown' });
  }
});

// ─────────────────────────────────────────
// PROVIDER REGISTRATION
// ─────────────────────────────────────────

async function handleProviderRegistration(chatId, text, session, lang) {
  const step = session.data.step;

  if (step === 'first_name') {
    await setSession(chatId, 'provider_register', { ...session.data, first_name: text, step: 'last_name' }, lang);
    bot.sendMessage(chatId, t(lang, 'ask_lastname'), { parse_mode: 'Markdown' });

  } else if (step === 'last_name') {
    await setSession(chatId, 'provider_register', { ...session.data, last_name: text, step: 'phone' }, lang);
    bot.sendMessage(chatId, t(lang, 'ask_phone'), { parse_mode: 'Markdown' });

  } else if (step === 'phone') {
    await setSession(chatId, 'provider_register', { ...session.data, phone: text, step: 'category' }, lang);
    bot.sendMessage(chatId, t(lang, 'ask_job', { categories: categoryMenu(lang) }), { parse_mode: 'Markdown' });

  } else if (step === 'category') {
    if (!CATEGORIES_FR[text]) return bot.sendMessage(chatId, t(lang, 'invalid_category'));
    await setSession(chatId, 'provider_register', { ...session.data, category: CATEGORIES_FR[text], step: 'address' }, lang);
    bot.sendMessage(chatId, t(lang, 'ask_address_provider'), { parse_mode: 'Markdown' });

  } else if (step === 'address') {
    await setSession(chatId, 'provider_register', { ...session.data, address: text, step: 'password' }, lang);
    bot.sendMessage(chatId, t(lang, 'ask_password'), { parse_mode: 'Markdown' });

  } else if (step === 'password') {
    if (text.length < 6) return bot.sendMessage(chatId, t(lang, 'password_short'));
    await setSession(chatId, 'provider_register', { ...session.data, password: text, step: 'done' }, lang);

    const { data, error } = await supabase.from('providers').insert([{
      first_name: session.data.first_name,
      last_name: session.data.last_name,
      phone: session.data.phone,
      password: text,
      category: session.data.category,
      city: 'Dakar',
      address: session.data.address,
      telegram_chat_id: String(chatId),
      is_available: true,
      is_verified: false
    }]).select().single();

    if (error) {
      console.error('Registration error:', error);
      bot.sendMessage(chatId, t(lang, error.code === '23505' ? 'already_registered' : 'register_error'));
    } else {
      await clearSession(chatId);
      bot.sendMessage(chatId, t(lang, 'register_success', { name: session.data.first_name }), { parse_mode: 'Markdown' });
    }
  }
}

console.log('🚀 Vitfe bot is running...');

// Test Supabase connection on startup
(async () => {
  const { data, error } = await supabase
    .from('sessions')
    .upsert([{ chat_id: 'startup_test', state: 'test', session_data: {}, lang: 'fr', updated_at: new Date() }], { onConflict: 'chat_id' });
  if (error) console.error('❌ Supabase connection FAILED:', JSON.stringify(error));
  else console.log('✅ Supabase connection OK');
})();

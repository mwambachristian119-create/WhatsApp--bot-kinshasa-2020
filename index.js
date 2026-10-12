import qrcode from 'qrcode-terminal';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('=== SCANNEZ CE QR CODE AVEC VOTRE TÉLÉPHONE ===');
});

client.on('ready', () => {
    console.log('✅ Client WhatsApp prêt ! Le bot professionnel est en ligne.');
});

client.on('message', async (msg) => {
    // Ignorer les messages de groupe et les statuts
    if (msg.from.endsWith('@g.us') || msg.isStatus) return;

    const texte = msg.body.toLowerCase().trim();
    console.log(`[Message de ${msg.from}] : ${msg.body}`);

    let reponse = "";

    // 1. SALUTATIONS
    if (texte.includes('bonjour') || texte.includes('salut') || texte.includes('mbote') || texte.includes('bonsoir') || texte.includes('hello')) {
        reponse = `👋 *Bonjour et bienvenue !*\n\nMerci de contacter notre service client à Kinshasa. Comment pouvons-nous vous aider aujourd'hui ?\n\n📌 Tapez *menu* à tout moment pour afficher nos options.`;
    }

    // 2. MENU PRINCIPAL
    else if (texte === 'menu' || texte === 'options' || texte === 'aide') {
        reponse = `📋 *MENU SERVICE CLIENT*\n` +
                  `-----------------------------------\n` +
                  `Veuillez taper le numéro ou le mot-clé de votre choix :\n\n` +
                  `1️⃣ *Services* : Découvrez nos offres et produits\n` +
                  `2️⃣ *Tarifs* : Obtenir des informations sur nos prix\n` +
                  `3️⃣ *Livraison* : Modes et zones de livraison\n` +
                  `4️⃣ *Paiement* : Options de règlement (Mobile Money, Cash)\n` +
                  `5️⃣ *Adresse* : Nos horaires et localisation\n` +
                  `6️⃣ *Agent* : Parler directement à un conseiller\n\n` +
                  `-----------------------------------\n` +
                  `✍️ *Posez votre question directement ou tapez un chiffre !*`;
    }

    // 3. SERVICES & PRODUITS
    else if (texte === '1' || texte.includes('service') || texte.includes('produit') || texte.includes('catalogue') || texte.includes('offre')) {
        reponse = `🛍️ *NOS SERVICES & PRODUITS*\n\n` +
                  `Nous proposons une gamme complète de solutions adaptées à vos besoins :\n` +
                  `• Service / Produit 1\n` +
                  `• Service / Produit 2\n` +
                  `• Service / Produit 3\n\n` +
                  `💡 *Tapez "tarifs" pour connaître nos prix ou "agent" pour passer commande.*`;
    }

    // 4. TARIFS & DEVIS
    else if (texte === '2' || texte.includes('tarif') || texte.includes('prix') || texte.includes('combien') || texte.includes('devis')) {
        reponse = `💳 *TARIFS & DEVIS*\n\n` +
                  `Nos prix sont étudiés pour vous offrir le meilleur rapport qualité/prix à Kinshasa.\n\n` +
                  `• Pour consulter notre grille tarifaire standard, demandez notre catalogue.\n` +
                  `• Pour un devis sur mesure, envoyez-nous la description exacte de votre besoin.\n\n` +
                  `📞 *Besoin d'aide immédiate ? Tapez "agent".*`;
    }

    // 5. LIVRAISON & EXPÉDITION
    else if (texte === '3' || texte.includes('livraison') || texte.includes('livrer') || texte.includes('expedition') || texte.includes('transport')) {
        reponse = `🚚 *LIVRAISON A KINSHASA*\n\n` +
                  `• Nous livrons dans toutes les communes de Kinshasa.\n` +
                  `• Délais : Entre 24h et 48h selon la zone.\n` +
                  `• Les frais de livraison sont calculés selon votre commune d'habitation.\n\n` +
                  `📍 Indiquez-nous votre commune pour évaluer les frais de transport !`;
    }

    // 6. MODES DE PAIEMENT
    else if (texte === '4' || texte.includes('paiement') || texte.includes('payer') || texte.includes('m-pesa') || texte.includes('orange money') || texte.includes('airtel money')) {
        reponse = `💰 *MODES DE PAIEMENT ACCEPTÉS*\n\n` +
                  `Pour votre commodité, nous acceptons :\n` +
                  `✅ Mobile Money (M-Pesa, Orange Money, Airtel Money)\n` +
                  `✅ Espèces à la livraison ou au bureau (USD / CDF)\n` +
                  `✅ Virement bancaire\n\n` +
                  `🔒 Tous nos paiements sont sécurisés.`;
    }

    // 7. HORAIRES & ADRESSE / LOCALISATION
    else if (texte === '5' || texte.includes('adresse') || texte.includes('horaire') || texte.includes('localisation') || texte.includes('ou etes vous') || texte.includes('bureau')) {
        reponse = `📍 *NOS COORDONNÉES & HORAIRES*\n\n` +
                  `🏢 *Adresse* : Kinshasa, RDC\n` +
                  `🕒 *Horaires d'ouverture* :\n` +
                  `   • Lundi à Vendredi : 08h00 - 17h00\n` +
                  `   • Samedi : 08h30 - 13h00\n` +
                  `   • Dimanche & Jours fériés : Fermé\n\n` +
                  `📱 Tapez *agent* si vous souhaitez recevoir une localisation GPS.`;
    }

    // 8. CONTACT HUMAIN / AGENT
    else if (texte === '6' || texte.includes('agent') || texte.includes('humain') || texte.includes('conseiller') || texte.includes('appel') || texte.includes('parler')) {
        reponse = `👤 *MISE EN RELATION AVEC UN CONSEILLER*\n\n` +
                  `Un membre de notre équipe va prendre le relais très rapidement pour vous répondre directement.\n\n` +
                  `Veuillez nous laisser votre message détaillé ou votre numéro de téléphone ci-dessous. 📝`;
    }

    // 9. RÉPONSE PAR DÉFAUT
    else {
        reponse = `🤖 *Assistant Virtuel*\n\n` +
                  `Je n'ai pas bien compris votre message.\n\n` +
                  `👉 Tapez *menu* pour voir la liste des options disponibles ou tapez *agent* pour parler à un responsable.`;
    }

    // Envoi de la réponse
    await msg.reply(reponse);
});

client.initialize();
        

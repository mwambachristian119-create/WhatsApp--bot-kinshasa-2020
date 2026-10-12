import express from 'express';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;
const app = express();
const port = 3000;

let qrCodeData = '';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Génération du QR Code pour le navigateur web
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
    console.log('👉 QR Code généré ! Ouvre ton navigateur sur http://localhost:3000');
});

client.on('ready', () => {
    console.log('✅ Client WhatsApp prêt ! Le bot professionnel est en ligne.');
    qrCodeData = '';
});

// Page web pour afficher le QR Code proprement
app.get('/', (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;">
                    <h2>Scannez ce QR Code avec WhatsApp</h2>
                    <img src="${qrCodeData}" style="border:10px solid white;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.1);"/>
                    <p>Rechargez la page si le code expire.</p>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;">
                    <h2>✅ Bot déjà connecté ou en cours de chargement...</h2>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => {
    console.log(`🌐 Serveur Web démarré sur le port ${port}`);
});

client.on('message', async (msg) => {
    if (msg.from.endsWith('@g.us') || msg.isStatus) return;

    const texte = msg.body.toLowerCase().trim();
    console.log(`[Message de ${msg.from}] : ${msg.body}`);

    let reponse = "";

    if (texte.includes('bonjour') || texte.includes('salut') || texte.includes('mbote') || texte.includes('bonsoir') || texte.includes('hello')) {
        reponse = `👋 *Bonjour et bienvenue !*\n\nMerci de contacter notre service client à Kinshasa. Comment pouvons-nous vous aider aujourd'hui ?\n\n📌 Tapez *menu* à tout moment pour afficher nos options.`;
    }
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
    else if (texte === '1' || texte.includes('service') || texte.includes('produit') || texte.includes('catalogue') || texte.includes('offre')) {
        reponse = `🛍️ *NOS SERVICES & PRODUITS*\n\n` +
                  `Nous proposons une gamme complète de solutions adaptées à vos besoins :\n` +
                  `• Service / Produit 1\n` +
                  `• Service / Produit 2\n` +
                  `• Service / Produit 3\n\n` +
                  `💡 *Tapez "tarifs" pour connaître nos prix ou "agent" pour passer commande.*`;
    }
    else if (texte === '2' || texte.includes('tarif') || texte.includes('prix') || texte.includes('combien') || texte.includes('devis')) {
        reponse = `💳 *TARIFS & DEVIS*\n\n` +
                  `Nos prix sont étudiés pour vous offrir le meilleur rapport qualité/prix à Kinshasa.\n\n` +
                  `• Pour consulter notre grille tarifaire standard, demandez notre catalogue.\n` +
                  `• Pour un devis sur mesure, envoyez-nous la description exacte de votre besoin.\n\n` +
                  `📞 *Besoin d'aide immédiate ? Tapez "agent".*`;
    }
    else if (texte === '3' || texte.includes('livraison') || texte.includes('livrer') || texte.includes('expedition') || texte.includes('transport')) {
        reponse = `🚚 *LIVRAISON A KINSHASA*\n\n` +
                  `• Nous livrons dans toutes les communes de Kinshasa.\n` +
                  `• Délais : Entre 24h et 48h selon la zone.\n` +
                  `• Les frais de livraison sont calculés selon votre commune d'habitation.\n\n` +
                  `📍 Indiquez-nous votre commune pour évaluer les frais de transport !`;
    }
    else if (texte === '4' || texte.includes('paiement') || texte.includes('payer') || texte.includes('m-pesa') || texte.includes('orange money') || texte.includes('airtel money')) {
        reponse = `💰 *MODES DE PAIEMENT ACCEPTÉS*\n\n` +
                  `Pour votre commodité, nous acceptons :\n` +
                  `✅ Mobile Money (M-Pesa, Orange Money, Airtel Money)\n` +
                  `✅ Espèces à la livraison ou au bureau (USD / CDF)\n` +
                  `✅ Virement bancaire\n\n` +
                  `🔒 Tous nos paiements sont sécurisés.`;
    }
    else if (texte === '5' || texte.includes('adresse') || texte.includes('horaire') || texte.includes('localisation') || texte.includes('ou etes vous') || texte.includes('bureau')) {
        reponse = `📍 *NOS COORDONNÉES & HORAIRES*\n\n` +
                  `🏢 *Adresse* : Kinshasa, RDC\n` +
                  `🕒 *Horaires d'ouverture* :\n` +
                  `   • Lundi à Vendredi : 08h00 - 17h00\n` +
                  `   • Samedi : 08h30 - 13h00\n` +
                  `   • Dimanche & Jours fériés : Fermé\n\n` +
                  `📱 Tapez *agent* si vous souhaitez recevoir une localisation GPS.`;
    }
    else if (texte === '6' || texte.includes('agent') || texte.includes('humain') || texte.includes('conseiller') || texte.includes('appel') || texte.includes('parler')) {
        reponse = `👤 *MISE EN RELATION AVEC UN CONSEILLER*\n\n` +
                  `Un membre de notre équipe va prendre le relais très rapidement pour vous répondre directement.\n\n` +
                  `Veuillez nous laisser votre message détaillé ou votre numéro de téléphone ci-dessous. 📝`;
    }
    else {
        reponse = `🤖 *Assistant Virtuel*\n\n` +
                  `Je n'ai pas bien compris votre message.\n\n` +
                  `👉 Tapez *menu* pour voir la liste des options disponibles ou tapez *agent* pour parler à un responsable.`;
    }

    await msg.reply(reponse);
});

client.initialize();

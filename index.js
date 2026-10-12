import express from 'express';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;
const app = express();
const port = 3000;

let qrCodeData = '';

// Pause automatique de 1 heure lorsqu'un client demande un agent humain
const pausesAgents = new Map();

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        qrCodeData = url;
    });
    console.log('👉 QR Code généré ! Ouvre http://localhost:3000 ou l\'IP de ta VM');
});

client.on('ready', () => {
    console.log('✅ Client WhatsApp prêt ! Le bot professionnel est en ligne.');
    qrCodeData = '';
});

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
                    <h2>✅ Bot connecté et actif !</h2>
                </body>
            </html>
        `);
    }
});

app.listen(port, () => {
    console.log(`🌐 Serveur Web démarré sur le port ${port}`);
});

client.on('message', async (msg) => {
    // 1. Ignorer les groupes et les statuts
    if (msg.from.endsWith('@g.us') || msg.isStatus) return;

    // 2. FILTRE ANTI-CONTACTS RENFORCÉ
    try {
        const contact = await msg.getContact();

        // Si le contact est enregistré dans ton téléphone OR s'il a un nom attribué dans ton carnet d'adresses
        if (contact.isMyContact || contact.name || contact.shortName) {
            console.log(`🔒 [CONTACT IGNORÉ] Message personnel de : ${contact.name || contact.pushname || msg.from}`);
            return; // Le bot s'arrête ici et ne répond pas
        }
    } catch (error) {
        console.error("Erreur lors de la vérification du contact:", error);
    }

    // 3. PAUSE AGENT HUMAIN
    const maintenant = Date.now();
    if (pausesAgents.has(msg.from)) {
        const tempsFinPause = pausesAgents.get(msg.from);
        if (maintenant < tempsFinPause) {
            return; // Bot silencieux
        } else {
            pausesAgents.delete(msg.from);
        }
    }

    const texte = msg.body.toLowerCase().trim();
    console.log(`💬 [CLIENT] Message de ${msg.from} : ${msg.body}`);

    let reponse = "";

    // OPTION 6 : PARLER A UN AGENT
    if (texte === '6' || texte.includes('agent') || texte.includes('humain') || texte.includes('conseiller') || texte.includes('appel') || texte.includes('parler')) {
        pausesAgents.set(msg.from, maintenant + 3600000); // 1h de pause
        reponse = `👤 *MISE EN RELATION AVEC UN CONSEILLER*\n\n` +
                  `Un conseiller va vous répondre sous peu.\n` +
                  `Le bot est en pause sur cette discussion. Laissez votre message ci-dessous ! 📝`;
    }

    // SALUTATIONS
    else if (texte.includes('bonjour') || texte.includes('salut') || texte.includes('mbote') || texte.includes('bonsoir') || texte.includes('hello')) {
        reponse = `👋 *Bonjour et bienvenue !*\n\nComment pouvons-nous vous aider aujourd'hui ?\n\n📌 Tapez *menu* pour voir toutes nos options.`;
    }

    // MENU PRINCIPAL
    else if (texte === 'menu' || texte === 'options' || texte === 'aide') {
        reponse = `📋 *MENU SERVICE CLIENT*\n` +
                  `-----------------------------------\n` +
                  `1️⃣ *Services* : Nos prestations\n` +
                  `2️⃣ *Tarifs* : Nos prix et devis\n` +
                  `3️⃣ *Livraison* : Zones et frais\n` +
                  `4️⃣ *Paiement* : M-Pesa, Orange Money, Cash\n` +
                  `5️⃣ *Adresse* : Localisation & horaires\n` +
                  `6️⃣ *Agent* : Parler à un humain\n` +
                  `-----------------------------------`;
    }

    // SERVICES
    else if (texte === '1' || texte.includes('service') || texte.includes('produit')) {
        reponse = `🛍️ *NOS SERVICES*\n\n- Service 1\n- Service 2\n- Service 3\n\nTapez *tarifs* ou *agent* pour continuer.`;
    }

    // TARIFS
    else if (texte === '2' || texte.includes('tarif') || texte.includes('prix')) {
        reponse = `💳 *TARIFS*\n\nNos prix sont adaptés à Kinshasa. Demandez un devis ou tapez *agent*.`;
    }

    // LIVRAISON
    else if (texte === '3' || texte.includes('livraison')) {
        reponse = `🚚 *LIVRAISON*\n\nLivraison partout à Kinshasa sous 24h/48h. Indiquez votre commune !`;
    }

    // PAIEMENT
    else if (texte === '4' || texte.includes('paiement') || texte.includes('m-pesa')) {
        reponse = `💰 *PAIEMENTS*\n\nNous acceptons : M-Pesa, Orange Money, Airtel Money, Espèces (USD/CDF).`;
    }

    // ADRESSE
    else if (texte === '5' || texte.includes('adresse') || texte.includes('horaire')) {
        reponse = `📍 *ADRESSE*\n\nKinshasa, RDC.\nLundi-Vendredi: 08h-17h | Samedi: 08h30-13h`;
    }

    // RÉPONSE PAR DÉFAUT
    else {
        reponse = `🤖 *Assistant Virtuel*\n\nTapez *menu* pour voir les options ou *agent* pour un conseiller.`;
    }

    await msg.reply(reponse);
});

client.initialize();

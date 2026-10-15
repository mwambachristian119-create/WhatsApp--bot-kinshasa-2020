import express from 'express';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';

const { Client, LocalAuth, MessageMedia } = pkg;
const app = express();
const port = 3000;

let qrCodeData = '';
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
    console.log('👉 QR Code généré ! Ouvre http://localhost:3000');
});

client.on('ready', () => {
    console.log('✅ Client WhatsApp prêt ! Bot Christech Business en ligne.');
    qrCodeData = '';
});

app.get('/', (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#f0f2f5;">
                    <h2>Scannez ce QR Code avec WhatsApp</h2>
                    <img src="${qrCodeData}" style="border:10px solid white;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.1);"/>
                </body>
            </html>
        `);
    } else {
        res.send(`<h2>✅ Bot Christech Business connecté !</h2>`);
    }
});

app.listen(port, () => console.log(`🌐 Serveur Web sur le port ${port}`));

// Fonction pour envoyer le produit avec sa photo
async function envoyerProduitAvecPhoto(msg, nomsPossibles, description) {
    const extensions = ['.jfif', '.jpg', '.JPG', '.png', '.jpeg'];
    let cheminTrouve = null;

    for (const nom of nomsPossibles) {
        for (const ext of extensions) {
            const cheminTest = path.join('./images', nom + ext);
            if (fs.existsSync(cheminTest)) {
                cheminTrouve = cheminTest;
                break;
            }
        }
        if (cheminTrouve) break;
    }

    if (cheminTrouve) {
        const media = MessageMedia.fromFilePath(cheminTrouve);
        await client.sendMessage(msg.from, media, { caption: description });
    } else {
        await msg.reply(description + `\n\n*(Photo en cours de chargement)*`);
    }
}

client.on('message', async (msg) => {
    if (msg.from.endsWith('@g.us') || msg.isStatus) return;

    // Filtre anti-contacts personnels
    try {
        const contact = await msg.getContact();
        if (contact.isMyContact || contact.name || contact.shortName) {
            console.log(`🔒 [CONTACT IGNORÉ] Message personnel de : ${contact.name || contact.pushname || msg.from}`);
            return;
        }
    } catch (error) {
        console.error("Erreur filtre contact:", error);
    }

    // Gestion de la pause (Agent humain)
    const maintenant = Date.now();
    if (pausesAgents.has(msg.from)) {
        if (maintenant < pausesAgents.get(msg.from)) return;
        else pausesAgents.delete(msg.from);
    }

    const texte = msg.body.toLowerCase().trim();
    console.log(`💬 [CLIENT] Message de ${msg.from} : ${msg.body}`);

    // OPTION AGENT (6)
    if (texte === '6' || texte.includes('agent') || texte.includes('humain') || texte.includes('conseiller')) {
        pausesAgents.set(msg.from, maintenant + 3600000); // Pause d'1 heure
        return msg.reply(
            `👤 *MISE EN RELATION AVEC UN CONSEILLER*\n\n` +
            `Merci d'avoir contacté *Christech Business* (Gombe, Kinshasa) !\n` +
            `Un conseiller prend le relais. Le bot est suspendu pendant 1h sur cette discussion.\n` +
            `Posez directement votre question ci-dessous ! 📝`
        );
    }

    // SALUTATIONS
    if (texte.includes('bonjour') || texte.includes('salut') || texte.includes('mbote') || texte.includes('bonsoir') || texte.includes('hello')) {
        return msg.reply(
            `👋 *Bonjour et bienvenue chez Christech Business !*\n\n` +
            `Vente d'appareils et équipements informatiques à Kinshasa (Gombe). 💻🖱️\n\n` +
            `Tapez *menu* pour consulter nos catalogues et tarifs !`
        );
    }

    // MENU PRINCIPAL CLASSÉ PAR CATÉGORIE
    if (texte === 'menu' || texte === 'options' || texte === 'aide') {
        return msg.reply(
            `📋 *MENU - CHRISTECH BUSINESS*\n` +
            `-----------------------------------\n` +
            `💻 1️⃣ *Ordinateurs* (HP, Lenovo...)\n` +
            `⌨️ 2️⃣ *Claviers*\n` +
            `🖱️ 3️⃣ *Souris*\n` +
            `🔌 4️⃣ *Matériel Réseau*\n` +
            `🚚 5️⃣ *Livraison (5$ à Kinshasa)*\n` +
            `👤 6️⃣ *Parler à un conseiller*\n` +
            `-----------------------------------\n` +
            `✍️ *Répondez avec un numéro pour voir les articles !*`
        );
    }

    // CATÉGORIE 1 : ORDINATEURS (HP, Lenovo)
    if (texte === '1' || texte.includes('ordinateur') || texte.includes('laptop')) {
        return msg.reply(
            `💻 *CATALOGUE ORDINATEURS*\n` +
            `Choisissez un modèle pour voir la photo et les détails :\n\n` +
            `11️⃣ *Ordinateur HP*\n` +
            `12️⃣ *Ordinateur Lenovo*\n\n` +
            `👉 *Tapez 11 ou 12 pour faire votre choix.*`
        );
    }

    if (texte === '11') {
        const desc = `💻 *ORDINATEUR HP*\n\n` +
                     `• **État** : Reconditionné propre / Importé\n` +
                     `• **Idéal** : Bureautique & Études\n\n` +
                     `🚚 *Livraison* : 5$ partout à Kinshasa\n` +
                     `✍️ Tapez *6* pour commander !`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (7)', 'ordinateur-hp'], desc);
    }

    if (texte === '12') {
        const desc = `💻 *ORDINATEUR LENOVO*\n\n` +
                     `• **Modèle** : ThinkPad / IdeaPad\n` +
                     `• **Performance** : Robuste et fiable\n\n` +
                     `🚚 *Livraison* : 5$ partout à Kinshasa\n` +
                     `✍️ Tapez *6* pour commander !`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (9)', 'ordinateur-lenovo'], desc);
    }

    // CATÉGORIE 2 : CLAVIERS
    if (texte === '2' || texte.includes('clavier')) {
        return msg.reply(
            `⌨️ *CATALOGUE CLAVIERS*\n` +
            `Choisissez une option :\n\n` +
            `21️⃣ *Clavier avec fil*\n` +
            `22️⃣ *Clavier sans fil*\n\n` +
            `👉 *Tapez 21 ou 22 pour voir la photo.*`
        );
    }

    if (texte === '21') {
        return envoyerProduitAvecPhoto(msg, ['cable internet (2)', 'clavier-avec-fil'], `⌨️ *Clavier USB avec fil* : Confortable, touches silencieuses et résistantes.\n\n🚚 Livraison : 5$ à Kinshasa.`);
    }
    if (texte === '22') {
        return envoyerProduitAvecPhoto(msg, ['cable internet (3)', 'clavier-sans-fil'], `⌨️ *Clavier Sans Fil* : Connexion sans fil stable, design moderne.\n\n🚚 Livraison : 5$ à Kinshasa.`);
    }

    // CATÉGORIE 3 : SOURIS
    if (texte === '3' || texte.includes('souris')) {
        const desc = `🖱️ *SOURIS OPTIQUE*\n\n` +
                     `• Pratique, ergonomique et précise.\n` +
                     `• Compatible PC et Mac.\n\n` +
                     `🚚 *Livraison* : 5$ partout à Kinshasa\n` +
                     `✍️ Tapez *6* pour commander !`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (10)', 'souris'], desc);
    }

    // CATÉGORIE 4 : MATÉRIEL RÉSEAU
    if (texte === '4' || texte.includes('reseau') || texte.includes('réseau') || texte.includes('cable')) {
        return msg.reply(
            `🔌 *MATÉRIEL RÉSEAU*\n` +
            `Choisissez un article :\n\n` +
            `41️⃣ *Kit complet outillage réseau*\n` +
            `42️⃣ *Câble Internet (RJ45)*\n\n` +
            `👉 *Tapez 41 ou 42 pour voir la photo.*`
        );
    }

    if (texte === '41') {
        return envoyerProduitAvecPhoto(msg, ['cable internet (5)', 'kit-reseau'], `🧰 *Kit Outillage Réseau Complet* : Pince à sertir, testeur, connecteurs... Idéal pour techniciens.\n\n🚚 Livraison : 5$ à Kinshasa.`);
    }
    if (texte === '42') {
        return envoyerProduitAvecPhoto(msg, ['cable internet', 'cable-internet'], `🔌 *Câble Réseau Ethernet (RJ45)* : Haut débit pour connexion internet stable.\n\n🚚 Livraison : 5$ à Kinshasa.`);
    }

    // LIVRAISON (5)
    if (texte === '5' || texte.includes('livraison')) {
        return msg.reply(`🚚 *LIVRAISON CHRTECH BUSINESS*\n\n• Tarif unique : **5$ partout à Kinshasa** 💵\n• Livraison rapide dans tous les communes.`);
    }

    // PAR DÉFAUT
    await msg.reply(`🤖 *Christech Business* (Gombe, Kinshasa)\n\nTapez *menu* pour voir les catégories de produits ou *6* pour parler à un conseiller.`);
});

client.initialize();

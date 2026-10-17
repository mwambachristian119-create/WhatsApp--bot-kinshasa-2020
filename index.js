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

// Adresse complète de la boutique
const ADRESSE_BOUTIQUE = "📍 *Adresse* : Avenue de la Gombe (croisement Colonel Ebeya et Tombalbaye), Gombe, Kinshasa";

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
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

// Fonction d'envoi avec photo, description et options de livraison/bureau
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

    const optionsAchat = `\n\n` +
                         `-----------------------------------\n` +
                         `🛍️ *COMMENT ACHETER ?*\n` +
                         `1️⃣ **Livraison** : 5$ partout à Kinshasa (reçu chez vous ou au bureau).\n` +
                         `2️⃣ **Retrait sur place** : Venez directement à notre bureau.\n` +
                         `${ADRESSE_BOUTIQUE}\n\n` +
                         `✍️ *Tapez 5 pour parler à un conseiller et valider votre choix (livraison ou retrait).*`;

    const texteFinal = description + optionsAchat;

    if (cheminTrouve) {
        try {
            const fileData = fs.readFileSync(cheminTrouve);
            const base64Image = fileData.toString('base64');
            const media = new MessageMedia('image/jpeg', base64Image, 'produit.jpg');

            await client.sendMessage(msg.from, media, { caption: texteFinal });
            console.log(`🖼️ [IMAGE ENVOYÉE] : ${cheminTrouve}`);
        } catch (error) {
            console.error("Erreur envoi image :", error);
            await client.sendMessage(msg.from, texteFinal);
        }
    } else {
        console.log(`⚠️ Aucune image trouvée pour : ${nomsPossibles.join(', ')}`);
        await client.sendMessage(msg.from, texteFinal);
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
        // Continue sans bloquer
    }

    // Gestion de la pause (Agent humain)
    const maintenant = Date.now();
    if (pausesAgents.has(msg.from)) {
        if (maintenant < pausesAgents.get(msg.from)) return;
        else pausesAgents.delete(msg.from);
    }

    const texte = msg.body.toLowerCase().trim();
    console.log(`💬 [CLIENT] Message de ${msg.from} : ${msg.body}`);

    // OPTION AGENT HUMAIN / COMMANDE (5)
    if (texte === '5' || texte.includes('agent') || texte.includes('humain') || texte.includes('conseiller') || texte.includes('commander')) {
        pausesAgents.set(msg.from, maintenant + 3600000);
        return client.sendMessage(msg.from, 
            `👤 *MISE EN RELATION AVEC UN CONSEILLER*\n\n` +
            `Merci d'avoir choisi *Christech Business* !\n` +
            `Un conseiller prend le relais pour enregistrer votre commande.\n\n` +
            `${ADRESSE_BOUTIQUE}\n` +
            `🚚 *Livraison* : 5$ partout à Kinshasa.\n\n` +
            `Indiquez à notre conseiller si vous optez pour la **livraison** ou le **retrait au bureau**, ainsi que votre adresse exacte ! 📝`
        );
    }

    // SALUTATIONS
    if (texte.includes('bonjour') || texte.includes('salut') || texte.includes('mbote') || texte.includes('bonsoir') || texte.includes('hello')) {
        return client.sendMessage(msg.from, 
            `👋 *Bonjour et bienvenue chez Christech Business !*\n\n` +
            `Vente d'appareils et matériel informatique de qualité à Kinshasa. 💻🖱️\n\n` +
            `${ADRESSE_BOUTIQUE}\n\n` +
            `🚚 *Livraison* : 5$ dans toutes les communes de Kinshasa ou retrait gratuit au bureau.\n\n` +
            `Tapez *menu* pour consulter nos produits et tarifs !`
        );
    }

    // MENU PRINCIPAL
    if (texte === 'menu' || texte === 'options' || texte === 'aide') {
        return client.sendMessage(msg.from, 
            `📋 *MENU - CHRISTECH BUSINESS*\n` +
            `-----------------------------------\n` +
            `💻 1️⃣ *Ordinateurs* (HP, Lenovo...)\n` +
            `⌨️ 2️⃣ *Claviers* (Avec fil / Sans fil)\n` +
            `🖱️ 3️⃣ *Souris* (Avec fil / Sans fil)\n` +
            `🔌 4️⃣ *Matériel Réseau*\n` +
            `👤 5️⃣ *Parler à un conseiller / Valider une commande*\n` +
            `-----------------------------------\n` +
            `${ADRESSE_BOUTIQUE}\n\n` +
            `✍️ *Répondez avec un numéro (1, 2, 3...) pour voir nos articles en photo !*`
        );
    }

    // CATÉGORIE 1 : ORDINATEURS (HP / LENOVO)
    if (texte === '1' || texte.includes('ordinateur') || texte.includes('laptop')) {
        return client.sendMessage(msg.from, 
            `💻 *CATALOGUE ORDINATEURS*\n` +
            `Choisissez le modèle désiré :\n\n` +
            `11️⃣ *Ordinateur Portable HP EliteBook / ProBook*\n` +
            `12️⃣ *Ordinateur Portable Lenovo ThinkPad*\n\n` +
            `👉 *Tapez 11 ou 12 pour voir la photo, le prix et les caractéristiques.*`
        );
    }

    if (texte === '11') {
        const desc = `💻 *ORDINATEUR PORTABLE HP ELITEBOOK*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **280 $**\n\n` +
                     `• **Processeur** : Intel Core i5 (8ème gén.)\n` +
                     `• **RAM** : 8 GB DDR4\n` +
                     `• **Stockage** : 256 GB SSD (Ultra rapide)\n` +
                     `• **Écran** : 14 pouces Full HD\n` +
                     `• **État** : Reconditionné propre, venu d'Europe\n` +
                     `• **Inclus** : Chargeur original + Garantie`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (7)', 'cable internet (6)', 'cable internet (8)'], desc);
    }

    if (texte === '12') {
        const desc = `💻 *ORDINATEUR PORTABLE LENOVO THINKPAD*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **310 $**\n\n` +
                     `• **Processeur** : Intel Core i5 Ultra Robuste\n` +
                     `• **RAM** : 8 GB DDR4\n` +
                     `• **Stockage** : 256 GB SSD\n` +
                     `• **Écran** : 14 pouces anti-reflet\n` +
                     `• **Autonomie** : Batterie haute capacité (4h+)\n` +
                     `• **État** : Excellent état / Importé`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (9)'], desc);
    }

    // CATÉGORIE 2 : CLAVIERS (AVEC FIL / SANS FIL)
    if (texte === '2' || texte.includes('clavier')) {
        return client.sendMessage(msg.from, 
            `⌨️ *CATALOGUE CLAVIERS*\n` +
            `Choisissez votre type de clavier :\n\n` +
            `21️⃣ *Clavier USB avec fil*\n` +
            `22️⃣ *Clavier Sans Fil (Bluetooth / 2.4G)*\n\n` +
            `👉 *Tapez 21 ou 22 pour voir la photo et les détails.*`
        );
    }

    if (texte === '21') {
        const desc = `⌨️ *CLAVIER USB AVEC FIL*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **12 $**\n\n` +
                     `• **Type** : AZERTY / QWERTY Standard\n` +
                     `• **Connexion** : USB Plug & Play\n` +
                     `• **Points forts** : Touches douces, silencieuses et très résistantes. Idéal pour la bureautique.`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (2)'], desc);
    }

    if (texte === '22') {
        const desc = `⌨️ *CLAVIER SANS FIL*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **22 $**\n\n` +
                     `• **Connexion** : Récepteur USB Nano 2.4GHz (Portée 10m)\n` +
                     `• **Design** : Ergonomique et ultra-fin\n` +
                     `• **Autonomie** : Longue durée avec piles AAA`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (3)'], desc);
    }

    // CATÉGORIE 3 : SOURIS (AVEC FIL / SANS FIL)
    if (texte === '3' || texte.includes('souris')) {
        return client.sendMessage(msg.from, 
            `🖱️ *CATALOGUE SOURIS*\n` +
            `Choisissez votre type de souris :\n\n` +
            `31️⃣ *Souris Optique avec fil*\n` +
            `32️⃣ *Souris Ergonomique Sans Fil*\n\n` +
            `👉 *Tapez 31 ou 32 pour voir la photo et les détails.*`
        );
    }

    if (texte === '31') {
        const desc = `🖱️ *SOURIS OPTIQUE USB (AVEC FIL)*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **6 $**\n\n` +
                     `• **Capteur** : Optique haute précision (1200 DPI)\n` +
                     `• **Connexion** : Câble USB robuste\n` +
                     `• **Compatibilité** : Windows, Mac, Linux`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (10)'], desc);
    }

    if (texte === '32') {
        const desc = `🖱️ *SOURIS SANS FIL ERGONOMIQUE*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **12 $**\n\n` +
                     `• **Connexion** : Sans fil 2.4 GHz avec mini récepteur USB\n` +
                     `• **Sensibilité** : Réglable (800 / 1200 / 1600 DPI)\n` +
                     `• **Avantage** : Mode mise en veille automatique pour économiser la batterie.`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (4)'], desc);
    }

    // CATÉGORIE 4 : MATÉRIEL RÉSEAU
    if (texte === '4' || texte.includes('reseau') || texte.includes('réseau')) {
        return client.sendMessage(msg.from, 
            `🔌 *MATÉRIEL RÉSEAU*\n` +
            `Choisissez un article :\n\n` +
            `41️⃣ *Kit complet outillage réseau (Pince, Testeur...)*\n` +
            `42️⃣ *Câble Réseau Ethernet RJ45 High Speed*\n\n` +
            `👉 *Tapez 41 ou 42 pour voir la photo.*`
        );
    }

    if (texte === '41') {
        const desc = `🧰 *KIT D'OUTILLAGE RÉSEAU PROFESSIONNEL*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **35 $**\n\n` +
                     `• **Contenu** : Pince à sertir RJ45/RJ11, Testeur de câble, Dénudeur, Connecteurs RJ45.\n` +
                     `• **Usage** : Idéal pour techniciens, télécoms et réseaux.`;
        return envoyerProduitAvecPhoto(msg, ['cable internet (5)'], desc);
    }

    if (texte === '42') {
        const desc = `🔌 *CÂBLE RÉSEAU ETHERNET RJ45 (CAT 6)*\n` +
                     `-----------------------------------\n` +
                     `💵 *Prix* : **0.8 $ / mètre** (ou rouleau disponible)\n\n` +
                     `• **Débit** : Haut débit Gigabit 1000 Mbps\n` +
                     `• **Usage** : Connexion internet stable pour routeurs, PC, Switch et caméras.`;
        return envoyerProduitAvecPhoto(msg, ['cable internet'], desc);
    }

    // MESSAGE PAR DÉFAUT
    await client.sendMessage(msg.from, 
        `🤖 *Christech Business* (Gombe, Kinshasa)\n\n` +
        `${ADRESSE_BOUTIQUE}\n\n` +
        `Tapez *menu* pour consulter le catalogue ou *5* pour discuter avec un conseiller.`
    );
});

client.initialize();
            

/**
 * Standalone Self-Hosted WhatsApp HTTP Gateway microservice for Clinic OS.
 * 
 * Uses Baileys / WhatsApp Web automation to pair with the clinic's phone number
 * via QR code and provides an HTTP endpoint (`POST /send-message`) for 100% FREE messaging.
 * 
 * Prerequisites:
 *   npm install express @whiskeysockets/baileys qrcode-terminal
 * 
 * Usage:
 *   node scripts/whatsapp-gateway.js
 */

const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const API_SECRET = process.env.WHATSAPP_GATEWAY_SECRET || '';

let sock = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n[WhatsApp Gateway] Scan this QR code with your clinic WhatsApp account:\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut);
            console.log('[WhatsApp Gateway] Connection closed due to ', lastDisconnect.error, ', reconnecting: ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('\n✅ [WhatsApp Gateway] Connected successfully to WhatsApp!\n');
        }
    });
}

// HTTP API Endpoint for Clinic OS
app.post('/send-message', async (req, res) => {
    // Basic API Secret Verification if set
    if (API_SECRET && req.headers['x-api-key'] !== API_SECRET) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API secret' });
    }

    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ error: 'Missing phone or message in request body' });
    }

    if (!sock) {
        return res.status(503).json({ error: 'WhatsApp service not initialized yet' });
    }

    try {
        // Format phone into JID (e.g. 919876543210@s.whatsapp.net)
        const cleanDigits = phone.replace(/\D/g, '');
        const jid = `${cleanDigits}@s.whatsapp.net`;

        await sock.sendMessage(jid, { text: message });
        console.log(`[WhatsApp Gateway] Sent message to ${cleanDigits}`);

        return res.json({ success: true, to: cleanDigits });
    } catch (err) {
        console.error('[WhatsApp Gateway] Failed to send message:', err);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 WhatsApp HTTP Gateway server listening on port ${PORT}`);
    connectToWhatsApp();
});

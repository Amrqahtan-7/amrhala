const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;
let messageQueue = [];
let reconnectTimer = null;

function createClient() {
  return new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return; // already scheduled
  console.log('[WhatsApp] Reconnecting in 10 seconds...');
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    initWhatsApp();
  }, 10000);
}

function initWhatsApp() {
  if (client) {
    try { client.destroy(); } catch (_) {}
    client = null;
  }
  isReady = false;
  client = createClient();

  client.on('qr', (qr) => {
    console.log('\n========================================');
    console.log('  SCAN THIS QR CODE WITH YOUR WHATSAPP');
    console.log('  (Open WhatsApp > Settings > Linked Devices > Link a Device)');
    console.log('========================================\n');
    qrcode.generate(qr, { small: true });
    console.log('\n========================================\n');
  });

  client.on('ready', () => {
    isReady = true;
    console.log('[WhatsApp] Connected and ready!');
    // Send any queued messages
    if (messageQueue.length > 0) {
      console.log(`[WhatsApp] Sending ${messageQueue.length} queued message(s)...`);
      const queue = [...messageQueue];
      messageQueue = [];
      queue.forEach(({ number, message }) => sendMessage(number, message));
    }
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated - session saved.');
  });

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Auth failed:', msg);
    isReady = false;
    scheduleReconnect();
  });

  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Disconnected:', reason);
    isReady = false;
    scheduleReconnect();
  });

  client.initialize().catch(err => {
    console.error('[WhatsApp] Init error:', err.message);
    scheduleReconnect();
  });
}

async function sendMessage(toNumber, message) {
  if (!isReady) {
    console.log('[WhatsApp] Not ready yet, queuing message...');
    messageQueue.push({ number: toNumber, message });
    return;
  }

  try {
    const chatId = toNumber.includes('@') ? toNumber : toNumber.replace(/[^0-9]/g, '') + '@c.us';
    await client.sendMessage(chatId, message);
    console.log('[WhatsApp] Message sent to', toNumber);
  } catch (err) {
    console.error('[WhatsApp] Send error:', err.message);
  }
}

module.exports = { initWhatsApp, sendMessage };

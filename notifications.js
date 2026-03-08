const nodemailer = require('nodemailer');
const axios = require('axios');

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour12: false });
}

async function sendWhatsApp(booking) {
  const apiKey = process.env.CALLMEBOT_APIKEY;
  if (!apiKey || apiKey === 'YOUR_CALLMEBOT_KEY_HERE') {
    console.log('[WhatsApp] CALLMEBOT_APIKEY not configured, skipping.');
    return;
  }

  const message =
    `New Booking - amrhala Restaurant\n` +
    `Name: ${booking.name}\n` +
    `Phone: ${booking.phone}\n` +
    `Slot: ${booking.slot_time}\n` +
    `Submitted: ${formatDateTime(booking.created_at)}`;

  const url = `https://api.callmebot.com/whatsapp.php?phone=%2B923443544447&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

  const response = await axios.get(url, { timeout: 10000 });
  console.log('[WhatsApp] Sent:', response.status);
}

async function sendEmail(booking) {
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword || appPassword === 'YOUR_GMAIL_APP_PASSWORD_HERE') {
    console.log('[Email] GMAIL_APP_PASSWORD not configured, skipping.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'amrsadeq43@gmail.com',
      pass: appPassword
    }
  });

  const text =
    `New Table Booking Received - amrhala Restaurant\n\n` +
    `Customer Name: ${booking.name}\n` +
    `Customer Phone: ${booking.phone}\n` +
    `Selected Time Slot: ${booking.slot_time}\n` +
    `Submitted At: ${formatDateTime(booking.created_at)}\n\n` +
    `-- amrhala Booking System`;

  await transporter.sendMail({
    from: '"amrhala Restaurant" <amrsadeq43@gmail.com>',
    to: 'amrsadeq43@gmail.com',
    subject: `New Booking: ${booking.name} at ${booking.slot_time}`,
    text
  });
  console.log('[Email] Sent to amrsadeq43@gmail.com');
}

async function sendNotifications(booking) {
  const results = await Promise.allSettled([
    sendWhatsApp(booking),
    sendEmail(booking)
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[Notification ${i === 0 ? 'WhatsApp' : 'Email'}] Error:`, r.reason?.message || r.reason);
    }
  });
}

module.exports = { sendNotifications };

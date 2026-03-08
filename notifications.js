const nodemailer = require('nodemailer');
const { sendMessage } = require('./whatsapp');

const OWNER_WHATSAPP = '923443544447@c.us';

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('en-GB', { timeZone: 'Asia/Karachi', hour12: false });
}

async function sendWhatsApp(booking) {
  const message =
    `New Booking - amrhala Restaurant\n` +
    `Name: ${booking.name}\n` +
    `Phone: ${booking.phone}\n` +
    `Time Slot: ${booking.slot_time}\n` +
    `Submitted: ${formatDateTime(booking.created_at)}`;

  await sendMessage(OWNER_WHATSAPP, message);
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

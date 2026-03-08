require('dotenv').config();
const express = require('express');
const path = require('path');
const { insertBooking, getAllBookings } = require('./db');
const { sendNotifications } = require('./notifications');
const authMiddleware = require('./middleware/auth');
const { initWhatsApp } = require('./whatsapp');

// Start WhatsApp client (shows QR code in terminal on first run)
initWhatsApp();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Owner dashboard - protected route (must be before static middleware)
app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Static files (customer page, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Get available time slots
app.get('/api/slots', (req, res) => {
  const now = new Date();
  const currentHour = now.getHours();
  const firstAvailable = currentHour + 1;

  const OPEN = 10;
  const CLOSE = 22;

  const slots = [];
  for (let h = Math.max(firstAvailable, OPEN); h <= CLOSE; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
  }

  res.json({ slots });
});

// Create a booking
app.post('/api/bookings', async (req, res) => {
  const { name, phone, slotTime } = req.body;

  if (!name || !phone || !slotTime) {
    return res.status(400).json({ error: 'Name, phone, and time slot are required.' });
  }

  // Server-side slot validation
  const slotHour = parseInt(slotTime.split(':')[0]);
  const currentHour = new Date().getHours();
  if (isNaN(slotHour) || slotHour <= currentHour || slotHour < 10 || slotHour > 22) {
    return res.status(400).json({ error: 'Invalid or expired time slot. Please refresh and try again.' });
  }

  try {
    const booking = insertBooking(name.trim(), phone.trim(), slotTime);
    // Fire notifications in background (don't await to keep response fast)
    sendNotifications(booking).catch(err => console.error('[Notifications] Failed:', err));
    return res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error('[POST /api/bookings]', err);
    return res.status(500).json({ error: 'Could not save booking. Please try again.' });
  }
});

// Get all bookings (owner only)
app.get('/api/bookings', authMiddleware, (req, res) => {
  try {
    const bookings = getAllBookings();
    res.json({ bookings });
  } catch (err) {
    console.error('[GET /api/bookings]', err);
    res.status(500).json({ error: 'Could not retrieve bookings.' });
  }
});

app.listen(PORT, () => {
  console.log(`amrhala Booking System running at http://localhost:${PORT}`);
  console.log(`Owner dashboard: http://localhost:${PORT}/dashboard`);
});

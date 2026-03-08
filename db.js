const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'bookings.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    phone      TEXT    NOT NULL,
    slot_time  TEXT    NOT NULL,
    created_at TEXT    NOT NULL
  )
`);

function insertBooking(name, phone, slotTime) {
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO bookings (name, phone, slot_time, created_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, phone, slotTime, createdAt);
  return getBookingById(result.lastInsertRowid);
}

function getBookingById(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

function getAllBookings() {
  return db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
}

module.exports = { insertBooking, getAllBookings };

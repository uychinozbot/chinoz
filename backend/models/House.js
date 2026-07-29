const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'houses.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database xatosi:', err.message);
  } else {
    console.log('Database ulandi');
    initDatabase();
  }
});

function initDatabase() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS houses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'UZS',
      address TEXT,
      location_type TEXT,
      house_type TEXT,
      area REAL,
      floor INTEGER,
      total_floors INTEGER,
      condition TEXT,
      furniture TEXT,
      utilities TEXT,
      year_built INTEGER,
      garage TEXT,
      rooms INTEGER,
      phone TEXT NOT NULL,
      image_url TEXT,
      images TEXT,
      additional_info TEXT,
      expiration_date DATE,
      user_id INTEGER NOT NULL,
      username TEXT,
      telegram_username TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active'
    )
  `;
  
  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Jadval yaratish xatosi:', err.message);
    } else {
      console.log('Houses jadvali tayyor');
    }
  });
}

const House = {
  create: (houseData) => {
    return new Promise((resolve, reject) => {
      const {
        title, description, price, currency, address, location_type, house_type, area,
        floor, total_floors, condition, furniture, utilities, year_built, garage,
        rooms, phone, image_url, images, additional_info, expiration_date, user_id, username, telegram_username
      } = houseData;
      const query = `
        INSERT INTO houses (
          title, description, price, currency, address, location_type, house_type, area,
          floor, total_floors, condition, furniture, utilities, year_built, garage,
          rooms, phone, image_url, images, additional_info, expiration_date, user_id, username, telegram_username
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [
        title, description, price, currency, address, location_type, house_type, area,
        floor, total_floors, condition, furniture, utilities, year_built, garage,
        rooms, phone, image_url, images ? JSON.stringify(images) : null, additional_info, expiration_date, user_id, username, telegram_username
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          // Yangi yaratilgan house'ni database'dan olish (created_at bilan birga)
          db.get('SELECT * FROM houses WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        }
      });
    });
  }
};

module.exports = House;

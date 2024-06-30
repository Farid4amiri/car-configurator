const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Ensure the database directory exists
const dbDir = './db';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Path to the database file
const dbPath = `${dbDir}/database.db`;

// Create and open the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// Function to initialize the database and create tables
function initializeDatabase() {
  db.serialize(() => {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        good_client INTEGER
      );
    `);

    // Create car models table
    db.run(`
      CREATE TABLE IF NOT EXISTS car_models (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        engine_power INTEGER,
        cost INTEGER
      );
    `);

    // Create accessories table
    db.run(`
      CREATE TABLE IF NOT EXISTS accessories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER
      );
    `);

    // Create configurations table
    db.run(`
      CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        car_model_id INTEGER,
        accessories TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (car_model_id) REFERENCES car_models(id)
      );
    `);

    // Insert sample data if it doesn't already exist
    const saltRounds = 10;
    const users = [
      { username: 'user1', password: 'password1', good_client: 1 },
      { username: 'user2', password: 'password2', good_client: 0 },
      { username: 'user3', password: 'password3', good_client: 1 },
      { username: 'user4', password: 'password4', good_client: 0 },
      { username: 'user5', password: 'password5', good_client: 0 }
    ];

    users.forEach(user => {
      const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
      db.get(`SELECT * FROM users WHERE username = ?`, [user.username], (err, row) => {
        if (!row) {
          db.run(`INSERT INTO users (username, password, good_client) VALUES (?, ?, ?)`, [user.username, hashedPassword, user.good_client]);
        }
      });
    });

    db.get(`SELECT COUNT(*) as count FROM car_models`, (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO car_models (name, engine_power, cost) VALUES ('Model A', 50, 10000)`);
        db.run(`INSERT INTO car_models (name, engine_power, cost) VALUES ('Model B', 100, 12000)`);
        db.run(`INSERT INTO car_models (name, engine_power, cost) VALUES ('Model C', 150, 14000)`);
      }
    });

    db.get(`SELECT COUNT(*) as count FROM accessories`, (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO accessories (name, price) VALUES ('radio', 300)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('satellite navigator', 600)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('bluetooth', 200)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('power windows', 200)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('extra front lights', 150)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('extra rear lights', 150)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('air conditioning', 600)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('spare tire', 200)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('assisted driving', 1200)`);
        db.run(`INSERT INTO accessories (name, price) VALUES ('automatic braking', 800)`);
      }
    });
  });
}

// Export the database object for use in other modules
module.exports = db;

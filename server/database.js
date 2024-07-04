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
    // Drop existing tables if they exist
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`DROP TABLE IF EXISTS car_models`);
    db.run(`DROP TABLE IF EXISTS accessories`);
    db.run(`DROP TABLE IF EXISTS accessory_constraints`);
    db.run(`DROP TABLE IF EXISTS configurations`);

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
        cost INTEGER,
        availability INTEGER DEFAULT 5
      );
    `);

    // Create accessories table
    db.run(`
      CREATE TABLE IF NOT EXISTS accessories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        availability INTEGER DEFAULT 5
      );
    `);

    // Create accessory constraints table
    db.run(`
      CREATE TABLE IF NOT EXISTS accessory_constraints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        accessory_id INTEGER,
        requires_accessory_id INTEGER,
        incompatible_accessory_id INTEGER,
        FOREIGN KEY (accessory_id) REFERENCES accessories(id),
        FOREIGN KEY (requires_accessory_id) REFERENCES accessories(id),
        FOREIGN KEY (incompatible_accessory_id) REFERENCES accessories(id)
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
        db.run(`INSERT INTO car_models (name, engine_power, cost, availability) VALUES ('Model A', 50, 10000, 5)`);
        db.run(`INSERT INTO car_models (name, engine_power, cost, availability) VALUES ('Model B', 100, 12000, 5)`);
        db.run(`INSERT INTO car_models (name, engine_power, cost, availability) VALUES ('Model C', 150, 14000, 5)`);
      }
    });

    db.get(`SELECT COUNT(*) as count FROM accessories`, (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('radio', 300, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('satellite navigator', 600, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('bluetooth', 200, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('power windows', 200, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('extra front lights', 150, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('extra rear lights', 150, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('air conditioning', 600, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('spare tire', 200, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('assisted driving', 1200, 5)`);
        db.run(`INSERT INTO accessories (name, price, availability) VALUES ('automatic braking', 800, 5)`);
      }
    });

    db.get(`SELECT COUNT(*) as count FROM accessory_constraints`, (err, row) => {
      if (row.count === 0) {
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='bluetooth'), (SELECT id FROM accessories WHERE name='radio'), NULL)`);
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='satellite navigator'), (SELECT id FROM accessories WHERE name='bluetooth'), NULL)`);
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='extra rear lights'), (SELECT id FROM accessories WHERE name='extra front lights'), NULL)`);
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='air conditioning'), (SELECT id FROM accessories WHERE name='power windows'), NULL)`);
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='assisted driving'), NULL, (SELECT id FROM accessories WHERE name='automatic braking'))`);
        db.run(`INSERT INTO accessory_constraints (accessory_id, requires_accessory_id, incompatible_accessory_id) VALUES 
          ((SELECT id FROM accessories WHERE name='spare tire'), NULL, (SELECT id FROM accessories WHERE name='assisted driving'))`);
      }
    });
  });
}

// Export the database object for use in other modules
module.exports = db;

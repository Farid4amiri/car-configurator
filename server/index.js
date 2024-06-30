// Other imports and configurations
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const db = require('./database'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session
app.use(session({
  secret: 'your-secret-key', // Replace with your secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Ensure secure is false if not using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// Add this middleware to log req.user
app.use((req, res, next) => {
  console.log('User:', req.user);
  next();
});

// Passport local strategy for authentication
passport.use(new LocalStrategy((username, password, done) => {
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Routes for authentication
app.post('/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Login successful', user: req.user });
});

app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/profile', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

app.get('/login-failure', (req, res) => {
  res.json({ message: 'Login failed' });
});

// Endpoint to fetch car models
app.get('/car-models', (req, res) => {
  db.all('SELECT * FROM car_models', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint to fetch accessories
app.get('/accessories', (req, res) => {
  db.all('SELECT * FROM accessories', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Endpoint to save configurations
app.post('/configurations', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { car_model_id, accessories } = req.body;
  const userId = req.user.id;

  console.log('Saving configuration for user:', userId);
  console.log('Car Model ID:', car_model_id);
  console.log('Accessories:', accessories);

  db.run(`INSERT INTO configurations (user_id, car_model_id, accessories) VALUES (?, ?, ?)`, [userId, car_model_id, JSON.stringify(accessories)], function (err) {
    if (err) {
      console.error('Error saving configuration:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('Configuration saved with ID:', this.lastID);
    res.json({ id: this.lastID });
  });
});

// Endpoint to retrieve configurations
app.get('/configurations', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const userId = req.user.id;

  console.log('Fetching configurations for user:', userId);

  db.all('SELECT * FROM configurations WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching configurations:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('Configurations fetched:', rows);
    res.json(rows);
  });
});

// Endpoint to delete a configuration
app.delete('/configurations/:id', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const configurationId = req.params.id;

  db.run('DELETE FROM configurations WHERE id = ? AND user_id = ?', [configurationId, req.user.id], function(err) {
    if (err) {
      console.error('Error deleting configuration:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    res.json({ message: 'Configuration deleted successfully' });
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

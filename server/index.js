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

// Middleware for logging user info
app.use((req, res, next) => {
  console.log('User:', req.user);
  next();
});

// Middleware to check if user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

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

app.get('/profile', ensureAuthenticated, (req, res) => {
  res.json({ user: req.user });
});

app.get('/login-failure', (req, res) => {
  res.json({ message: 'Login failed' });
});

// Endpoint to fetch car models
app.get('/car-models', (req, res) => {
  db.all('SELECT * FROM car_models', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch car models' });
    }
    res.json(rows);
  });
});

// Endpoint to fetch accessories
app.get('/accessories', (req, res) => {
  db.all('SELECT * FROM accessories', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch accessories' });
    }
    res.json(rows);
  });
});

// Endpoint to save configurations
app.post('/configurations', ensureAuthenticated, (req, res) => {
  const { car_model_id, accessories } = req.body;
  const userId = req.user.id;

  db.run(`INSERT INTO configurations (user_id, car_model_id, accessories) VALUES (?, ?, ?)`, [userId, car_model_id, JSON.stringify(accessories)], function (err) {
    if (err) {
      console.error('Error saving configuration:', err.message);
      return res.status(500).json({ error: 'Failed to save configuration' });
    }
    res.json({ id: this.lastID });
  });
});

// Endpoint to retrieve configurations
app.get('/configurations', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;

  db.all('SELECT * FROM configurations WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error('Error fetching configurations:', err.message);
      return res.status(500).json({ error: 'Failed to fetch configurations' });
    }
    res.json(rows);
  });
});

// Endpoint to delete a configuration
app.delete('/configurations/:id', ensureAuthenticated, (req, res) => {
  const configurationId = req.params.id;

  db.run('DELETE FROM configurations WHERE id = ? AND user_id = ?', [configurationId, req.user.id], function(err) {
    if (err) {
      console.error('Error deleting configuration:', err.message);
      return res.status(500).json({ error: 'Failed to delete configuration' });
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

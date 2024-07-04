const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const db = require('./database'); // Ensure this path is correct

const app = express();
const PORT = process.env.PORT || 3001;
const ESTIMATION_SERVER_URL = 'http://localhost:3002/estimate'; // URL of the second server

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
    console.log('Car Models:', rows); // Debugging line
    res.json(rows);
  });
});

// Endpoint to fetch accessories with constraints
app.get('/accessories', (req, res) => {
  db.all('SELECT * FROM accessories', [], (err, accessories) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch accessories' });
    }
    db.all('SELECT * FROM accessory_constraints', [], (err, constraints) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch accessory constraints' });
      }
      console.log('Accessories:', accessories); // Debugging line
      console.log('Constraints:', constraints); // Debugging line
      res.json({ accessories, constraints });
    });
  });
});

// Endpoint to save configurations
app.post('/configurations', ensureAuthenticated, (req, res) => {
  const { car_model_id, accessories } = req.body;
  const userId = req.user.id;

  const accessoryNames = JSON.parse(accessories);

  // Fetch car model to apply constraints
  db.get('SELECT engine_power FROM car_models WHERE id = ?', [car_model_id], (err, carModel) => {
    if (err) {
      console.error('Error fetching car model:', err.message);
      return res.status(500).json({ error: 'Failed to fetch car model' });
    }

    let maxAccessories;
    if (carModel.engine_power === 50) {
      maxAccessories = 4;
    } else if (carModel.engine_power === 100) {
      maxAccessories = 5;
    } else {
      maxAccessories = 7;
    }

    if (accessoryNames.length > maxAccessories) {
      return res.status(400).json({ error: 'Exceeded maximum number of accessories' });
    }

    // Fetch constraints from the database
    db.all('SELECT * FROM accessory_constraints', [], (err, constraints) => {
      if (err) {
        console.error('Error fetching constraints:', err.message);
        return res.status(500).json({ error: 'Failed to fetch constraints' });
      }

      const accessorySet = new Set(accessoryNames);
      for (let accessoryName of accessoryNames) {
        const accessory = constraints.find(c => c.name === accessoryName);
        if (accessory) {
          if (accessory.requires_accessory_id && !accessorySet.has(accessory.requires_accessory_id)) {
            return res.status(400).json({ error: `${accessoryName} requires ${accessory.requires_accessory_id}` });
          }
          if (accessory.incompatible_accessory_id && accessorySet.has(accessory.incompatible_accessory_id)) {
            return res.status(400).json({ error: `${accessoryName} is incompatible with ${accessory.incompatible_accessory_id}` });
          }
        }
      }

      db.serialize(() => {
        // Check if the user already has a configuration
        db.get(`SELECT * FROM configurations WHERE user_id = ?`, [userId], (err, row) => {
          if (err) {
            console.error('Error checking existing configuration:', err.message);
            return res.status(500).json({ error: 'Failed to check existing configuration' });
          }

          const saveConfiguration = () => {
            // Save the new configuration
            db.run(`INSERT INTO configurations (user_id, car_model_id, accessories) VALUES (?, ?, ?)`, [userId, car_model_id, accessories], function (err) {
              if (err) {
                console.error('Error saving configuration:', err.message);
                return res.status(500).json({ error: 'Failed to save configuration' });
              }
              const configurationId = this.lastID;

              // Decrease availability of the selected car model
              db.run('UPDATE car_models SET availability = availability - 1 WHERE id = ?', [car_model_id], function (err) {
                if (err) {
                  console.error('Error updating car model availability:', err.message);
                  return res.status(500).json({ error: 'Failed to update car model availability' });
                }
              });

              // Decrease availability of the selected accessories
              accessoryNames.forEach(accessoryName => {
                db.run('UPDATE accessories SET availability = availability - 1 WHERE name = ?', [accessoryName], function (err) {
                  if (err) {
                    console.error('Error updating accessory availability:', err.message);
                    return res.status(500).json({ error: 'Failed to update accessory availability' });
                  }
                });
              });

              // Fetch the estimation from the second server
              axios.post(ESTIMATION_SERVER_URL, { accessories: accessoryNames, good_client: req.user.good_client })
                .then(response => {
                  res.json({ id: configurationId, estimation: response.data.estimation });
                })
                .catch(error => {
                  console.error('Error fetching estimation:', error.message);
                  res.status(500).json({ error: 'Failed to fetch estimation' });
                });
            });
          };

          if (row) {
            // Replace existing configuration
            db.run('DELETE FROM configurations WHERE id = ?', [row.id], function(err) {
              if (err) {
                console.error('Error deleting existing configuration:', err.message);
                return res.status(500).json({ error: 'Failed to delete existing configuration' });
              }
              saveConfiguration();
            });
          } else {
            saveConfiguration();
          }
        });
      });
    });
  });
});

// Endpoint to retrieve configurations
app.get('/configurations', ensureAuthenticated, (req, res) => {
  const userId = req.user.id;

  db.get('SELECT * FROM configurations WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error fetching configuration:', err.message);
      return res.status(500).json({ error: 'Failed to fetch configuration' });
    }
    if (row) {
      // Fetch the estimation from the second server
      axios.post(ESTIMATION_SERVER_URL, { accessories: JSON.parse(row.accessories), good_client: req.user.good_client })
        .then(response => {
          res.json({ ...row, estimation: response.data.estimation });
        })
        .catch(error => {
          console.error('Error fetching estimation:', error.message);
          res.status(500).json({ error: 'Failed to fetch estimation' });
        });
    } else {
      res.json([]);
    }
  });
});

// Endpoint to delete a configuration
app.delete('/configurations/:id', ensureAuthenticated, (req, res) => {
  const configurationId = req.params.id;

  db.get('SELECT * FROM configurations WHERE id = ? AND user_id = ?', [configurationId, req.user.id], (err, row) => {
    if (err) {
      console.error('Error fetching configuration:', err.message);
      return res.status(500).json({ error: 'Failed to fetch configuration' });
    }
    if (!row) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    const accessoryNames = JSON.parse(row.accessories);

    db.run('DELETE FROM configurations WHERE id = ? AND user_id = ?', [configurationId, req.user.id], function(err) {
      if (err) {
        console.error('Error deleting configuration:', err.message);
        return res.status(500).json({ error: 'Failed to delete configuration' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Configuration not found' });
      }

      // Increase availability of the selected car model
      db.run('UPDATE car_models SET availability = availability + 1 WHERE id = ?', [row.car_model_id], function (err) {
        if (err) {
          console.error('Error updating car model availability:', err.message);
          return res.status(500).json({ error: 'Failed to update car model availability' });
        }
      });

      // Increase availability of the selected accessories
      accessoryNames.forEach(accessoryName => {
        db.run('UPDATE accessories SET availability = availability + 1 WHERE name = ?', [accessoryName], function (err) {
          if (err) {
            console.error('Error updating accessory availability:', err.message);
            return res.status(500).json({ error: 'Failed to update accessory availability' });
          }
        });
      });

      res.json({ message: 'Configuration deleted successfully' });
    });
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

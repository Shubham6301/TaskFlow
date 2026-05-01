require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
const distPath = path.join('/app', 'frontend', 'dist');
  console.log('Serving frontend from:', distPath);
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

sequelize.sync({ alter: false })
  .then(() => {
    console.log('Database synced');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`TaskFlow server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Database sync failed:', err);
    process.exit(1);
  });

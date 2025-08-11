const express = require('express');
const db = require('./database');

// Routes import
const accountRoutes = require('./routes/accounts');
const mediaRoutes = require('./routes/media');
const transactionRoutes = require('./routes/transactions');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Request logging middleware - test ortamında kapalı
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kentkart Database API is running!',
    version: '1.0.0',
    apiVersion: 'v1',
    endpoints: {
      accounts: '/api/v1/accounts',
      media: '/api/v1/media', 
      transactions: '/api/v1/transactions'
    },
    documentation: {
      swagger: '/api/v1/docs',
      postman: '/api/v1/postman'
    }
  });
});

// API V1 Routes
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/transactions', transactionRoutes);

// Legacy routes (redirect to v1)
app.use('/accounts', (req, res) => {
  res.redirect(301, `/api/v1${req.originalUrl}`);
});
app.use('/media', (req, res) => {
  res.redirect(301, `/api/v1${req.originalUrl}`);
});
app.use('/transactions', (req, res) => {
  res.redirect(301, `/api/v1${req.originalUrl}`);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Test modunda server'ı başlatma
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/`);
  });
}

module.exports = app;

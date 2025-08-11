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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
    endpoints: {
      accounts: '/accounts',
      media: '/media', 
      transactions: '/transactions'
    }
  });
});

// API Routes
app.use('/accounts', accountRoutes);
app.use('/media', mediaRoutes);
app.use('/transactions', transactionRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/`);
});

module.exports = app;

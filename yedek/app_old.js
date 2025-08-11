const express = require('express');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Kentkart Database API is running!' });
});

// Get all accounts
app.get('/accounts', (req, res) => {
  db.all('SELECT * FROM account', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new account
app.post('/accounts', (req, res) => {
  const { phone_number } = req.body;
  db.run('INSERT INTO account (phone_number) VALUES (?)', [phone_number], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, phone_number });
  });
});

// Get all media
app.get('/media', (req, res) => {
  db.all('SELECT * FROM media', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new media
app.post('/media', (req, res) => {
  const { account_id, create_date, expiery_date, balance } = req.body;
  db.run('INSERT INTO media (account_id, create_date, expiery_date, balance) VALUES (?, ?, ?, ?)', 
    [account_id, create_date, expiery_date, balance], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ alias_no: this.lastID, account_id, create_date, expiery_date, balance });
  });
});

// Get all transactions
app.get('/transactions', (req, res) => {
  db.all('SELECT * FROM [transaction]', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new transaction
app.post('/transactions', (req, res) => {
  const { alias_no, amount, date, operation } = req.body;
  db.run('INSERT INTO [transaction] (alias_no, amount, date, operation) VALUES (?, ?, ?, ?)', 
    [alias_no, amount, date, operation], function(err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ alias_no, amount, date, operation });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;

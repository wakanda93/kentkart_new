const express = require('express');
const { 
  getAllAccounts, 
  createAccount, 
  getAccountById, 
  updateAccount, 
  deleteAccount 
} = require('../services/accountService');

const router = express.Router();

// GET /accounts - Tüm hesapları getir
router.get('/', async (req, res) => {
  try {
    const accounts = await getAllAccounts();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /accounts - Yeni hesap oluştur
router.post('/', async (req, res) => {
  try {
    const { phone_number } = req.body;
    

    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Phone number format validation (must be 10 or 11 digits, only numbers, and start with 0)
    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ error: 'Invalid phone number format. It must start with 0 and be 11 digits.' });
    }

    const account = await createAccount(phone_number);
    res.status(201).json(account);
  } catch (error) {
    // SQLite UNIQUE constraint hatası kontrolü
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Account with this phone number already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /accounts/:id - Belirli bir hesabı getir
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const account = await getAccountById(id);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /accounts/:id - Hesap güncelle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone_number } = req.body;
    
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Hesap var mı kontrol et
    const existingAccount = await getAccountById(id);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const updatedAccount = await updateAccount(id, phone_number);
    res.json(updatedAccount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /accounts/:id - Hesap sil
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Hesap var mı kontrol et
    const existingAccount = await getAccountById(id);
    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = await deleteAccount(id);
    res.json({ message: 'Account deleted successfully', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

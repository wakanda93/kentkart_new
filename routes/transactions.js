const express = require('express');
const { 
  getAllTransactions, 
  createTransaction, 
  getTransactionsByAliasNo, 
  getTransactionsByDateRange,
  createRecharge,
  createUsage,
  getTransactionsByType
} = require('../services/transactionService');
const { getMediaByAliasNo } = require('../services/mediaService');

const router = express.Router();

// GET /transactions - Tüm işlemleri getir
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let transactions;
    if (startDate && endDate) {
      transactions = await getTransactionsByDateRange(startDate, endDate);
    } else {
      transactions = await getAllTransactions();
    }
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /transactions - Yeni işlem oluştur
router.post('/', async (req, res) => {
  try {
    const { alias_no, amount, operation } = req.body;
    
    if (!alias_no || amount === undefined || !operation) {
      return res.status(400).json({ 
        error: 'alias_no, amount, and operation are required' 
      });
    }

    if (!['recharge', 'usage'].includes(operation)) {
      return res.status(400).json({ 
        error: 'Operation must be either "recharge" or "usage"' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Media var mı kontrol et
    const media = await getMediaByAliasNo(alias_no);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Media status kontrolü - blacklist medialarda transaction yapılamaz
    if (media.status === 'blacklist') {
      return res.status(400).json({ 
        error: 'Transaction not allowed - media is blacklisted' 
      });
    }

    const result = await createTransaction(alias_no, amount, operation);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Insufficient balance') {
      res.status(400).json({ error: error.message });
    } else if (error.message === 'Transaction not allowed - media is blacklisted') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /transactions/recharge - Recharge işlemi (eski refill endpoint)
router.post('/recharge', async (req, res) => {
  try {
    const { alias_no, amount } = req.body;
    
    if (!alias_no || amount === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: alias_no and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Media var mı kontrol et
    const media = await getMediaByAliasNo(alias_no);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Media status kontrolü - blacklist medialarda transaction yapılamaz
    if (media.status === 'blacklist') {
      return res.status(400).json({ 
        error: 'Transaction not allowed - media is blacklisted' 
      });
    }

    const result = await createRecharge(alias_no, amount);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Transaction not allowed - media is blacklisted') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /transactions/usage - Usage işlemi (eski deduction endpoint)
router.post('/usage', async (req, res) => {
  try {
    const { alias_no, amount } = req.body;
    
    if (!alias_no || amount === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: alias_no and amount are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be greater than 0' 
      });
    }

    // Media var mı kontrol et
    const media = await getMediaByAliasNo(alias_no);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Media status kontrolü - blacklist medialarda transaction yapılamaz
    if (media.status === 'blacklist') {
      return res.status(400).json({ 
        error: 'Transaction not allowed - media is blacklisted' 
      });
    }

    const result = await createUsage(alias_no, amount);
    res.status(201).json(result);
  } catch (error) {
    if (error.message === 'Insufficient balance') {
      res.status(400).json({ error: error.message });
    } else if (error.message === 'Transaction not allowed - media is blacklisted') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /transactions/media/:aliasNo - Alias numarasına göre işlemleri getir
router.get('/media/:aliasNo', async (req, res) => {
  try {
    const { aliasNo } = req.params;
    
    // Media var mı kontrol et
    const media = await getMediaByAliasNo(aliasNo);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const transactions = await getTransactionsByAliasNo(aliasNo);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /transactions/type/:type - İşlem tipine göre işlemleri getir
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['recharge', 'usage'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid transaction type. Must be either "recharge" or "usage"' 
      });
    }

    const transactions = await getTransactionsByType(type);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

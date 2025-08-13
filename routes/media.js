const express = require('express');
const { 
  getAllMedia, 
  createMedia, 
  getMediaByAliasNo, 
  getMediaByAccountId, 
  getMediaByStatus,
  getOrphanMedia,
  updateMediaBalance,
  updateMediaStatus
} = require('../services/mediaService');
const { getAccountById } = require('../services/accountService');

const router = express.Router();

// GET /media - Tüm media kayıtlarını getir
router.get('/', async (req, res) => {
  try {
    const media = await getAllMedia();
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /media - Yeni media oluştur
router.post('/', async (req, res) => {
  try {
    const { account_id, expiery_date, balance, status } = req.body;
    
    if (!expiery_date || balance === undefined) {
      return res.status(400).json({ 
        error: 'expiery_date and balance are required. account_id and status are optional.' 
      });
    }

    // CRITICAL SECURITY FIX: Balance validation - Negatif ve sıfır bakiye güvenlik kontrolü
    // Convert string to number if needed
    const numBalance = Number(balance);
    
    if (isNaN(numBalance)) {
      return res.status(400).json({ 
        error: 'Balance must be a valid number.' 
      });
    }
    
    if (numBalance < 0) {
      return res.status(400).json({ 
        error: 'Balance cannot be negative - this is a security violation.' 
      });
    }
    
    if (numBalance === 0) {
      return res.status(400).json({ 
        error: 'Balance must be greater than 0 - zero balance cards are not allowed.' 
      });
    }

    // Status validation (opsiyonel, default 'active')
    if (status && !['active', 'blacklist'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: active, blacklist' 
      });
    }

    // Account ID validation - undefined ise error ver, null ise orphan media oluştur
    if (account_id === undefined) {
      return res.status(400).json({ 
        error: 'account_id field is required - use null for orphan media or provide valid account_id' 
      });
    }
    
    // Eğer account_id null değilse, hesap var mı kontrol et
    if (account_id !== null && account_id !== undefined) {
      const account = await getAccountById(account_id);
      if (!account) {
        return res.status(404).json({ error: 'Account not found' });
      }
    }

    const media = await createMedia(account_id, expiery_date, numBalance, status);
    res.status(201).json(media);
  } catch (error) {
    // Service layer validation hatalarını 400 olarak handle et
    if (error.message.includes('Balance cannot be negative') || 
        error.message.includes('Balance must be greater than 0') ||
        error.message.includes('Invalid status')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /media/status/:status - Status'a göre media kayıtlarını getir
router.get('/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    if (!['active', 'blacklist'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: active, blacklist' 
      });
    }

    const media = await getMediaByStatus(status);
    res.json({
      status: status,
      count: media.length,
      data: media
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /media/orphan - Hesabı olmayan media kayıtlarını getir
router.get('/orphan', async (req, res) => {
  try {
    const orphanMedia = await getOrphanMedia();
    res.json({
      count: orphanMedia.length,
      message: 'Media records without account (orphaned)',
      data: orphanMedia
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /media/:aliasNo - Belirli bir media kaydını getir
router.get('/:aliasNo', async (req, res) => {
  try {
    const { aliasNo } = req.params;
    const media = await getMediaByAliasNo(aliasNo);
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /media/account/:accountId - Hesap ID'ye göre media kayıtlarını getir
router.get('/account/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // Hesap var mı kontrol et
    const account = await getAccountById(accountId);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const media = await getMediaByAccountId(accountId);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /media/:aliasNo/balance - Media bakiyesini güncelle
router.put('/:aliasNo/balance', async (req, res) => {
  try {
    const { aliasNo } = req.params;
    const { balance } = req.body;
    
    if (balance === undefined) {
      return res.status(400).json({ error: 'Balance is required' });
    }
    
    if (typeof balance !== 'number') {
      return res.status(400).json({ 
        error: 'Balance must be a number.' 
      });
    }
    
    if (balance < 0) {
      return res.status(400).json({ 
        error: 'Balance cannot be negative - this is a security violation.' 
      });
    }

    // Media var mı kontrol et
    const media = await getMediaByAliasNo(aliasNo);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const updatedMedia = await updateMediaBalance(aliasNo, balance);
    res.json(updatedMedia);
  } catch (error) {
    // Service layer validation hatalarını 400 olarak handle et
    if (error.message.includes('Balance cannot be negative')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /media/:aliasNo/status - Media status'unu güncelle
router.put('/:aliasNo/status', async (req, res) => {
  try {
    const { aliasNo } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    if (!['active', 'blacklist'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: active, blacklist' 
      });
    }

    // Media var mı kontrol et
    const media = await getMediaByAliasNo(aliasNo);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const updatedMedia = await updateMediaStatus(aliasNo, status);
    res.json(updatedMedia);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

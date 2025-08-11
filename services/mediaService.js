const db = require('../database');
const { getAccountById } = require('./accountService');

// Tüm media kayıtlarını getir
const getAllMedia = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT m.*, a.phone_number 
            FROM media m 
            LEFT JOIN account a ON m.account_id = a.account_id`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Yeni media oluştur
const createMedia = async (accountId, expieryDate, balance, status = 'active') => {
  // Create date'i otomatik olarak şu anki tarih yap
  const createDate = new Date().toISOString();
  
  // CRITICAL: Balance validation - Negatif ve sıfır bakiye güvenlik kontrolü
  if (balance < 0) {
    throw new Error('Balance cannot be negative - this is a security violation');
  }
  
  if (balance === 0) {
    throw new Error('Balance must be greater than 0 - zero balance cards are not allowed');
  }
  
  // Status validation
  if (!['active', 'blacklist'].includes(status)) {
    throw new Error('Invalid status. Must be one of: active, blacklist');
  }
  
  // Account ID varsa, hesabın var olduğunu kontrol et
  if (accountId) {
    const account = await getAccountById(accountId);
    if (!account) {
      throw new Error('Account not found - cannot create media with invalid account_id');
    }
  }

  return new Promise((resolve, reject) => {
    db.run('INSERT INTO media (account_id, create_date, expiery_date, balance, status) VALUES (?, ?, ?, ?, ?)', 
      [accountId, createDate, expieryDate, balance, status], function(err) {
      if (err) {
        // Foreign key constraint hatası özel mesaj
        if (err.message.includes('FOREIGN KEY constraint failed')) {
          reject(new Error('Invalid account_id - account does not exist'));
        } else {
          reject(err);
        }
      } else {
        resolve({
          alias_no: this.lastID,
          account_id: accountId,
          create_date: createDate,
          expiery_date: expieryDate,
          balance: balance,
          status: status
        });
      }
    });
  });
};

// Alias numarasına göre media getir
const getMediaByAliasNo = (aliasNo) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT m.*, a.phone_number 
            FROM media m 
            LEFT JOIN account a ON m.account_id = a.account_id 
            WHERE m.alias_no = ?`, [aliasNo], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Hesap ID'ye göre media kayıtlarını getir
const getMediaByAccountId = (accountId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM media WHERE account_id = ?', [accountId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Status'a göre media kayıtlarını getir
const getMediaByStatus = (status) => {
  return new Promise((resolve, reject) => {
    if (!['active', 'blacklist'].includes(status)) {
      reject(new Error('Invalid status. Must be one of: active, blacklist'));
      return;
    }
    
    db.all(`SELECT m.*, a.phone_number 
            FROM media m 
            LEFT JOIN account a ON m.account_id = a.account_id 
            WHERE m.status = ?`, [status], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Orphan media'ları getir (account_id NULL olanlar)
const getOrphanMedia = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM media WHERE account_id IS NULL', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Media balance'ını güncelle
const updateMediaBalance = (aliasNo, newBalance) => {
  return new Promise((resolve, reject) => {
    // CRITICAL: Balance validation - Negatif bakiye güvenlik kontrolü
    if (newBalance < 0) {
      reject(new Error('Balance cannot be negative - this is a security violation'));
      return;
    }
    
    db.run('UPDATE media SET balance = ? WHERE alias_no = ?', [newBalance, aliasNo], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          alias_no: parseInt(aliasNo), // Route'dan string geldiği için number'a çevir
          balance: newBalance,
          changes: this.changes
        });
      }
    });
  });
};

// Media status'unu güncelle
const updateMediaStatus = (aliasNo, newStatus) => {
  return new Promise((resolve, reject) => {
    if (!['active', 'blacklist'].includes(newStatus)) {
      reject(new Error('Invalid status. Must be one of: active, blacklist'));
      return;
    }
    
    db.run('UPDATE media SET status = ? WHERE alias_no = ?', [newStatus, aliasNo], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          alias_no: parseInt(aliasNo), // Route'dan string geldiği için number'a çevir
          status: newStatus,
          changes: this.changes
        });
      }
    });
  });
};

module.exports = {
  getAllMedia,
  createMedia,
  getMediaByAliasNo,
  getMediaByAccountId,
  getMediaByStatus,
  getOrphanMedia,
  updateMediaBalance,
  updateMediaStatus
};

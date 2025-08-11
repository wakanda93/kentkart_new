const db = require('../database');

// Tüm hesapları getir
const getAllAccounts = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM account', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Yeni hesap oluştur
const createAccount = (phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO account (phone_number) VALUES (?)', [phoneNumber], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          account_id: this.lastID,
          phone_number: phoneNumber
        });
      }
    });
  });
};

// Hesap ID'ye göre hesap getir
const getAccountById = (accountId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM account WHERE account_id = ?', [accountId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Hesap güncelle
const updateAccount = (accountId, phoneNumber) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE account SET phone_number = ? WHERE account_id = ?', [phoneNumber, accountId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          account_id: parseInt(accountId), // String'i number'a çevir
          phone_number: phoneNumber,
          changes: this.changes
        });
      }
    });
  });
};

// Hesap sil - bağlı media'ların account_id'si NULL yapılır (CASCADE)
const deleteAccount = (accountId) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM account WHERE account_id = ?', [accountId], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error('Account not found'));
        } else {
          resolve({ 
            deletedRows: this.changes,
            message: 'Account deleted successfully. Associated media account_id set to NULL.'
          });
        }
      }
    });
  });
};

module.exports = {
  getAllAccounts,
  createAccount,
  getAccountById,
  updateAccount,
  deleteAccount
};

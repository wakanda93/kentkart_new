const db = require('../database');
const { getMediaByAliasNo } = require('./mediaService');

// Tüm işlemleri getir
const getAllTransactions = () => {
  return new Promise((resolve, reject) => {
// Transaction bilgileri (t.*), Media'nın bağlı olduğu hesap ID'si (m.account_id), account'ın telefon numarası (a.phone_number)
    db.all(`SELECT t.*, m.account_id, a.phone_number                                  
            FROM [transaction] t 
            LEFT JOIN media m ON t.alias_no = m.alias_no 
            LEFT JOIN account a ON m.account_id = a.account_id`, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Yeni işlem oluştur ve bakiyeyi güncelle
const createTransaction = (aliasNo, amount, operation) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Otomatik olarak şu anki tarih ve saati al
      const now = new Date();
      const currentDateTime = now.getFullYear() + '-' + 
                             String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                             String(now.getDate()).padStart(2, '0') + ' ' +
                             String(now.getHours()).padStart(2, '0') + ':' +
                             String(now.getMinutes()).padStart(2, '0') + ':' +
                             String(now.getSeconds()).padStart(2, '0');
      
      // Önce media bilgilerini al ve varlığını kontrol et
      const media = await getMediaByAliasNo(aliasNo);
      if (!media) {
        reject(new Error('Media not found - cannot create transaction without valid media'));
        return;
      }

      // Media status kontrolü - blacklist medialarda transaction yapılamaz
      if (media.status === 'blacklist') {
        reject(new Error('Transaction not allowed - media is blacklisted'));
        return;
      }

      let newBalance = media.balance;
      
      // İşlem türüne göre bakiyeyi hesapla
      if (operation === 'recharge') {
        newBalance += amount;   // para yükleme
      } else if (operation === 'usage') {
        if (media.balance < amount) {     // yetersiz bakiye kontrolü
          reject(new Error('Insufficient balance')); 
          return;
        }
        newBalance -= amount; // para çekme
      }

      // Transaction ile birlikte bakiyeyi güncelle (atomic operation)
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // İşlemi kaydet
        db.run('INSERT INTO [transaction] (alias_no, amount, date, operation) VALUES (?, ?, ?, ?)', 
          [aliasNo, amount, currentDateTime, operation], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const transactionResult = {
            alias_no: aliasNo,
            amount: amount,
            date: currentDateTime,
            operation: operation
          };
          
          // Bakiyeyi güncelle
          db.run('UPDATE media SET balance = ? WHERE alias_no = ?', [newBalance, aliasNo], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            db.run('COMMIT', (err) => {
              if (err) {
                reject(err);
                return;
              }
              
              resolve({
                transaction: transactionResult,
                oldBalance: media.balance,
                newBalance: newBalance
              });
            });
          });
        });
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Alias numarasına göre işlemleri getir
const getTransactionsByAliasNo = (aliasNo) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM [transaction] WHERE alias_no = ? ORDER BY date DESC', [aliasNo], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Tarih aralığına göre işlemleri getir
const getTransactionsByDateRange = (startDate, endDate) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT t.*, m.account_id, a.phone_number 
            FROM [transaction] t 
            LEFT JOIN media m ON t.alias_no = m.alias_no 
            LEFT JOIN account a ON m.account_id = a.account_id 
            WHERE t.date BETWEEN ? AND ? 
            ORDER BY t.date DESC`, [startDate, endDate], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Recharge işlemi (eski refill)
const createRecharge = async (aliasNo, amount) => {
  return createTransaction(aliasNo, amount, 'recharge');
};

// Usage işlemi (eski deduction)
const createUsage = async (aliasNo, amount) => {
  return createTransaction(aliasNo, amount, 'usage');
};

// İşlem tipine göre işlemleri getir
const getTransactionsByType = (transactionType) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM [transaction] WHERE operation = ? ORDER BY date DESC', [transactionType], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  getAllTransactions,
  createTransaction,
  getTransactionsByAliasNo,
  getTransactionsByDateRange,
  createRecharge,
  createUsage,
  getTransactionsByType
};

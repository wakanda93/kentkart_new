const db = require('../database');


const dbHelper = {
    
    findAccountByPhone: (phoneNumber) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT account_id, phone_number FROM account WHERE phone_number = ?', [phoneNumber], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    
    findAccountById: (accountId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT account_id, phone_number FROM account WHERE account_id = ?', [accountId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    
    getAllAccounts: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT account_id, phone_number FROM account', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    
    createAccount: (phoneNumber) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT INTO account (phone_number) VALUES (?)', [phoneNumber], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        account_id: this.lastID,
                        phone_number: phoneNumber
                    });
                }
            });
        });
    },

    createAccountWithId: (accountId, phoneNumber) => {
        return new Promise((resolve, reject) => {
            db.run('INSERT OR REPLACE INTO account (account_id, phone_number) VALUES (?, ?)', [accountId, phoneNumber], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        account_id: accountId,
                        phone_number: phoneNumber
                    });
                }
            });
        });
    },

    accountExists: (accountId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM account WHERE account_id = ?', [accountId], (err, row) => {
                if (err) reject(err);
                else {
                    resolve(row.count > 0);
                }
            });
        });
    },

    
    updateAccount: (accountId, phoneNumber) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE account SET phone_number = ? WHERE account_id = ?', [phoneNumber, accountId], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        account_id: accountId,
                        phone_number: phoneNumber,
                        changes: this.changes
                    });
                }
            });
        });
    },

    updateAccountId: (oldId, newId) => {
        return new Promise((resolve, reject) => {
            // Önce media'ların account_id'sini güncelle
            db.run('UPDATE media SET account_id = ? WHERE account_id = ?', [newId, oldId], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Sonra account'un ID'sini güncelle
                db.run('UPDATE account SET account_id = ? WHERE account_id = ?', [newId, oldId], function(err) {
                    if (err) reject(err);
                    else resolve({ changes: this.changes });
                });
            });
        });
    },

    updateMediaAccountId: (oldAccountId, newAccountId) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE media SET account_id = ? WHERE account_id = ?', [newAccountId, oldAccountId], function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes });
            });
        });
    },

    
    deleteAccount: (accountId) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM account WHERE account_id = ?', [accountId], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        changes: this.changes
                    });
                }
            });
        });
    },

    deleteMedia: (aliasNo) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM media WHERE alias_no = ?', [aliasNo], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        changes: this.changes
                    });
                }
            });
        });
    },

    
    accountExists: (accountId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM account WHERE account_id = ?', [accountId], (err, row) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            });
        });
    },


    phoneNumberExists: (phoneNumber) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM account WHERE phone_number = ?', [phoneNumber], (err, row) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            });
        });
    },

    // Media Helper Functions
    findMediaByAlias: (aliasNo) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT alias_no, account_id, balance, status, expiery_date FROM media WHERE alias_no = ?', [aliasNo], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    getAllMedia: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT alias_no, account_id, balance, status, expiery_date FROM media', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getMediaByAccount: (accountId) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT alias_no, account_id, balance, status, expiery_date FROM media WHERE account_id = ?', [accountId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    getOrphanMedia: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT alias_no, account_id, balance, status, expiery_date FROM media WHERE account_id IS NULL', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    findMediaByAccount: (accountId) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT alias_no, account_id, balance, status, expiery_date FROM media WHERE account_id = ?', [accountId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },

    findOrphanMedia: () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT alias_no, account_id, balance, status, expiery_date FROM media WHERE account_id IS NULL', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    createMedia: (mediaData) => {
        return new Promise((resolve, reject) => {
            const { account_id, balance, status, expiery_date } = mediaData;
            db.run('INSERT INTO media (account_id, balance, status, expiery_date) VALUES (?, ?, ?, ?)', 
                   [account_id, balance, status, expiery_date], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        alias_no: this.lastID,
                        account_id,
                        balance,
                        status,
                        expiery_date
                    });
                }
            });
        });
    },

    createBlacklistedMedia: (accountId, index = 0) => {
        return new Promise((resolve, reject) => {
            const testData = require('./testData');
            const mediaData = testData.media.blacklisted[index]; // Index'e göre blacklisted media verisini kullan
            db.run('INSERT INTO media (account_id, balance, status, expiery_date) VALUES (?, ?, ?, ?)', 
                   [accountId, mediaData.balance, mediaData.status, mediaData.expiery_date], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        alias_no: this.lastID,
                        account_id: accountId,
                        balance: mediaData.balance,
                        status: mediaData.status,
                        expiery_date: mediaData.expiery_date
                    });
                }
            });
        });
    },

    updateMediaBalance: (aliasNo, balance) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE media SET balance = ? WHERE alias_no = ?', [balance, aliasNo], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        alias_no: aliasNo,
                        balance: balance,
                        changes: this.changes
                    });
                }
            });
        });
    },

    updateMediaStatus: (aliasNo, status) => {
        return new Promise((resolve, reject) => {
            db.run('UPDATE media SET status = ? WHERE alias_no = ?', [status, aliasNo], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        alias_no: aliasNo,
                        status: status,
                        changes: this.changes
                    });
                }
            });
        });
    },

    deleteMedia: (aliasNo) => {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM media WHERE alias_no = ?', [aliasNo], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        changes: this.changes
                    });
                }
            });
        });
    },

    mediaExists: (aliasNo) => {
        return new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM media WHERE alias_no = ?', [aliasNo], (err, row) => {
                if (err) reject(err);
                else resolve(row.count > 0);
            });
        });
    },

    clearTestTransactions: () => {
        return new Promise((resolve, reject) => {
            // Test sırasında oluşturulan transaction'ları temizle
            // Bu fonksiyon test sırasında oluşturulan tüm transaction'ları siler
            db.run('DELETE FROM [transaction]', [], function(err) {
                if (err) reject(err);
                else {
                    resolve({
                        changes: this.changes
                    });
                }
            });
        });
    }
};

module.exports = dbHelper;

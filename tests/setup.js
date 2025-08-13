const db = require('../database');
const chai = require('chai');
const chaiHttp = require('chai-http');
// Docker API için URL
const API_BASE_URL = 'http://localhost:3000';

chai.use(chaiHttp);

// Database durumu kontrol fonksiyonları
const checkDatabaseCounts = () => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT 
            (SELECT COUNT(*) FROM account) as accounts,
            (SELECT COUNT(*) FROM media) as medias,
            (SELECT COUNT(*) FROM [transaction]) as transactions`, 
        [], (err, row) => {
            if (err) reject(err);
            else resolve(row || {accounts: 0, medias: 0, transactions: 0});
        });
    });
};

// Database helper fonksiyonları - Docker API'sinden veri çekiyor
const getTestAccounts = async () => {
    try {
        const response = await chai.request(API_BASE_URL).get('/api/v1/accounts');
        return response.body;
    } catch (error) {
        throw error;
    }
};

const getTestMedia = async () => {
    try {
        const response = await chai.request(API_BASE_URL).get('/api/v1/media');
        return response.body;
    } catch (error) {
        throw error;
    }
};

// HTTP Helper fonksiyonları - Docker API'ye request atıyor
const httpHelpers = {
    // Account API helpers
    getAllAccounts: () => {
        return chai.request(API_BASE_URL).get('/api/v1/accounts');
    },

    getAccountById: (accountId) => {
        return chai.request(API_BASE_URL).get(`/api/v1/accounts/${accountId}`);
    },

    createAccount: (phoneNumber) => {
        return chai.request(API_BASE_URL)
            .post('/api/v1/accounts')
            .send({ phone_number: phoneNumber });
    },

    updateAccount: (accountId, phoneNumber) => {
        return chai.request(API_BASE_URL)
            .put(`/api/v1/accounts/${accountId}`)
            .send({ phone_number: phoneNumber });
    },

    deleteAccount: (accountId) => {
        return chai.request(API_BASE_URL)
            .delete(`/api/v1/accounts/${accountId}`);
    },

    // Media API helpers
    getAllMedia: () => {
        return chai.request(API_BASE_URL).get('/api/v1/media');
    },

    getMediaByAlias: (aliasNo) => {
        return chai.request(API_BASE_URL).get(`/api/v1/media/${aliasNo}`);
    },

    getMediaByAccount: (accountId) => {
        return chai.request(API_BASE_URL).get(`/api/v1/media/account/${accountId}`);
    },

    getOrphanMedia: () => {
        return chai.request(API_BASE_URL).get('/api/v1/media/orphan');
    },

    createMedia: (data) => {
        return chai.request(API_BASE_URL)
            .post('/api/v1/media')
            .send(data);
    },

    // Transaction API helpers
    getAllTransactions: () => {
        return chai.request(API_BASE_URL).get('/api/v1/transactions');
    },

    createTransaction: (data) => {
        return chai.request(API_BASE_URL)
            .post('/api/v1/transactions')
            .send(data);
    },

    getTransactionsByAlias: (aliasNo) => {
        return chai.request(API_BASE_URL).get(`/api/v1/transactions/media/${aliasNo}`);
    }
};

// Helper function to create account - sadece database işlemi
const createAccount = (phoneNumber) => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO account (phone_number) VALUES (?)',
            [phoneNumber],
            function(err) {
                if (err) reject(err);
                else resolve({
                    account_id: this.lastID,
                    phone_number: phoneNumber
                });
            }
        );
    });
};

// Helper function to create media - sadece database işlemi
const createMedia = (accountId, balance, status, expiryDate) => {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO media (account_id, create_date, expiery_date, balance, status) VALUES (?, ?, ?, ?, ?)',
            [accountId, new Date().toISOString().split('T')[0], expiryDate, balance, status],
            function(err) {
                if (err) reject(err);
                else resolve({
                    alias_no: this.lastID,
                    account_id: accountId,
                    create_date: new Date().toISOString().split('T')[0],
                    expiery_date: expiryDate,
                    balance: balance,
                    status: status
                });
            }
        );
    });
};

const setupTestData = async () => {
    try {
        // SABİT VERİLERİ KORUMA MOD'u - Hiçbir veri ekleme/değiştirme yapma
        // Sadece mevcut verileri API'den al ve döndür
        
        const existingAccounts = await httpHelpers.getAllAccounts();
        const existingMedia = await httpHelpers.getAllMedia();
        
        // Mevcut verileri olduğu gibi döndür - hiçbir değişiklik yapma
        return {
            accounts: existingAccounts.body || [],
            media: existingMedia.body || []
        };

    } catch (error) {
        console.error('❌ Test verisi alınırken hata:', error);
        throw error;
    }
};

const cleanupTestData = async () => {
    try {
        // HEM test öncesi HEM test sonrası temizlik
        // Sadece test sırasında oluşturulan geçici verileri temizle
        // Sabit verileri (05599999999, 05511111111, 05522222222) KORUYALIM
        
        const tempTestPhones = [
            "05551111001", "05551111002", "05551111003", "05551111004", // Test account'ları da temizle
            "05551111005", "05551111006", "05551111007", "05551111008", "05551111009", "05551111010", // Test sırasında oluşturulan
            "05551234567", "05559876543", "05551111111" // Eski geçici numaralar
        ];
        
        // 1. Geçici test hesaplarına ait transaction'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IN (${tempTestPhones.map(() => '?').join(',')})
                )
            )`, tempTestPhones, (err) => {
                resolve();
            });
        });

        // 2. Invalid pattern'li account'ların transaction'larını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE 
                    phone_number LIKE 'invalid-%' OR 
                    phone_number LIKE 'unique-invalid-%' OR
                    phone_number LIKE 'test-%'
                )
            )`, [], (err) => {
                resolve();
            });
        });

        // 3. Geçici test hesaplarına ait media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IN (
                SELECT account_id FROM account WHERE phone_number IN (${tempTestPhones.map(() => '?').join(',')})
            )`, tempTestPhones, (err) => {
                resolve();
            });
        });

        // 4. Invalid pattern'li media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IN (
                SELECT account_id FROM account WHERE 
                phone_number LIKE 'invalid-%' OR 
                phone_number LIKE 'unique-invalid-%' OR
                phone_number LIKE 'test-%'
            )`, [], (err) => {
                resolve();
            });
        });

        // 5. Geçici test hesaplarını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE phone_number IN (${tempTestPhones.map(() => '?').join(',')})`, 
                tempTestPhones, (err) => {
                resolve();
            });
        });

        // 6. Invalid pattern'li hesapları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE 
                phone_number LIKE 'invalid-%' OR 
                phone_number LIKE 'unique-invalid-%' OR
                phone_number LIKE 'test-%'`, [], (err) => {
                resolve();
            });
        });
        
    } catch (error) {
        console.error('❌ Test verisi temizlenirken hata:', error);
    }
};

module.exports = {
    setupTestData,
    cleanupTestData,
    getTestAccounts,
    getTestMedia,
    httpHelpers,
    checkDatabaseCounts
};
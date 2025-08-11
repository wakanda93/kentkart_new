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

const setupTestData = async () => {
    try {
        // Önce mevcut test verilerini temizle
        await cleanupTestData();
        
        // Statik test account'larını oluştur
        const account1 = await httpHelpers.createAccount("05551111001");
        const account2 = await httpHelpers.createAccount("05551111002"); 
        const account3 = await httpHelpers.createAccount("05551111003");
        const account4 = await httpHelpers.createAccount("05551111004");
        
        // Statik test media'larını oluştur
        const media1 = await httpHelpers.createMedia({
            account_id: account1.body.account_id,
            balance: 100,
            status: "active",
            expiery_date: "2026-08-06"
        });
        
        const media2 = await httpHelpers.createMedia({
            account_id: account1.body.account_id,
            balance: 200,
            status: "blacklist",
            expiery_date: "2026-08-06"
        });
        
        const media3 = await httpHelpers.createMedia({
            account_id: account2.body.account_id,
            balance: 300,
            status: "active",
            expiery_date: "2026-03-01"
        });
        
        const media4 = await httpHelpers.createMedia({
            account_id: account3.body.account_id,
            balance: 0,
            status: "active",
            expiery_date: "2026-03-01"
        });
        
        // Setup tamamlandı - statik test verileri hazır
        return {
            accounts: [account1.body, account2.body, account3.body, account4.body],
            media: [media1.body, media2.body, media3.body, media4.body]
        };

    } catch (error) {
        console.error('❌ Test verisi oluşturulurken hata:', error);
        throw error;
    }
};

const cleanupTestData = async () => {
    try {
        // Sadece statik test telefon numaralarını tanımla
        const staticTestPhones = [
            "05551111001", "05551111002", "05551111003", "05551111004", // Setup statik numaralar
            "05551111005", "05551111006", "05551111007", // Test sırasında oluşturulan numaralar
            "05551234567", "05559876543", "05551111111" // Eski statik numaralar (varsa)
        ];
        
        // 1. Statik test hesaplarına ait transaction'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IN (${staticTestPhones.map(() => '?').join(',')})
                )
            )`, staticTestPhones, (err) => {
                resolve();
            });
        });

        // 2. Test sırasında oluşturulan account'ların transaction'larını sil (invalid pattern'ler)
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

        // 3. Statik test hesaplarına ait media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IN (
                SELECT account_id FROM account WHERE phone_number IN (${staticTestPhones.map(() => '?').join(',')})
            )`, staticTestPhones, (err) => {
                resolve();
            });
        });

        // 4. Test sırasında oluşturulan media'ları sil (invalid pattern'ler)
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

        // 5. Statik test hesaplarını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE phone_number IN (${staticTestPhones.map(() => '?').join(',')})`, 
                staticTestPhones, (err) => {
                resolve();
            });
        });

        // 6. Test sırasında oluşturulan hesapları sil (invalid pattern'ler)
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

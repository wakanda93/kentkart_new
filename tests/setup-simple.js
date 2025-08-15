const db = require('../database');
const chai = require('chai');
const chaiHttp = require('chai-http');
const testData = require('./testData');
const dbHelper = require('./dbHelper');

// API base URL
const API_BASE_URL = 'http://localhost:3000';

chai.use(chaiHttp);

// Basit database kontrol fonksiyonu
const checkDatabase = () => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT 
            (SELECT COUNT(*) FROM account) as accounts,
            (SELECT COUNT(*) FROM media) as medias,
            (SELECT COUNT(*) FROM [transaction]) as transactions`, 
        [], (err, row) => {
            if (err) {
                reject(err);
            } else {
                const result = row || {accounts: 0, medias: 0, transactions: 0};
                resolve(result);
            }
        });
    });
};

// Basit HTTP istekleri
const api = {
    // Account işlemleri
    accounts: {
        getAll: () => chai.request(API_BASE_URL).get('/api/v1/accounts'),
        getById: (id) => chai.request(API_BASE_URL).get(`/api/v1/accounts/${id}`),
        create: (phoneNumber) => chai.request(API_BASE_URL)
            .post('/api/v1/accounts')
            .send({ phone_number: phoneNumber }),
        update: (id, phoneNumber) => chai.request(API_BASE_URL)
            .put(`/api/v1/accounts/${id}`)
            .send({ phone_number: phoneNumber }),
        delete: (id) => chai.request(API_BASE_URL).delete(`/api/v1/accounts/${id}`)
    },

    // Media işlemleri
    media: {
        getAll: () => chai.request(API_BASE_URL).get('/api/v1/media'),
        getByAlias: (alias) => chai.request(API_BASE_URL).get(`/api/v1/media/${alias}`),
        getByAccount: (accountId) => chai.request(API_BASE_URL).get(`/api/v1/media/account/${accountId}`),
        getOrphan: () => chai.request(API_BASE_URL).get('/api/v1/media/orphan'),
        create: (data) => chai.request(API_BASE_URL)
            .post('/api/v1/media')
            .send(data),
        updateBalance: (aliasNo, balance) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/balance`)
            .send({ balance }),
        updateBalanceWithEmptyBody: (aliasNo) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/balance`)
            .send({}),
        updateStatus: (aliasNo, status) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/status`)
            .send({ status }),
        updateStatusWithEmptyBody: (aliasNo) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/status`)
            .send({})
    },

    // Transaction işlemleri
    transactions: {
        getAll: () => chai.request(API_BASE_URL).get('/api/v1/transactions'),
        getByAlias: (alias) => chai.request(API_BASE_URL).get(`/api/v1/transactions/media/${alias}`),
        create: (data) => chai.request(API_BASE_URL)
            .post('/api/v1/transactions')
            .send(data)
    }
};

// Test data setini kullanarak database'e veri insert et
// Test verisi hazırlama fonksiyonu - Basitleştirilmiş
const  prepareTestData = async () => {

    
    try {
        // Önce tüm test hesaplarını oluştur veya mevcut olanları al
        const accounts = [];
        
        // Static test hesaplarını oluştur veya mevcut olanları al
        for (const accountData of testData.accounts.static) {
            let account = await dbHelper.findAccountByPhone(accountData.phone_number);
            if (!account) {
                account = await dbHelper.createAccount(accountData.phone_number);
            }
            accounts.push(account);
        }
        

        
        // Static test media'larını oluştur
        for (const mediaData of testData.media.static) {
            const accountIndex = mediaData.account_index;
            const accountId = accountIndex !== null ? accounts[accountIndex].account_id : null;
            
            const media = await dbHelper.createMedia({
                account_id: accountId,
                balance: mediaData.balance,
                status: mediaData.status,
                expiery_date: mediaData.expiery_date
            });
            

        }
        
        // Orphan media'ları oluştur
        for (const mediaData of testData.media.orphan) {
            const media = await dbHelper.createMedia({
                account_id: null,
                balance: mediaData.balance,
                status: mediaData.status,
                expiery_date: mediaData.expiery_date
            });
            

        }
        

        
        // Static account ID'lerini test data'ya kaydet
        testData.accounts.static[0].id = accounts[0].account_id;
        testData.accounts.static[1].id = accounts[1].account_id;
        testData.accounts.static[2].id = accounts[2].account_id;
        
        return { accounts, media: [] };
        
    } catch (error) {
        console.error('❌ Test verisi hazırlanırken hata:', error.message);
        throw error;
    }
};

// Gelişmiş temizlik fonksiyonu - Hiç test verisi bırakmaz
const cleanup = async () => {
    
    try {

        
        // Test data setinden temizlenecek telefon numaralarını al
        const accountPhones = testData.accounts.static.map(acc => acc.phone_number);
        const allTestPhones = [...accountPhones, ...testData.testPhones];
        
        // 1. Test hesaplarına ait transaction'ları sil (phone number ile)
        if (allTestPhones.length > 0) {
            await new Promise((resolve) => {
                db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                    SELECT alias_no FROM media WHERE account_id IN (
                        SELECT account_id FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})
                    )
                )`, allTestPhones, (err) => {
                    if (err) console.log(`⚠️ Transaction temizlik hatası: ${err.message}`);
                    resolve();
                });
            });
        }
        
        // 2. Test hesaplarına ait media'ları sil (phone number ile)
        if (allTestPhones.length > 0) {
            await new Promise((resolve) => {
                db.run(`DELETE FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})
                )`, allTestPhones, (err) => {
                    if (err) console.log(`⚠️ Media temizlik hatası: ${err.message}`);
                    resolve();
                });
            });
        }
        
        // 3. Test hesaplarını sil (phone number ile)
        if (allTestPhones.length > 0) {
            await new Promise((resolve) => {
                db.run(`DELETE FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})`, 
                    allTestPhones, (err) => {
                    if (err) console.log(`⚠️ Account temizlik hatası: ${err.message}`);
                    resolve();
                });
            });
        }
        
        // 4. Phone number null olan test account'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE phone_number IS NULL`, [], (err) => {
                if (err) console.log(`⚠️ Null phone account temizlik hatası: ${err.message}`);
                resolve();
            });
        });
        
        // 5. Phone number null olan account'lara ait media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IN (
                SELECT account_id FROM account WHERE phone_number IS NULL
            )`, [], (err) => {
                if (err) console.log(`⚠️ Null phone media temizlik hatası: ${err.message}`);
                resolve();
            });
        });
        
        // 6. Phone number null olan account'lara ait transaction'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IS NULL
                )
            )`, [], (err) => {
                if (err) console.log(`⚠️ Null phone transaction temizlik hatası: ${err.message}`);
                resolve();
            });
        });
        
        // 7. Orphan media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IS NULL`, [], (err) => {
                if (err) console.log(`⚠️ Orphan media temizlik hatası: ${err.message}`);
                resolve();
            });
        });
        
        // 8. Orphan media'ların transaction'larını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IS NULL
            )`, [], (err) => {
                if (err) console.log(`⚠️ Orphan transaction temizlik hatası: ${err.message}`);
                resolve();
            });
        });
        

        
    } catch (error) {
        console.error('❌ Database temizlenirken hata:', error.message);
    }
};

// Test öncesi hazırlık
const beforeTests = async () => {
    await cleanup(); // Önceki testlerden kalıntıları temizle
    return await prepareTestData();
};

// Test sonrası temizlik
const afterTests = async () => {
    try {
        // Test sırasında oluşturulan transaction'ları temizle
        await dbHelper.clearTestTransactions();
        
        // Genel temizlik
        await cleanup();
    } catch (error) {
        console.error('❌ Test sonrası temizlik hatası:', error.message);
    }
};

// Her test sonrası reset fonksiyonu - Hesap ID'lerini sabit tutarak test verilerini ilk haline getir
const resetTestData = async () => {
    try {

        
        // Önce mevcut test hesaplarını kontrol et ve eksik olanları oluştur
        const accounts = [];
        
        // Static test hesaplarını kontrol et ve eksik olanları oluştur
        for (let i = 0; i < testData.accounts.static.length; i++) {
            const accountData = testData.accounts.static[i];
            
            // prepareTestData'da atanan ID'yi kullan
            const expectedId = accountData.id;
            
            let account = await dbHelper.findAccountByPhone(accountData.phone_number);
            
            if (!account) {
                // Hesap yoksa beklenen ID ile oluştur
                account = await dbHelper.createAccountWithId(expectedId, accountData.phone_number);
            } else {
                // Hesap varsa ama farklı ID'ye sahipse, media'ları doğru hesaba bağla
                if (account.account_id !== expectedId) {
                    // Önce eski hesaba ait media'ları yeni hesaba bağla
                    await dbHelper.updateMediaAccountId(account.account_id, expectedId);
                    // Sonra eski hesabı sil
                    await dbHelper.deleteAccount(account.account_id);
                    // Yeni hesabı oluştur
                    account = await dbHelper.createAccountWithId(expectedId, accountData.phone_number);
                }
            }
            
            // ID'yi test data'ya kaydet (değiştirme, zaten doğru)
            testData.accounts.static[i].id = expectedId;
            accounts.push(account);
        }
        
        // Static test media'larını kontrol et ve eksik olanları oluştur
        for (const mediaData of testData.media.static) {
            const accountIndex = mediaData.account_index;
            const accountId = accountIndex !== null ? accounts[accountIndex].account_id : null;
            
            // Mevcut media'yı kontrol et
            let media = await dbHelper.findMediaByAccount(accountId);
            if (!media) {
                media = await dbHelper.createMedia({
                    account_id: accountId,
                    balance: mediaData.balance,
                    status: mediaData.status,
                    expiery_date: mediaData.expiery_date
                });
            }
        }
        
        // Orphan media'ları kontrol et ve eksik olanları oluştur
        for (const mediaData of testData.media.orphan) {
            // Mevcut orphan media'yı kontrol et
            let media = await dbHelper.findOrphanMedia();
            if (!media || media.length === 0) {
                media = await dbHelper.createMedia({
                    account_id: null,
                    balance: mediaData.balance,
                    status: mediaData.status,
                    expiery_date: mediaData.expiery_date
                });
            }
        }
        

        

    } catch (error) {
        console.error('❌ Test verisi sıfırlanırken hata:', error.message);
    }
};

module.exports = {
    api,
    checkDatabase,
    prepareTestData,
    cleanup,
    beforeTests,
    afterTests,
    resetTestData,
    API_BASE_URL
};

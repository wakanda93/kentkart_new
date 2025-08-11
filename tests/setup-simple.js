const db = require('../database');
const chai = require('chai');
const chaiHttp = require('chai-http');

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
                console.error('Database kontrol hatası:', err);
                reject(err);
            } else {
                const result = row || {accounts: 0, medias: 0, transactions: 0};
                console.log('📊 Database durumu:', result);
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
        create: (data) => chai.request(API_BASE_URL)
            .post('/api/v1/media')
            .send(data),
        updateBalance: (aliasNo, balance) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/balance`)
            .send({ balance }),
        updateStatus: (aliasNo, status) => chai.request(API_BASE_URL)
            .put(`/api/v1/media/${aliasNo}/status`)
            .send({ status })
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

// Statik test verilerini database'e insert et
const prepareTestData = async () => {
    console.log('🔧 Test verisi oluşturuluyor...');
    
    try {
        // Statik test hesapları
        const testAccounts = [
            { phone_number: '05551234567' }, // Account 1
            { phone_number: '05559876543' }  // Account 2
        ];
        
        const createdAccounts = [];
        
        // Hesapları database'e insert et
        for (const accountData of testAccounts) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO account (phone_number) VALUES (?)',
                    [accountData.phone_number],
                    function(err) {
                        if (err) {
                            console.log(`⚠️ Hesap zaten var: ${accountData.phone_number}`);
                        } else {
                            const account = {
                                account_id: this.lastID,
                                phone_number: accountData.phone_number
                            };
                            createdAccounts.push(account);
                            console.log(`✅ Hesap oluşturuldu: ${accountData.phone_number} (ID: ${this.lastID})`);
                        }
                        resolve();
                    }
                );
            });
        }
        
        // Test media verileri - özel tanımlı (SECURITY FIX: Zero balance kaldırıldı)
        const testMediaData = [
            { account_index: 0, balance: 100.00, status: 'active' },    // Media1 -> Account1 (active, 100 TL)
            { account_index: 1, balance: 50.00, status: 'active' },     // Media2 -> Account2 (active, 50 TL) - FIXED: Zero balance removed
            { account_index: 1, balance: 100.00, status: 'blacklist' }, // Media3 -> Account2 (blacklist, 100 TL)
            { account_index: null, balance: 100.00, status: 'active' }  // Media4 -> Orphan (active, 100 TL)
        ];
        
        const createdMedia = [];
        for (const mediaData of testMediaData) {
            const account = mediaData.account_index !== null ? createdAccounts[mediaData.account_index] : null;
            const accountId = account ? account.account_id : null;
            
            await new Promise((resolve, reject) => {
                const createDate = new Date().toISOString().split('T')[0];
                const expiryDate = '2025-12-31';
                
                db.run(
                    'INSERT INTO media (account_id, create_date, expiery_date, balance, status) VALUES (?, ?, ?, ?, ?)',
                    [accountId, createDate, expiryDate, mediaData.balance, mediaData.status],
                    function(err) {
                        if (err) {
                            console.log(`⚠️ Media oluşturulamadı: ${err.message}`);
                        } else {
                            const media = {
                                alias_no: this.lastID,
                                account_id: accountId,
                                create_date: createDate,
                                expiery_date: expiryDate,
                                balance: mediaData.balance,
                                status: mediaData.status
                            };
                            createdMedia.push(media);
                            const accountInfo = accountId ? `Account: ${accountId}` : 'Orphan Media';
                            console.log(`✅ Media oluşturuldu: Alias ${this.lastID} (${accountInfo}, Balance: ${mediaData.balance}, Status: ${mediaData.status})`);
                        }
                        resolve();
                    }
                );
            });
        }
        
        console.log('✅ Test verisi hazırlandı');
        return {
            accounts: createdAccounts,
            media: createdMedia
        };
        
    } catch (error) {
        console.error('❌ Test verisi hazırlanırken hata:', error.message);
        throw error;
    }
};

// Basit temizlik fonksiyonu - Sadece tanımladığımız test verilerini temizle
const cleanup = async () => {
    console.log('🧹 Test verisi temizleniyor...');
    
    try {
        // SADECE STATIK TEST VERİLERİNİ TEMİZLE
        // 1. Setup'ta oluşturulan statik test telefon numaraları
        const staticTestPhones = [
            '05551234567', '05559876543'
        ];
        
        // 2. Test sırasında oluşturulan bilinen test telefon numaraları
        const knownTestPhones = [
            '05551111001', '05551111002', '05551111003', 
            '05551111005', '05551111006', '05551111007', '05551111008',
            '05551111010', '05551111011', '05551111012', '05551111013', '05551111014', 
            '05551111015', '05551111016', '05551111017', '05551111018', '05551111019',
            '05551111020', '05551111021',
            '05559999001', '05559999002', '05559999003',
            '05511111111', '05522222222', '05533333333'
        ];
        
        // Tüm temizlenecek telefon numaraları
        const allTestPhones = [...staticTestPhones, ...knownTestPhones];
        
        console.log('🗑️ Test transaction verilerini temizleniyor...');
        // 1. Test hesaplarına ait transaction'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})
                )
            )`, allTestPhones, (err) => {
                if (err) console.log(`⚠️ Transaction temizlik hatası: ${err.message}`);
                else console.log('✅ Test transactionları silindi');
                resolve();
            });
        });
        
        // 2. Permanent account'a bağlı test transaction'ları sil (bugün oluşturulanlar, permanent hariç)
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id = 1 
                AND create_date >= date('now')
                AND alias_no > 1
            )`, [], (err) => {
                if (err) console.log(`⚠️ Permanent account test transaction temizlik hatası: ${err.message}`);
                else console.log('✅ Permanent account test transactionları silindi');
                resolve();
            });
        });
        
        // 3. Setup'ta oluşturulan orphan media'ların transaction'larını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IS NULL 
                AND create_date >= date('now', '-1 day')
            )`, [], (err) => {
                if (err) console.log(`⚠️ Orphan transaction temizlik hatası: ${err.message}`);
                else console.log('✅ Test orphan transactionları silindi');
                resolve();
            });
        });
        
        console.log('🗑️ Test media verilerini temizleniyor...');
        // 3. Test hesaplarına ait media'ları sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IN (
                SELECT account_id FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})
            )`, allTestPhones, (err) => {
                if (err) console.log(`⚠️ Media temizlik hatası: ${err.message}`);
                else console.log('✅ Test medialari silindi');
                resolve();
            });
        });
        
        // 4. Permanent account'a bağlı test media'ları sil (bugün oluşturulanlar)
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id = 1 
                AND create_date >= date('now') 
                AND alias_no > 1`, [], (err) => {
                if (err) console.log(`⚠️ Permanent account test media temizlik hatası: ${err.message}`);
                else console.log('✅ Permanent account test medialari silindi');
                resolve();
            });
        });
        
        // 5. Setup'ta oluşturulan orphan media'ları sil (bugün oluşturulanlar)
        await new Promise((resolve) => {
            db.run(`DELETE FROM media WHERE account_id IS NULL 
                AND create_date >= date('now', '-1 day')`, [], (err) => {
                if (err) console.log(`⚠️ Orphan media temizlik hatası: ${err.message}`);
                else console.log('✅ Test orphan medialar silindi');
                resolve();
            });
        });
        
        console.log('🗑️ Test account verilerini temizleniyor...');
        // 5. Test hesaplarını sil
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE phone_number IN (${allTestPhones.map(() => '?').join(',')})`, 
                allTestPhones, (err) => {
                if (err) console.log(`⚠️ Account temizlik hatası: ${err.message}`);
                else console.log('✅ Test accountları silindi');
                resolve();
            });
        });
        
        // 6. Test sırasında oluşan geçici hesapları sil (pattern-based sadece test prefix'leri için)
        await new Promise((resolve) => {
            db.run(`DELETE FROM account WHERE 
                phone_number LIKE 'test-%' OR 
                phone_number LIKE 'temp-%' OR
                phone_number LIKE 'invalid-%'`, [], (err) => {
                if (err) console.log(`⚠️ Pattern temizlik hatası: ${err.message}`);
                else console.log('✅ Geçici test accountları silindi');
                resolve();
            });
        });
        
        console.log('✅ Sadece test verileri temizlendi, diğer veriler korundu');
    } catch (error) {
        console.error('❌ Temizlik sırasında hata:', error.message);
    }
};

// Test öncesi hazırlık
const beforeTests = async () => {
    console.log('🚀 Testler başlıyor...');
    await cleanup(); // Önceki testlerden kalıntıları temizle
    return await prepareTestData();
};

// Test sonrası temizlik
const afterTests = async () => {
    console.log('🏁 Testler bitti');
    await cleanup();
};

module.exports = {
    api,
    checkDatabase,
    prepareTestData,
    cleanup,
    beforeTests,
    afterTests,
    API_BASE_URL
};

const db = require('./database');

const clearTestData = () => {
    return new Promise((resolve, reject) => {
        
        db.serialize(() => {
            // Silme sırası: transactions -> media -> accounts (foreign key constraint)
            
            // 1. Önce test accounts'a ait transaction'ları sil
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IN (
                    SELECT account_id FROM account WHERE phone_number IN (?, ?, ?)
                )
            )`, 
                ["05551234567", "05559876543", "05551111111"], 
                function(err) {
                    if (err) console.warn('❌ Test transaction silme hatası:', err);
                }
            );

            // 2. Orphan media'nın transaction'larını sil
            db.run(`DELETE FROM [transaction] WHERE alias_no IN (
                SELECT alias_no FROM media WHERE account_id IS NULL AND expiery_date = ?
            )`, 
                ["2026-01-01"], 
                function(err) {
                    if (err) console.warn('❌ Test orphan transaction silme hatası:', err);
                }
            );

            // 3. Sonra media kayıtlarını sil
            db.run('DELETE FROM media WHERE account_id IN (SELECT account_id FROM account WHERE phone_number IN (?, ?, ?))', 
                ["05551234567", "05559876543", "05551111111"], 
                function(err) {
                    if (err) console.warn('❌ Test media silme hatası:', err);
                }
            );

            // 4. Orphan test media'yı sil (test'e özgü tarih ile)
            db.run('DELETE FROM media WHERE account_id IS NULL AND expiery_date = ?', 
                ["2026-01-01"], 
                function(err) {
                    if (err) console.warn('❌ Test orphan media silme hatası:', err);
                }
            );

            // 5. En son test hesaplarını sil
            db.run('DELETE FROM account WHERE phone_number IN (?, ?, ?)', 
                ["05551234567", "05559876543", "05551111111"], 
                function(err) {
                    if (err) {
                        console.warn('❌ Test hesap silme hatası:', err);
                        reject(err);
                    } else {
                        console.log('✅ Test verileri temizlendi');
                        resolve();
                    }
                }
            );
        });
    });
};

// Eğer doğrudan çalıştırılıyorsa (node clearTestData.js)
if (require.main === module) {
    clearTestData().then(() => {
        console.log('🔐 Test verisi temizleme tamamlandı.');
        process.exit(0);
    }).catch((err) => {
        console.error('❌ Test verisi temizleme hatası:', err);
        process.exit(1);
    });
}

module.exports = { clearTestData };

const sqlite3 = require('sqlite3').verbose();
const db = require('./database');

console.log('🗑️  Veritabanı temizleme işlemi başlatılıyor...');

db.serialize(() => {
  console.log('📋 Mevcut tablolar kontrol ediliyor...');
  
  // Önce mevcut tabloları listele
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('❌ Tablo listesi alınırken hata:', err.message);
      return;
    }
    
    console.log('📊 Bulunan tablolar:', tables.map(t => t.name).join(', '));
    
    // Transaction tablosunu temizle (foreign key nedeniyle önce bu)
    db.run('DELETE FROM [transaction]', function(err) {
      if (err) {
        console.error('❌ Transaction tablosu temizlenirken hata:', err.message);
      } else {
        console.log(`✅ Transaction tablosu temizlendi (${this.changes} kayıt silindi)`);
      }
      
      // Media tablosunu temizle
      db.run('DELETE FROM media', function(err) {
        if (err) {
          console.error('❌ Media tablosu temizlenirken hata:', err.message);
        } else {
          console.log(`✅ Media tablosu temizlendi (${this.changes} kayıt silindi)`);
        }
        
        // Account tablosunu temizle
        db.run('DELETE FROM account', function(err) {
          if (err) {
            console.error('❌ Account tablosu temizlenirken hata:', err.message);
          } else {
            console.log(`✅ Account tablosu temizlendi (${this.changes} kayıt silindi)`);
          }
          
          // AUTOINCREMENT counter'ları sıfırla
          console.log('🔄 AUTOINCREMENT sayaçları sıfırlanıyor...');
          
          db.run("DELETE FROM sqlite_sequence WHERE name='account'", function(err) {
            if (err && !err.message.includes('no such table')) {
              console.error('❌ Account sequence sıfırlanırken hata:', err.message);
            } else {
              console.log('✅ Account ID sayacı sıfırlandı');
            }
          });
          
          db.run("DELETE FROM sqlite_sequence WHERE name='media'", function(err) {
            if (err && !err.message.includes('no such table')) {
              console.error('❌ Media sequence sıfırlanırken hata:', err.message);
            } else {
              console.log('✅ Media ID sayacı sıfırlandı');
            }
          });
          
          // Temizlik sonrası doğrulama
          console.log('🔍 Temizlik sonrası doğrulama yapılıyor...');
          
          db.get('SELECT COUNT(*) as count FROM account', [], (err, row) => {
            if (!err) {
              console.log(`📊 Account tablosu: ${row.count} kayıt`);
            }
          });
          
          db.get('SELECT COUNT(*) as count FROM media', [], (err, row) => {
            if (!err) {
              console.log(`📊 Media tablosu: ${row.count} kayıt`);
            }
          });
          
          db.get('SELECT COUNT(*) as count FROM [transaction]', [], (err, row) => {
            if (!err) {
              console.log(`📊 Transaction tablosu: ${row.count} kayıt`);
            }
            
            console.log('✨ Veritabanı temizleme işlemi tamamlandı!');
            console.log('💡 Tablolar korundu, sadece veriler temizlendi.');
            console.log('🔢 ID sayaçları 1\'den başlayacak şekilde sıfırlandı.');
            console.log('🔐 İşlem tamamlandı.');
            process.exit(0);
          });
        });
      });
    });
  });
});

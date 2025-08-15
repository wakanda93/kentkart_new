const testData = require('./testData');

// Test data helper fonksiyonları - Sadece kullanılan static değerler
const getTestData = {
    // Static account phone number'ları için index-based erişim
    staticAccountPhone: (index) => testData.accounts.static[index].phone_number,
    
    // Static account ID'leri için index-based erişim
    staticAccountId: (index) => testData.accounts.static[index].id,
    
    // Static media data'ları için index-based erişim
    staticMediaData: (index) => testData.media.static[index],
    
        // Static test phone number'ları için index-based erişim
    staticTestPhone: (index) => testData.testPhones[index],
    
    // Media'sı olmayan account ID'si için erişim
    accountWithoutMediaId: () => testData.accounts.static[2].id,
};

module.exports = {
    getTestData
};

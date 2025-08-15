// Minimal Test Data - Sadece gerekli veriler
// Bu dosya sadece test için gerekli olan minimum veriyi içerir

const testData = {
  // Sadece gerekli test verileri
  accounts: {
    static: [
      { phone_number: "05551234567", id: null },
      { phone_number: "05559876543", id: null },
      { phone_number: "05551111003", id: null } // Media'sı olmayan account
    ],
    invalid: [
      { phone_number: "" },
      { phone_number: "123" }
    ]
  },

  media: {
    static: [
      { account_index: 0, balance: 100, status: "active", expiery_date: "2025-12-31" },
      { account_index: 1, balance: 50, status: "active", expiery_date: "2025-12-31" }
    ],
    orphan: [
      { account_index: null, balance: 75, status: "active", expiery_date: "2025-12-31" }
    ],
    blacklisted: [
      { account_index: 0, balance: 100, status: "blacklist", expiery_date: "2025-12-31" },
      { account_index: 1, balance: 50, status: "blacklist", expiery_date: "2025-12-31" }
    ]
  },

  transactions: {
    valid: [
      { alias_no: 1, amount: 50, operation: "recharge" },
      { alias_no: 1, amount: 25, operation: "usage" }
    ],
    invalid: [
      { amount: 0, operation: "recharge" },
      { amount: -50, operation: "recharge" },
      { amount: 50, operation: "invalid_operation" }
    ]
  },

  // Sadece gerçekten gerekli olan test telefonları
  testPhones: ["05551111001", "05551111002"],

  // Basit reset
  reset: (db) => {
    return new Promise((resolve) => {
      const accountPhones = testData.accounts.static.map(acc => acc.phone_number);
      const allPhones = [...accountPhones, ...testData.testPhones];
      
      db.run(`DELETE FROM account WHERE phone_number IN (${allPhones.map(() => '?').join(',')})`, 
             allPhones, () => resolve());
    });
  }
};

module.exports = testData;

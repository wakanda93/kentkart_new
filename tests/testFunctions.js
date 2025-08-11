// Test Kontrol Fonksiyonları
// Mocha testlerinde kullanılacak yardımcı fonksiyonlar

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
chai.use(chaiHttp);

const API_BASE_URL = 'http://localhost:3001/api/v1';

/**
 * 1. HTTP STATUS CODE KONTROLLERI
 */
const statusCodeChecks = {
  
  checkStatusCode(response, expectedStatus) {
    expect(response).to.have.status(expectedStatus);
  },

  checkSuccessStatus(response) {
    expect(response.status).to.be.within(200, 299);
  },

  checkErrorStatus(response) {
    expect(response.status).to.be.within(400, 599);
  },

  // Kısa adlar - API testleri için
  is200(response) {
    expect(response).to.have.status(200);
  },

  is201(response) {
    expect(response).to.have.status(201);
  },

  is400(response) {
    expect(response).to.have.status(400);
  },

  is404(response) {
    expect(response).to.have.status(404);
  },

  is409(response) {
    expect(response).to.have.status(409);
  },

  is500(response) {
    expect(response).to.have.status(500);
  }
};

/**
 * 2. FIELD EXISTENCE KONTROLLERI
 */
const fieldExistenceChecks = {

    //Objenin belirtilen field'a sahip olduğunu kontrol eder
  hasField(obj, fieldName) {
    expect(obj).to.have.property(fieldName);
  },


   //Account objesinin gerekli field'larını kontrol eder

  accountFields(account) {
    const requiredFields = ['account_id', 'phone_number'];
    requiredFields.forEach(fieldName => {
      this.hasField(account, fieldName);
    });
  },


   //Media objesinin gerekli field'larını kontrol eder

  mediaFields(media) {
    const requiredFields = ['alias_no', 'create_date', 'expiery_date', 'balance', 'status'];
    requiredFields.forEach(fieldName => {
      this.hasField(media, fieldName);
    });
  },

   //Transaction objesinin gerekli field'larını kontrol eder

  transactionFields(transaction) {
    const requiredFields = ['alias_no', 'amount', 'date', 'operation'];
    requiredFields.forEach(fieldName => {
      this.hasField(transaction, fieldName);
    });
  }
};

/**
 * 3. DATA TYPE KONTROLLERI
 */
const dataTypeChecks = {

   //Field'ın string tipinde olduğunu kontrol eder
  checkStringType(obj, fieldName) {
    expect(obj[fieldName]).to.be.a('string');
  },

   //Field'ın number tipinde olduğunu kontrol eder  
  checkNumberType(obj, fieldName) {
    expect(obj[fieldName]).to.be.a('number');
  },


   //Field'ın boolean tipinde olduğunu kontrol eder
  checkBooleanType(obj, fieldName) {
    expect(obj[fieldName]).to.be.a('boolean');
  },


   //Field'ın array tipinde olduğunu kontrol eder
  checkArrayType(obj, fieldName) {
    expect(obj[fieldName]).to.be.an('array');
  },

   //Field'ın object tipinde olduğunu kontrol eder
  checkObjectType(obj, fieldName) {
    expect(obj[fieldName]).to.be.an('object');
  },

  //Account objesinin field tiplerini kontrol eder
  checkAccountTypes(account) {
    this.checkNumberType(account, 'account_id');
    this.checkStringType(account, 'phone_number');
  },

  //Media objesinin field tiplerini kontrol eder
   checkMediaTypes(media) {
     this.checkNumberType(media, 'alias_no');
     this.checkStringType(media, 'create_date');
     this.checkStringType(media, 'expiery_date');
     this.checkNumberType(media, 'balance');
    this.checkStringType(media, 'status');
  },

  //Transaction objesinin field tiplerini kontrol eder
  checkTransactionTypes(transaction) {
    this.checkNumberType(transaction, 'alias_no');
    this.checkNumberType(transaction, 'amount');
    this.checkStringType(transaction, 'date');
    this.checkStringType(transaction, 'operation');
  },

  //Telefon numarası formatını kontrol eder
   checkPhoneNumberFormat(phoneNumber) {
     expect(phoneNumber).to.be.a('string');
     expect(phoneNumber).to.match(/^05\d{9}$/);
   },

  //Tarih formatını kontrol eder (YYYY-MM-DD veya YYYY-MM-DD HH:MM:SS)
  checkDateFormat(dateString) {
    expect(dateString).to.be.a('string');
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
    expect(dateString).to.match(dateTimeRegex);
  },

  //Media status'unun geçerli değerlerde olduğunu kontrol eder
  checkMediaStatus(status) {
    expect(status).to.be.a('string');
    expect(status).to.be.oneOf(['active', 'blacklist']);
  },

  //Operation field'ının geçerli değerlerde olduğunu kontrol eder
  checkOperationType(operation) {
    expect(operation).to.be.a('string');
    expect(operation).to.be.oneOf(['recharge', 'usage']);
  },

  //Değerin array tipinde olduğunu kontrol eder
  isArray(value) {
    expect(value).to.be.an('array');
  },

  //Değerin object tipinde olduğunu kontrol eder
  checkIsObject(value) {
    expect(value).to.be.an('object');
  },

  //Değerin string tipinde olduğunu kontrol eder
  checkIsString(value) {
    expect(value).to.be.a('string');
  },

  //Değerin number tipinde olduğunu kontrol eder
  checkIsNumber(value) {
    expect(value).to.be.a('number');
  },

  //Pozitif sayı kontrolü
  isPositiveNumber(value) {
    expect(value).to.be.a('number');
    expect(value).to.be.above(0);
  }
};

/**
 * 4. DATA EQUALITY KONTROLLERI
 */
const dataEqualityChecks = {
  //İki değerin eşit olduğunu kontrol eder
  isEqual(actual, expected) {
    expect(actual).to.equal(expected);
  },

  //İki değerin derin eşitliğini kontrol eder (objeler için)
  isDeepEqual(actual, expected) {
    expect(actual).to.deep.equal(expected);
  },

  //Sayının belirtilen aralıkta olduğunu kontrol eder
  inRange(value, min, max) {
    expect(value).to.be.within(min, max);
  },

  //String'in belirtilen uzunlukta olduğunu kontrol eder
  hasLength(str, length) {
    expect(str).to.have.lengthOf(length);
  },

  //Array'in belirtilen uzunlukta olduğunu kontrol eder
  arrayLength(arr, length) {
    expect(arr).to.have.lengthOf(length);
  },

  //Balance'ın pozitif olduğunu kontrol eder
  positiveBalance(balance) {
    expect(balance).to.be.at.least(0);
  },

  //Amount'ın pozitif olduğunu kontrol eder
  positiveAmount(amount) {
    expect(amount).to.be.above(0);
  },

  //Transaction objesinin field tiplerini kontrol eder
  checkTransactionTypes(transaction) {
    this.checkNumberType(transaction, 'alias_no');
    this.checkNumberType(transaction, 'amount');
    this.checkStringType(transaction, 'date');
    this.checkStringType(transaction, 'operation');
  },

  //Transaction balance hesaplamasını kontrol eder
  balanceCalculation(oldBalance, newBalance, amount, operation) {
    if (operation === 'recharge') {
      expect(newBalance).to.equal(oldBalance + amount);
    } else if (operation === 'usage') {
      expect(newBalance).to.equal(oldBalance - amount);
    }
  }
};

/**
 * 5. DATA EXISTENCE KONTROLLERI
 */
const dataExistenceChecks = {
  
    //Response body'nin boş olmadığını kontrol eder
  checkResponseNotEmpty(response) {
    expect(response.body).to.not.be.empty;
  },

  //Array'in boş olmadığını kontrol eder
  isArrayNotEmpty(arr) {
    expect(arr).to.not.be.empty;
  },

  //String'in boş olmadığını kontrol eder
  checkStringNotEmpty(str) {
    expect(str).to.not.be.empty;
  },

  //Değerin truthy olduğunu kontrol eder
  checkTruthy(value) {
    expect(value).to.be.ok;
  },

  //Değerin falsy olduğunu kontrol eder
  checkFalsy(value) {
    expect(value).to.not.be.ok;
  },

  //Array'de belirtilen değerin bulunduğunu kontrol eder
  checkArrayContains(arr, value) {
    expect(arr).to.include(value);
  },

  //String'de belirtilen substring'in bulunduğunu kontrol eder
  checkStringContains(str, substring) {
    expect(str).to.include(substring);
  },

  //Array'de belirtilen değerin bulunduğunu kontrol eder
  arrayContains(arr, value) {
    expect(arr).to.include(value);
  }
};

/**
 * 6. RELATIONAL DATA KONTROLLERI
 */
const relationalDataChecks = {
  
  //Account ve Media arasındaki ilişkiyi kontrol eder
  checkAccountMediaRelation(account, media) {
    if (media.account_id !== null) {
      expect(media.account_id).to.equal(account.account_id);
    }
  },

  //Media ve Transaction arasındaki ilişkiyi kontrol eder
  checkMediaTransactionRelation(media, transaction) {
    expect(transaction.alias_no).to.equal(media.alias_no);
  },

  //Transaction'ların media'ya ait olduğunu kontrol eder
  checkTransactionsBelongToMedia(transactions, aliasNo) {
    transactions.forEach(transaction => {
      expect(transaction.alias_no).to.equal(aliasNo);
    });
  },

  //Account silindikten sonra media'nın orphan olduğunu kontrol eder
  checkOrphanMedia(media) {
    expect(media.account_id).to.be.null;
  },

  //Foreign key constraint'ini kontrol eder
  checkForeignKeyConstraint(response) {
    statusCodeChecks.checkErrorStatus(response);
    expect(response.body.error).to.include('not found');
  },

  //Cascade delete davranışını kontrol eder
  checkCascadeSetNull(mediaList, deletedAccountId) {
    const orphanedMedia = mediaList.filter(media => 
      media.account_id === null
    );
    expect(orphanedMedia).to.not.be.empty;
  },

  //Balance güncellemesinin doğru yapıldığını kontrol eder
  checkBalanceUpdate(transactionResponse, mediaResponse) {
    const { oldBalance, newBalance } = transactionResponse.body;
    expect(mediaResponse.body.balance).to.equal(newBalance);
  }
};

/**
 * 7. KOMPLE VALIDATION FONKSIYONLARI
 */
const completeValidations = {

  //Account response'unu tamamen validate eder
  validateAccountResponse(response) {
    statusCodeChecks.is201(response);
    fieldExistenceChecks.accountFields(response.body);
    dataTypeChecks.checkAccountTypes(response.body);
    dataTypeChecks.checkPhoneNumberFormat(response.body.phone_number);
    dataExistenceChecks.checkResponseNotEmpty(response);
  },

  //Media response'unu tamamen validate eder
  validateMediaResponse(response) {
    statusCodeChecks.is201(response);
    fieldExistenceChecks.mediaFields(response.body);
    dataTypeChecks.checkMediaTypes(response.body);
    dataTypeChecks.checkDateFormat(response.body.create_date);
    dataTypeChecks.checkDateFormat(response.body.expiery_date);
    dataTypeChecks.checkMediaStatus(response.body.status);
    dataEqualityChecks.positiveBalance(response.body.balance);
    dataExistenceChecks.checkResponseNotEmpty(response);
  },

  //Transaction response'unu tamamen validate eder
  validateTransactionResponse(response) {
    statusCodeChecks.is201(response);
    fieldExistenceChecks.transactionFields(response.body.transaction);
    dataTypeChecks.checkTransactionTypes(response.body.transaction);
    dataTypeChecks.checkDateFormat(response.body.transaction.date);
    dataTypeChecks.checkOperationType(response.body.transaction.operation);
    dataEqualityChecks.positiveAmount(response.body.transaction.amount);
    dataExistenceChecks.checkResponseNotEmpty(response);
  },

  //Error response'unu tamamen validate eder
  validateErrorResponse(response, expectedStatus) {
    statusCodeChecks.checkStatusCode(response, expectedStatus);
    fieldExistenceChecks.hasField(response.body, 'error');
    dataTypeChecks.checkStringType(response.body, 'error');
    dataExistenceChecks.checkStringNotEmpty(response.body.error);
  },

  //Recharge response'unu tamamen validate eder
  validateRechargeResponse(response) {
    statusCodeChecks.is201(response);
    fieldExistenceChecks.transactionFields(response.body.transaction);
    dataTypeChecks.checkTransactionTypes(response.body.transaction);
    dataEqualityChecks.isEqual(response.body.transaction.operation, 'recharge');
    dataExistenceChecks.checkResponseNotEmpty(response);
  },

  //Usage response'unu tamamen validate eder
  validateUsageResponse(response) {
    statusCodeChecks.is201(response);
    fieldExistenceChecks.transactionFields(response.body.transaction);
    dataTypeChecks.checkTransactionTypes(response.body.transaction);
    dataEqualityChecks.isEqual(response.body.transaction.operation, 'usage');
    dataExistenceChecks.checkResponseNotEmpty(response);
  }
};

/**
 * 8. BASIT VALIDATION FONKSIYONLARI
 * Tek fonksiyon çağrısı ile kapsamlı kontroller
 */
const simpleValidations = {
  //Account objesinin tamamen valid olduğunu kontrol eder
  isAccountValid(account) {
    fieldExistenceChecks.accountFields(account);
    dataTypeChecks.checkAccountTypes(account);
    dataTypeChecks.checkPhoneNumberFormat(account.phone_number);
    console.log('✅ Account validation geçti');
  },

  //Media objesinin tamamen valid olduğunu kontrol eder
  isMediaValid(media) {
    fieldExistenceChecks.mediaFields(media);
    dataTypeChecks.checkMediaTypes(media);
    dataTypeChecks.checkMediaStatus(media.status);
    dataEqualityChecks.positiveBalance(media.balance);
    console.log('✅ Media validation geçti');
  },

  //Transaction objesinin tamamen valid olduğunu kontrol eder
  isTransactionValid(transaction) {
    fieldExistenceChecks.transactionFields(transaction);
    dataTypeChecks.checkTransactionTypes(transaction);
    dataTypeChecks.checkOperationType(transaction.operation);
    dataEqualityChecks.positiveAmount(transaction.amount);
    console.log('✅ Transaction validation geçti');
  },

  //Test data setup'ının tamamen valid olduğunu kontrol eder
  isTestDataValid(testData) {
    // Type kontrolü
    dataTypeChecks.isArray(testData.accounts);
    dataTypeChecks.isArray(testData.media);
    dataTypeChecks.checkIsObject(testData.OrphanMedia);
    
    // Length kontrolü
    dataEqualityChecks.arrayLength(testData.accounts, 3);
    dataEqualityChecks.arrayLength(testData.media, 4);
    
    // Boş değil kontrolü
    dataExistenceChecks.isArrayNotEmpty(testData.accounts);
    dataExistenceChecks.isArrayNotEmpty(testData.media);
    
    // Her account'un valid olduğunu kontrol et
    testData.accounts.forEach((account, index) => {
      try {
        this.isAccountValid(account);
      } catch (error) {
        throw new Error(`Account ${index + 1} validation failed: ${error.message}`);
      }
    });
    
    // Her media'nın valid olduğunu kontrol et
    testData.media.forEach((media, index) => {
      try {
        this.isMediaValid(media);
      } catch (error) {
        throw new Error(`Media ${index + 1} validation failed: ${error.message}`);
      }
    });
    
    // Orphan media kontrolü
    try {
      this.isMediaValid(testData.OrphanMedia);
      relationalDataChecks.checkOrphanMedia(testData.OrphanMedia);
    } catch (error) {
      throw new Error(`Orphan media validation failed: ${error.message}`);
    }
    
    console.log('✅ Test data tamamen valid');
  },

  //HTTP response'unun başarılı olduğunu kontrol eder
  isResponseSuccessful(response) {
    statusCodeChecks.checkSuccessStatus(response);
    dataExistenceChecks.checkResponseNotEmpty(response);
    console.log('✅ Response başarılı');
  },

  //HTTP response'unun hata olduğunu kontrol eder
  isResponseError(response) {
    statusCodeChecks.checkErrorStatus(response);
    fieldExistenceChecks.hasField(response.body, 'error');
    dataExistenceChecks.checkStringNotEmpty(response.body.error);
    console.log('✅ Error response doğru');
  },

  //Account ve Media ilişkisinin doğru olduğunu kontrol eder
  isAccountMediaRelationValid(account, media) {
    this.isAccountValid(account);
    this.isMediaValid(media);
    relationalDataChecks.checkAccountMediaRelation(account, media);
    console.log('✅ Account-Media ilişkisi doğru');
  }
};

module.exports = {
  statusCodeChecks,
  fieldExistenceChecks,
  dataTypeChecks,
  dataEqualityChecks,
  dataExistenceChecks,
  relationalDataChecks,
  completeValidations,
  simpleValidations,
  API_BASE_URL
};

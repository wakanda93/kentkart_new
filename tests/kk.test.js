const chai = require('chai');
const chaiHttp = require('chai-http');
const addContext = require('mochawesome/addContext');
// Docker API için URL
const API_BASE_URL = 'http://localhost:3000';
const {
  statusCodeChecks,
  fieldExistenceChecks,
  dataTypeChecks,
  dataEqualityChecks,
  dataExistenceChecks,
  relationalDataChecks,
} = require('./testFunctions');
const { api, beforeTests, afterTests, resetTestData, cleanup } = require('./setup-simple');
const testData = require('./testData');
const { getTestData } = require('./testHelpers');
const dbHelper = require('./dbHelper');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Kentkart API Tests', () => {
    
    before(async () => {
        try {
            await beforeTests();
        } catch (error) {
            console.error('❌ Test setup hatası:', error);
            throw error;
        }
    });

    after(async () => {
        try {
            await cleanup(); // Tüm test verilerini temizle
        } catch (error) {
            console.error('❌ Test cleanup hatası:', error);
        }
    });

    afterEach(async () => {
        try {
            await resetTestData();
        } catch (error) {
            console.error('❌ Test reset hatası:', error);
        }
    });

    // Account API Tests
    describe('Account API Tests', () => {
        describe('GET /api/v1/accounts - Get All Accounts', () => {
            it('should get all accounts successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get All Accounts
                          Scenario: Successful retrieval of all accounts
                            Given the API is running
                            When I send a GET request to /api/v1/accounts
                            Then the response status code should be 200
                            And the response body should be an array
                            And the array should not be empty
                        `
                });
                const res = await api.accounts.getAll();
                statusCodeChecks.is200(res);
                dataExistenceChecks.isArrayNotEmpty(res.body);
                
                // İlk elemanın varlığını kontrol et
                dataExistenceChecks.isArrayNotEmpty(res.body);
                fieldExistenceChecks.accountFields(res.body[0]);
            });
        });

        describe('GET /api/v1/accounts/:id - Get Account by ID', () => {
            it('should get account by valid ID', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Account Retrieval by ID
                          Scenario: Successful retrieval of an account by ID
                            Given the API is running
                            When I send a GET request to /api/v1/accounts/:id with a account ID
                            And the account ID is valid
                            Then the response status code should be 200
                            And the response body should contain the account details
                            And the account ID and phone number should match the request
                            `
                })
                // Mevcut account'lardan birini al
                const allAccounts = await dbHelper.getAllAccounts();
                const testAccount = allAccounts.find(acc => acc.phone_number === getTestData.staticAccountPhone(0));
                dataExistenceChecks.checkTruthy(testAccount);
                
                const res = await api.accounts.getById(testAccount.account_id);
                statusCodeChecks.is200(res);
                
                // Response body structure kontrolü
                dataTypeChecks.checkIsObject(res.body);
                
                // Field existence kontrolü
                fieldExistenceChecks.hasField(res.body, 'account_id');
                fieldExistenceChecks.hasField(res.body, 'phone_number');
                
                // Data equality kontrolü
                dataEqualityChecks.isEqual(res.body.account_id, testAccount.account_id);
                dataEqualityChecks.isEqual(res.body.phone_number, getTestData.staticAccountPhone(0));
                
                // Data type kontrolü
                dataTypeChecks.checkAccountTypes(res.body);
                dataTypeChecks.checkPhoneNumberFormat(res.body.phone_number);
            });


        });

        describe('GET /api/v1/accounts/:id - Worst Cases', () => {
            it('should return 404 for invalid account ID format (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Account Retrieval Error Handling
                          Scenario: User requests an account by an invalid ID format
                            Given the API is running
                            When I send a GET request to /api/v1/accounts/:id with an account ID
                            And the account ID is invalid
                            Then the response status code should be 404
                            And the response body should contain an error message
                            `
                });
                const res = await api.accounts.getById('invalid');
                statusCodeChecks.is404(res);
            });

            it('should return 404 for negative account ID (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Account Retrieval Error Handling
                        Scenario: User requests an account by a negative ID
                            Given the API is running
                            When I send a GET request to /api/v1/accounts/:id with an account ID
                            And the account ID is negative
                            Then the response status code should be 404
                            And the response body should contain an error message
                    `
                });
                const res = await api.accounts.getById('-1');
                statusCodeChecks.is404(res);
            });
        });

        describe('POST /api/v1/accounts - Create Account ', () => {
            it('should create new account with valid phone number', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create a new account
                          Scenario: Successful creation of a new account
                            Given the API is running
                            When I send a POST request to /api/v1/accounts with phone number
                            And the phone number is valid
                            Then the response status code should be 201
                            And the response body should contain the account ID
                            And the account ID and phone number should match the request`
                });
                // JSON dosyasından test telefon numarası al
                const newPhone = testData.testPhones[0];
                const res = await api.accounts.create(newPhone);
                
                statusCodeChecks.is201(res);
                fieldExistenceChecks.hasField(res.body, 'account_id');
                dataEqualityChecks.isEqual(res.body.phone_number, newPhone);
                dataTypeChecks.checkIsNumber(res.body.account_id);
            });
        });

        describe('PUT /api/v1/accounts/:id - Update Account', () => {
            it('should update account with valid data', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update an existing account
                          Scenario: Successful update of an existing account
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with updated phone number
                            And the updated phone number is valid
                            Then the response status code should be 200
                            And the response body should contain the account ID
                            And the account ID and updated phone number should match the request
                            And the account ID should be a number
                    `
                });
                
                // Mevcut account'lardan birini al
                const allAccounts = await dbHelper.getAllAccounts();
                const testAccount = allAccounts.find(acc => acc.phone_number === getTestData.staticAccountPhone(0));
                dataExistenceChecks.checkTruthy(testAccount);
                
                const newPhoneNumber = testData.testPhones[1];
                
                // API ile güncelle
                const res = await api.accounts.update(testAccount.account_id, newPhoneNumber);
                
                // Temel kontroller
                statusCodeChecks.is200(res);
                dataEqualityChecks.isEqual(res.body.account_id, testAccount.account_id);
                dataEqualityChecks.isEqual(res.body.phone_number, newPhoneNumber);
                
                // Database doğrulama
                const updatedAccount = await dbHelper.findAccountById(testAccount.account_id);
                dataEqualityChecks.isEqual(updatedAccount.phone_number, newPhoneNumber);
            });
        });

        describe('PUT /api/v1/accounts/:id - Worst Cases', () => {
            it('should return 404 for non-existent account', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Non-Existent Account
                          Scenario: User attempts to update a non-existent account
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with a non-existent account ID
                            Then the response status code should be 404
                    `
                });
                
                const res = await api.accounts.update(99999, testData.testPhones[0]);
                statusCodeChecks.is404(res);
            });

            it('should reject empty phone number', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Account with Empty Phone Number
                          Scenario: User attempts to update an account with an empty phone number
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with an empty phone number
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut account'lardan birini al
                const allAccounts = await dbHelper.getAllAccounts();
                const testAccount = allAccounts.find(acc => acc.phone_number === getTestData.staticAccountPhone(0));
                dataExistenceChecks.checkTruthy(testAccount);
                
                const res = await api.accounts.update(testAccount.account_id, "");
                
                statusCodeChecks.is400(res);
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });

            it('should reject missing phone number field', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Account with Missing Phone Number Field
                          Scenario: User attempts to update an account without the phone number field
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id without phone number field
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut account'lardan birini al
                const allAccounts = await dbHelper.getAllAccounts();
                const testAccount = allAccounts.find(acc => acc.phone_number === getTestData.staticAccountPhone(0));
                dataExistenceChecks.checkTruthy(testAccount);
                
                const res = await api.accounts.update(testAccount.account_id, "");
                
                statusCodeChecks.is400(res);
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });
        });

        describe('DELETE /api/v1/accounts/:id - Delete Account', () => {
            it('should delete account successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Delete Account
                          Scenario: User deletes an account
                            Given the API is running
                            When I send a DELETE request to /api/v1/accounts/:id
                            Then the response status code should be 200
                            And the response body should contain a success message
                    `
                });
                
                // Helper fonksiyonları kullanarak test verisi oluştur
                const testPhoneNumber = getTestData.staticAccountPhone(0);
                
                // Mevcut hesabı bul
                const testAccount = await dbHelper.findAccountByPhone(testPhoneNumber);
                dataExistenceChecks.checkTruthy(testAccount, 'Test account should exist');
                
                // Hesabın var olduğunu doğrula
                dataExistenceChecks.checkTruthy(testAccount);
                dataExistenceChecks.checkTruthy(testAccount.account_id);
                
                // Sadece delete işlemi için API call yap
                const res = await api.accounts.delete(testAccount.account_id);
                
                // Response kontrolleri
                statusCodeChecks.is200(res);
                dataEqualityChecks.isEqual(res.body.message, 'Account deleted successfully. Associated media account_id set to NULL.');
                
                // Hesabın gerçekten silindiğini doğrula
                const deletedAccount = await dbHelper.findAccountById(testAccount.account_id);
                dataExistenceChecks.checkFalsy(deletedAccount);
            });
        });

        describe('DELETE /api/v1/accounts/:id - Worst Cases', () => {
            it('should return 404 for non-existent account', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Delete Non-Existent Account
                          Scenario: Delete non-existent account returns 404
                            Given the API is running
                            When I send a DELETE request to /api/v1/accounts/:id with non-existent ID
                            Then the response status code should be 404
                    `
                });
                
                const res = await api.accounts.delete(99999);
                
                statusCodeChecks.is404(res);
                dataEqualityChecks.isEqual(res.body.error, 'Account not found');
            });
        });

        describe('POST /api/v1/accounts - Create Account (Worst Cases)', () => {

            it('should reject empty phone number (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Account with Empty Phone Number
                          Scenario: User attempts to create an account with an empty phone number
                            Given the API is running
                            When I send a POST request to /api/v1/accounts with a phone number
                            And the phone number is empty
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the phone number is required
                    `
                });
                const res = await api.accounts.create("");
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });

            it('should reject missing phone number field', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Account with Missing Phone Number Field
                          Scenario: User attempts to create an account without the phone number field
                            Given the API is running
                            When I send a POST request to /api/v1/accounts without phone number field
                            Then the response status code should be 400
                    `
                });
                
                const res = await api.accounts.create({});
                
                statusCodeChecks.is400(res);
                dataEqualityChecks.isEqual(res.body.error, 'Invalid phone number format. It must start with 0 and be 11 digits.');
            });


            it('should reject duplicate phone number with 409', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Duplicate Account
                          Scenario: User attempts to create an account with a duplicate phone number
                            Given the API is running
                            When I send a POST request to /api/v1/accounts with an existing phone number
                            Then the response status code should be 409
                    `
                });
                
                // Önce bir account oluştur
                const existingPhone = testData.testPhones[0];
                await api.accounts.create(existingPhone);
                
                // Aynı numarayla tekrar oluşturmaya çalış
                const res = await api.accounts.create(existingPhone);
                
                statusCodeChecks.is409(res);
                dataEqualityChecks.isEqual(res.body.error, 'Account with this phone number already exists');
            });
        });
    });

    // Media API Tests  
    describe('Media API Tests', () => {
        describe('GET /api/v1/media - Get All Media', () => {
            it('should get all media successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get All Media
                          Scenario: Successful retrieval of all media records
                            Given the API is running
                            When I send a GET request to /api/v1/media
                            Then the response status code should be 200
                    `
                });
                const res = await api.media.getAll();
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataExistenceChecks.isArrayNotEmpty(res.body);
            });
        });

        describe('GET /api/v1/media/:aliasNo - Get Media by Alias', () => {
            it('should get media by valid alias number', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Media by Alias Number
                          Scenario: Successful retrieval of media by alias number
                            Given the API is running
                            When I send a GET request to /api/v1/media/:aliasNo with a valid alias number
                            Then the response status code should be 200
                    `
                });                 
                // Mevcut media'ları dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.getByAlias(testMedia.alias_no);
                statusCodeChecks.is200(res);
                dataEqualityChecks.isEqual(res.body.alias_no, testMedia.alias_no);
                dataEqualityChecks.isEqual(res.body.balance, testMedia.balance);


            });
        });

        describe('GET /api/v1/media/:aliasNo - Worst Cases', () => {
            it('should return 404 for invalid alias format (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Media by Invalid Alias Number
                          Scenario: User requests media by an invalid alias number format
                            Given the API is running
                            When I send a GET request to /api/v1/media/:aliasNo with an invalid alias number
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the media not found
                    `
                });
                const res = await api.media.getByAlias('invalid');
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataEqualityChecks.isEqual(res.body.error, 'Media not found');
            });
        });

        describe('GET /api/v1/media/account/:accountId - Get Media by Account', () => {
            it('should get media by valid account ID', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Media by Account ID
                          Scenario: Successful retrieval of media by account ID
                            Given the API is running
                            When I send a GET request to /api/v1/media/account/:accountId with an account ID
                            Then the response status code should be 200
                    `
                });

                // DELETE Account testinin sildiği hesap yerine başka bir hesap kullan
                const testAccount = await dbHelper.findAccountByPhone(getTestData.staticAccountPhone(1));
                dataExistenceChecks.checkTruthy(testAccount, 'Test account should exist');
                
                // Hesaba ait media var mı kontrol et
                const accountMedia = await dbHelper.getMediaByAccount(testAccount.account_id);
                dataExistenceChecks.isArrayNotEmpty(accountMedia, 'Account should have media');
                
                const res = await api.media.getByAccount(testAccount.account_id);
                console.log(res.body);
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataExistenceChecks.isArrayNotEmpty(res.body);
                dataEqualityChecks.isEqual(res.body[0].account_id, testAccount.account_id);
                
                
               
            });
        });

        describe('GET /api/v1/media/account/:accountId - Worst Cases', () => {
            it('should return empty array for account with no media', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Media by Account ID with No Media
                          Scenario: User requests media for an account with no associated media
                            Given the API is running
                            When I send a GET request to /api/v1/media/account/:accountId with an account ID
                            Then the response status code should be 200
                    `
                });
                
                // Media'sı olmayan account bul
                const allAccounts = await dbHelper.getAllAccounts();
                const allMedia = await dbHelper.getAllMedia();
                const accountWithoutMedia = allAccounts.find(acc => {
                    // Bu account'a ait media var mı kontrol et
                    const accountMedia = allMedia.filter(media => media.account_id === acc.account_id);
                    return accountMedia.length === 0;
                });
                dataExistenceChecks.checkTruthy(accountWithoutMedia);
                
                const res = await api.media.getByAccount(accountWithoutMedia.account_id);
                
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataEqualityChecks.arrayLength(res.body, 0);
            });
        });

        describe('GET /api/v1/media/orphan - Get Orphan Media', () => {
            it('should get orphan media successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Orphan Media
                          Scenario: Successful retrieval of orphan media records
                            Given the API is running
                            When I send a GET request to /api/v1/media/orphan
                            Then the response status code should be 200
                    `
                });
                
                // Önce orphan media oluştur
                await dbHelper.createMedia({
                    account_id: null,
                    balance: testData.media.static[0].balance,
                    status: testData.media.static[0].status,
                    expiery_date: testData.media.static[0].expiery_date
                });
                
                const res = await api.media.getOrphan();
                
                statusCodeChecks.is200(res);
                expect(res.body.data).to.be.an('array');
                expect(res.body.data.length).to.be.greaterThan(0);
                expect(res.body.data[0]).to.have.property('alias_no');
                expect(res.body.data[0].account_id).to.be.null;
            });
        });

        describe('POST /api/v1/media - Create Media ', () => {
            it('should create new media with valid data', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create New Media
                          Scenario: Successful creation of new media record
                            Given the API is running
                            When I send a POST request to /api/v1/media with valid data
                            Then the response status code should be 201
                    `
                });
                
                // DELETE Account testinin sildiği hesap yerine başka bir hesap kullan
                const testAccount = await dbHelper.findAccountByPhone(getTestData.staticAccountPhone(1));
                dataExistenceChecks.checkTruthy(testAccount, 'Test account should exist');
                

                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: testData.media.static[0].expiery_date,
                    balance: testData.media.static[0].balance,
                    status: testData.media.static[0].status
                });
                
                statusCodeChecks.is201(res);
                expect(res.body).to.have.property('alias_no');
                expect(res.body.account_id).to.equal(testAccount.account_id);
                expect(res.body.balance).to.equal(testData.media.static[0].balance);
                expect(res.body.status).to.equal(testData.media.static[0].status);
            });

            it('should create orphan media with null account_id', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Orphan Media
                          Scenario: Successful creation of orphan media record with null account_id
                            Given the API is running
                            When I send a POST request to /api/v1/media with null account_id
                            Then the response status code should be 201
                    `
                });
                
                const res = await api.media.create({
                    account_id: null,
                    expiery_date: testData.media.static[1].expiery_date,
                    balance: testData.media.static[1].balance,
                    status: testData.media.static[1].status
                });
                
                statusCodeChecks.is201(res);
                expect(res.body).to.have.property('alias_no');
                expect(res.body.account_id).to.be.null;
                expect(res.body.balance).to.equal(testData.media.static[1].balance);
                expect(res.body.status).to.equal(testData.media.static[1].status);
                
                // Response'da account_id'nin null olduğunu kontrol et
                expect(res.body.account_id).to.be.null;
            });


        });

        describe('POST /api/v1/media - Create Media (Worst Cases)', () => {

            it('should reject media with missing required fields (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Missing Required Fields
                          Scenario: User attempts to create media without required fields
                            Given the API is running
                            When I send a POST request to /api/v1/media with missing required fields
                            Then the response status code should be 400
                    `
                });
                
                const res = await api.media.create({
                    balance: 100
                });
                
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');

            });

            it('should REJECT negative balance (SECURITY FIX APPLIED)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Negative Balance
                          Scenario: User attempts to create media with a negative balance
                            Given the API is running
                            When I send a POST request to /api/v1/media with a negative balance
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut account'ı dbHelper ile al
                const existingAccounts = await dbHelper.getAllAccounts();
                const testAccount = existingAccounts[0];
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: testData.media.static[0].expiery_date,
                    balance: -50,
                    status: testData.media.static[0].status
                });
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Balance cannot be negative');
            });

            it('should REJECT zero balance (BUSINESS LOGIC FIX APPLIED)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Zero Balance
                          Scenario: User attempts to create media with a zero balance
                            Given the API is running
                            When I send a POST request to /api/v1/media with a zero balance
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut account'ı dbHelper ile al
                const existingAccounts = await dbHelper.getAllAccounts();
                const testAccount = existingAccounts[0];
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: testData.media.static[0].expiery_date,
                    balance: 0,
                    status: testData.media.static[0].status
                });
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Balance must be greater than 0');
            });

            it('should reject media with invalid status (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Invalid Status
                          Scenario: User attempts to create media with an invalid status
                            Given the API is running
                            When I send a POST request to /api/v1/media with an invalid status
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut account'ı dbHelper ile al
                const existingAccounts = await dbHelper.getAllAccounts();
                const testAccount = existingAccounts[0];
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: testData.media.static[0].expiery_date,
                    balance: testData.media.static[0].balance,
                    status: "invalid_status"
                });
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Invalid status. Must be one of: active, blacklist');
            });

            it('should reject media with non-existent account ID with 404 (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Non-Existent Account ID
                          Scenario: User attempts to create media with a non-existent account ID
                            Given the API is running
                            When I send a POST request to /api/v1/media with a non-existent account ID
                            Then the response status code should be 404
                    `
                });
                
                const res = await api.media.create({
                    account_id: 99999,
                    expiery_date: testData.media.static[0].expiery_date,
                    balance: testData.media.static[0].balance,
                    status: testData.media.static[0].status
                });
                
                statusCodeChecks.is404(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Account not found');
            });
        });

        describe('PUT /api/v1/media/:aliasNo/balance - Update Media Balance', () => {
            it('should update media balance with valid data', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Balance
                          Scenario: Successful update of media balance
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/balance with a valid alias number and new balance
                            Then the response status code should be 200
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const newBalance = 250;
                const res = await api.media.updateBalance(testMedia.alias_no, newBalance);
                
                statusCodeChecks.is200(res);
                expect(res.body).to.have.property('alias_no');
                expect(res.body.balance).to.equal(newBalance);
                expect(res.body.alias_no).to.equal(testMedia.alias_no);
            });
        });

        describe('PUT /api/v1/media/:aliasNo/balance - Update Balance (Worst Cases)', () => {
            it('should return 404 for non-existent media alias (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Balance with Non-Existent Alias
                          Scenario: User attempts to update balance for a non-existent media alias
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/balance with a non-existent alias number
                            Then the response status code should be 404
                    `
                });
                
                const res = await api.media.updateBalance(99999, 150);
                
                statusCodeChecks.is404(res);
                expect(res.body).to.have.property('error');
                dataEqualityChecks.isEqual(res.body.error, 'Media not found');
            });

            it('should reject missing balance field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Balance with Missing Balance Field
                          Scenario: User attempts to update balance without providing the balance field
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/balance without the balance field
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.updateBalanceWithEmptyBody(testMedia.alias_no);
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Balance is required');
            });

            it('should REJECT negative balance update', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Balance with Negative Value
                          Scenario: User attempts to update media balance with a negative value
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/balance with a negative balance
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.updateBalance(testMedia.alias_no, -50);
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Balance cannot be negative');
            });
        });

        describe('PUT /api/v1/media/:aliasNo/status - Update Media Status', () => {
            it('should update media status to blacklist', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status to Blacklist
                          Scenario: Successful update of media status to blacklist
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and new status
                            Then the response status code should be 200
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const newStatus = "blacklist";
                const res = await api.media.updateStatus(testMedia.alias_no, newStatus);
                
                statusCodeChecks.is200(res);
                expect(res.body).to.have.property('alias_no');
                expect(res.body.status).to.equal(newStatus);
                expect(res.body.alias_no).to.equal(testMedia.alias_no);
            });

            it('should update media status to active', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status to Active
                          Scenario: Successful update of media status to active
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and new status
                            Then the response status code should be 200
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[1]; // İkinci media'yı kullan
                
                const newStatus = "active";
                const res = await api.media.updateStatus(testMedia.alias_no, newStatus);
                
                statusCodeChecks.is200(res);
                expect(res.body.status).to.equal(newStatus);
                expect(res.body.alias_no).to.equal(testMedia.alias_no);
            });
        });

        describe('PUT /api/v1/media/:aliasNo/status - Update Status (Worst Cases)', () => {
            it('should return 404 for non-existent media alias (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Non-Existent Alias
                          Scenario: User attempts to update status for a non-existent media alias
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a non-existent alias number
                            Then the response status code should be 404
                    `
                });
                
                const res = await api.media.updateStatus(99999, "active");
                
                statusCodeChecks.is404(res);
                dataEqualityChecks.isEqual(res.body.error, "Media not found");
            });

            it('should reject invalid status value (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Invalid Value
                          Scenario: User attempts to update media status with an invalid value
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and an invalid status
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.updateStatus(testMedia.alias_no, "invalid_status");
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Invalid status. Must be one of: active, blacklist');
            });

            it('should reject empty status field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Empty Field
                          Scenario: User attempts to update media status with an empty status
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and an empty status
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.updateStatus(testMedia.alias_no, "");
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Status is required');
            });

            it('should reject missing status field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Missing Field
                          Scenario: User attempts to update media status without providing the status field
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and without the status field
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.media.updateStatusWithEmptyBody(testMedia.alias_no);
                
                statusCodeChecks.is400(res);
                expect(res.body).to.have.property('error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Status is required');
            });
        });
    });

    // Transaction API Tests
    describe('Transaction API Tests', () => {
        describe('GET /api/v1/transactions - Get All Transactions', () => {
            it('should get all transactions successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get All Transactions
                          Scenario: Successful retrieval of all transactions
                            Given the API is running
                            When I send a GET request to /api/v1/transactions
                            Then the response status code should be 200
                    `
                });
                
                // Önce bir transaction oluştur
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia.find(media => media.status === 'active') || existingMedia[0];
                
                await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.valid[0].amount,
                    operation: testData.transactions.valid[0].operation
                });
                
                const res = await api.transactions.getAll();
                
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataExistenceChecks.isArrayNotEmpty(res.body);
                fieldExistenceChecks.transactionFields(res.body[0]);
            });
        });

        describe('POST /api/v1/transactions - Create Transaction ', () => {
            it('should create recharge transaction successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Recharge Transaction
                          Scenario: Successful creation of a recharge transaction
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with valid recharge data
                            Then the response status code should be 201
                    `
                });
                
                // Active status'teki media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia.find(media => media.status === 'active') || existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.valid[0].amount,
                    operation: testData.transactions.valid[0].operation
                });
                
                statusCodeChecks.is201(res);
                expect(res.body.transaction.alias_no).to.equal(testMedia.alias_no);
                expect(res.body.transaction.amount).to.equal(testData.transactions.valid[0].amount);
                expect(res.body.transaction.operation).to.equal(testData.transactions.valid[0].operation);
            });

            it('should create usage transaction successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Usage Transaction
                          Scenario: Successful creation of a usage transaction
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with valid usage data
                            Then the response status code should be 201
                    `
                });
                
                // Active status'teki media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia.find(media => media.status === 'active') || existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.valid[1].amount,
                    operation: testData.transactions.valid[1].operation
                });
                
                statusCodeChecks.is201(res);
                expect(res.body.transaction.operation).to.equal(testData.transactions.valid[1].operation);
                expect(res.body.transaction.alias_no).to.equal(testMedia.alias_no);
                expect(res.body.transaction.amount).to.equal(testData.transactions.valid[1].amount);
            });
        });

        describe('POST /api/v1/transactions - Create Transaction (Worst Cases)', () => {

            it('should reject transaction with missing alias_no (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Missing Alias No
                          Scenario: User attempts to create a transaction without providing alias_no
                            Given the API is running
                            When I send a POST request to /api/v1/transactions without alias_no
                            And the amount is a positive number
                            And the operation is "recharge"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that alias_no is required
                    `
                });
                const res = await api.transactions.create({
                    amount: testData.transactions.valid[0].amount,
                    operation: testData.transactions.valid[0].operation
                });
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataExistenceChecks.checkStringContains(res.body.error, 'alias_no, amount, and operation are required');
            });

            it('should reject transaction with missing amount', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Missing Amount
                          Scenario: User attempts to create a transaction without providing amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions without amount
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    operation: testData.transactions.valid[0].operation
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'alias_no, amount, and operation are required');
            });

            it('should reject transaction with missing operation', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Missing Operation
                          Scenario: User attempts to create a transaction without providing operation
                            Given the API is running
                            When I send a POST request to /api/v1/transactions without operation
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.valid[0].amount
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'alias_no, amount, and operation are required');
            });

            it('should reject transaction with invalid operation type', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Invalid Operation Type
                          Scenario: User attempts to create a transaction with an invalid operation type
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with an invalid operation type
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.invalid[2].amount,
                    operation: testData.transactions.invalid[2].operation
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'Operation must be either "recharge" or "usage"');
            });

            it('should reject transaction with zero amount', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Zero Amount
                          Scenario: User attempts to create a transaction with zero amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with zero amount
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.invalid[0].amount,
                    operation: testData.transactions.invalid[0].operation
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'Amount must be greater than 0');
            });

            it('should reject transaction with negative amount', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Negative Amount
                          Scenario: User attempts to create a transaction with a negative amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a negative amount
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.invalid[1].amount,
                    operation: testData.transactions.invalid[1].operation
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'Amount must be greater than 0');
            });

            it('should reject transaction with non-existent alias_no (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Non-Existent Alias No
                          Scenario: User attempts to create a transaction with a non-existent alias_no
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a non-existent alias_no
                            And the amount is valid
                            And the operation is "recharge"
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the media not found
                    `
                });
                const res = await api.transactions.create({
                    alias_no: 99999,
                    amount: testData.transactions.valid[0].amount,
                    operation: testData.transactions.valid[0].operation
                });
                // API 404 Not Found dönüyor
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Media not found');
            });

            it('should reject transaction on blacklisted media (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Reject Transaction on Blacklisted Media
                          Scenario: User attempts to create a transaction on a blacklisted media
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a blacklisted media alias_no
                            Then the response status code should be 400
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                // Media status'ünü blacklist yap
                await dbHelper.updateMediaStatus(testMedia.alias_no, 'blacklist');
                
                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: testData.transactions.valid[0].amount,
                    operation: testData.transactions.valid[0].operation
                });
                
                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'Transaction not allowed - media is blacklisted');
            });



            it('should reject usage transaction with insufficient balance', async function () {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Reject Usage Transaction with Insufficient Balance
                            Scenario: User attempts to create a usage transaction with insufficient balance
                                Given the API is running
                                When I send a POST request to /api/v1/transactions with insufficient balance
                                Then the response status code should be 400
                    `
                });

                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[1]; // Farklı media kullan
                
                // Media balance'ını 10'a düşür ve status'ü active yap
                await dbHelper.updateMediaBalance(testMedia.alias_no, 10);
                await dbHelper.updateMediaStatus(testMedia.alias_no, 'active');
                
                // Media'nın güncellendiğini doğrula
                const updatedMedia = await dbHelper.findMediaByAlias(testMedia.alias_no);
                expect(updatedMedia.balance).to.equal(10);
                expect(updatedMedia.status).to.equal('active');

                const res = await api.transactions.create({
                    alias_no: testMedia.alias_no,
                    amount: 1000, // Bakiye 10, miktar 1000 
                    operation: "usage"
                });

                statusCodeChecks.is400(res);
                dataExistenceChecks.checkStringContains(res.body.error, 'Insufficient balance');
            });
        });

        describe('GET /api/v1/transactions/media/:aliasNo - Get Transactions by Alias', () => {
            it('should get transactions by valid alias number', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Transactions by Alias Number
                          Scenario: Successful retrieval of transactions by alias number
                            Given the API is running
                            When I send a GET request to /api/v1/transactions/media/:aliasNo with a valid alias number
                            Then the response status code should be 200
                    `
                });
                
                // Mevcut media'yı dbHelper ile al
                const existingMedia = await dbHelper.getAllMedia();
                const testMedia = existingMedia[0];
                
                const res = await api.transactions.getByAlias(testMedia.alias_no);
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
            });
        });

        describe('GET /api/v1/transactions/media/:aliasNo - Worst Cases', () => {
            it('should return 404 for non-existent media alias (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Transactions by Non-Existent Alias Number
                          Scenario: User attempts to get transactions by a non-existent alias number
                            Given the API is running
                            When I send a GET request to /api/v1/transactions/media/:aliasNo with a non-existent alias number
                            Then the response status code should be 404
                            And the response body should contain an error message indicating media not found
                    `
                });
                const res = await api.transactions.getByAlias(99999);
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataExistenceChecks.checkStringContains(res.body.error, 'Media not found');
            });


        });
    });
});

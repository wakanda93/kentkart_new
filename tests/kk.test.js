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
const { api, beforeTests, afterTests } = require('./setup-simple');

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
            await afterTests();
        } catch (error) {
            console.error('❌ Test cleanup hatası:', error);
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
                expect(res.body.length).to.be.at.least(1);
                fieldExistenceChecks.hasField(res.body[0], 'account_id');
                fieldExistenceChecks.hasField(res.body[0], 'phone_number');
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
                const accounts = await api.accounts.getAll();
                // Test data'sını dinamik olarak bul (setup'ta oluşturulan telefon numarası)
                const testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount) {
                    // Fallback: herhangi bir account'u kullan
                    expect(accounts.body.length).to.be.at.least(1);
                    const firstAccount = accounts.body[0];
                    const res = await api.accounts.getById(firstAccount.account_id);
                    statusCodeChecks.is200(res);
                    fieldExistenceChecks.hasField(res.body, 'account_id');
                    dataEqualityChecks.isEqual(res.body.account_id, firstAccount.account_id);
                    dataEqualityChecks.isEqual(res.body.phone_number, firstAccount.phone_number);
                    return;
                }
                
                const accountId = testAccount.account_id;
                const res = await api.accounts.getById(accountId);
                statusCodeChecks.is200(res);
                fieldExistenceChecks.hasField(res.body, 'account_id');
                dataEqualityChecks.isEqual(res.body.account_id, accountId);
                dataEqualityChecks.isEqual(res.body.phone_number, testAccount.phone_number);
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
                const newPhone = "05551111005"; // Setup'ta olmayan yeni numara
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
                // Test için özel account oluştur
                const originalPhone = "05551111020";
                const createRes = await api.accounts.create(originalPhone);
                const testAccount = createRes.body;
                
                const newPhone = "05551111021";
                
                const res = await api.accounts.update(testAccount.account_id, newPhone);
                statusCodeChecks.is200(res);
                fieldExistenceChecks.hasField(res.body, 'account_id');
                dataEqualityChecks.isEqual(res.body.phone_number, newPhone);
                dataEqualityChecks.isEqual(res.body.account_id, testAccount.account_id);
                dataTypeChecks.checkIsNumber(res.body.account_id);
            });
        });

        describe('PUT /api/v1/accounts/:id - Worst Cases', () => {
            it('should return 404 for non-existent account (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Non-Existent Account
                          Scenario: User attempts to update a non-existent account
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with a account ID
                            And the account ID does not exist
                            Then the response status code should be 404
                            And the response body should contain an error message`
                });
                const res = await api.accounts.update(99999, "05551234567");
                statusCodeChecks.is404(res);
            });

            it('should reject empty phone number (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Account with Empty Phone Number
                          Scenario: User attempts to update an account with an empty phone number
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with a phone number
                            And the phone number is empty
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the phone number is required
                    `
                });
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await api.accounts.update(testAccount.account_id, "");
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });

            it('should reject missing phone number field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Account with Missing Phone Number Field
                          Scenario: User attempts to update an account without the phone number field
                            Given the API is running
                            When I send a PUT request to /api/v1/accounts/:id with a phone number
                            And the phone number field is missing
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the phone number is required
                            `
                });
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await chai.request(API_BASE_URL)
                    .put(`/api/v1/accounts/${testAccount.account_id}`)
                    .send({});
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });
        });

        describe('DELETE /api/v1/accounts/:id - Delete Account', () => {
            it('should delete account and orphan associated media', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Delete Account
                          Scenario: User deletes an account and its associated media
                            Given the API is running
                            When I send a DELETE request to /api/v1/accounts/:id
                            Then the response status code should be 200
                            And the response body should contain a message
                            And the message should indicate that the account and its media have been deleted
                            And the associated media account_id should be set to NULL
                            And the orphaned media should be returned in the orphaned media list
                            And the orphaned media should have account_id set to NULL
                    `
                });
                // Test için yeni account oluştur
                const newPhone = "05551111007";
                const createRes = await api.accounts.create(newPhone);
                const accountId = createRes.body.account_id;
                
                // Account'a media ekle
                const mediaRes = await api.media.create({
                    account_id: accountId,
                    expiery_date: "2025-12-31",
                    balance: 150,
                    status: "active"
                });
                const mediaAlias = mediaRes.body.alias_no;
                
                // Delete işlemi
                const res = await api.accounts.delete(accountId);
                statusCodeChecks.is200(res);
                fieldExistenceChecks.hasField(res.body, 'message');
                expect(res.body.message).to.include('Associated media account_id set to NULL');
                
                // Account'un silindiğini doğrula
                const getRes = await api.accounts.getById(accountId);
                statusCodeChecks.is404(getRes);
                
                // Media'nın orphan olduğunu doğrula (account_id = null)
                const orphanMediaRes = await chai.request(API_BASE_URL).get('/api/v1/media/orphan');
                statusCodeChecks.is200(orphanMediaRes);
                const orphanMedia = orphanMediaRes.body.data || orphanMediaRes.body;
                const orphanedMedia = orphanMedia.find(m => m.alias_no === mediaAlias);
                expect(orphanedMedia).to.exist;
                expect(orphanedMedia.account_id).to.be.null;
                expect(orphanedMedia.alias_no).to.equal(mediaAlias);
            });
        });

        describe('DELETE /api/v1/accounts/:id - Worst Cases', () => {
            it('should return 404 for non-existent account (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Delete Non-Existent Account
                          Scenario: User attempts to delete a non-existent account
                            Given the API is running
                            When I send a DELETE request to /api/v1/accounts/:id with an account ID
                            And the account ID does not exist
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the account not found
                    `
                });
                const res = await api.accounts.delete(99999);
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
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

            it('should reject missing phone number field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Account with Missing Phone Number Field
                          Scenario: User attempts to create an account without the phone number field
                            Given the API is running
                            When I send a POST request to /api/v1/accounts with a phone number
                            And the phone number field is missing
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the phone number is required
                    `
                });
                const res = await chai.request(API_BASE_URL)
                    .post('/api/v1/accounts')
                    .send({});  // Hiç phone_number field'ı gönderme
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                dataEqualityChecks.isEqual(res.body.error, 'Phone number is required');
            });


            it('should reject duplicate phone number with 409 (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Duplicate Account
                          Scenario: User attempts to create an account with a duplicate phone number
                            Given the API is running
                            When I send a POST request to /api/v1/accounts with a phone number
                            And the phone number already exists
                            Then the response status code should be 409
                            And the response body should contain an error message
                            And the error message should indicate that the account with this phone number already exists
                    `
                });
                // Önce bir account oluştur
                const existingPhone = "05551234567"; // Sabit test numarası
                await api.accounts.create(existingPhone);
                
                // Aynı numarayla tekrar oluşturmaya çalış
                const res = await api.accounts.create(existingPhone);
            
                // API 409 Conflict dönüyor
                statusCodeChecks.is409(res);
                fieldExistenceChecks.hasField(res.body, 'error');
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
                            And the response body should be an array
                            And the array should not be empty
                            And each media record should have alias_no and balance fields
                    `
                });
                const res = await api.media.getAll();
                statusCodeChecks.is200(res);
                dataExistenceChecks.isArrayNotEmpty(res.body);
                fieldExistenceChecks.hasField(res.body[0], 'alias_no');
                fieldExistenceChecks.hasField(res.body[0], 'balance');
                dataTypeChecks.checkIsNumber(res.body[0].balance);
                dataEqualityChecks.isEqual(res.body[0].alias_no, res.body[0].alias_no);
                dataEqualityChecks.isEqual(res.body[0].balance, res.body[0].balance);
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
                            And the response body should contain the media record
                            And the alias_no and balance should match the request
                            And the response body should have alias_no and balance fields
                            And the balance should be a number
                    `
                });
                const media = await api.media.getAll();
                const aliasNo = media.body[0].alias_no;
                const res = await api.media.getByAlias(aliasNo);
                statusCodeChecks.is200(res);
                dataEqualityChecks.isEqual(res.body.alias_no, aliasNo);
                dataEqualityChecks.isEqual(res.body.balance, media.body[0].balance);
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                fieldExistenceChecks.hasField(res.body, 'balance');
                dataTypeChecks.checkIsNumber(res.body.balance);
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
                            And the account ID is valid
                            Then the response status code should be 200
                            And the response body should be an array
                            And the array should not be empty
                            And each media record should have alias_no and balance fields
                            And the balance should be a number
                            And the account_id in media should match the requested account ID
                    `
                });
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul (setup'ta oluşturulan ilk account)
                let testAccount = accounts.body.find(acc => acc.phone_number === '05551234567');
                if (!testAccount && accounts.body.length > 0) {
                    // Fallback: permanent account'u kullan
                    testAccount = accounts.body[0];
                }
                expect(testAccount).to.exist;
                
                const res = await api.media.getByAccount(testAccount.account_id);

                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                if (res.body.length > 0) {
                    fieldExistenceChecks.hasField(res.body[0], 'alias_no');
                    fieldExistenceChecks.hasField(res.body[0], 'balance');
                    dataTypeChecks.checkIsNumber(res.body[0].balance);
                    dataEqualityChecks.isEqual(res.body[0].account_id, testAccount.account_id);
                    expect(res.body.length).to.be.at.least(1);
                }
            });
        });

        describe('GET /api/v1/media/account/:accountId - Worst Cases', () => {
            it('should return empty array for account with no media (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Media by Account ID with No Media
                          Scenario: User requests media for an account with no associated media
                            Given the API is running
                            When I send a GET request to /api/v1/media/account/:accountId with an account ID
                            And the account ID has no associated media
                            Then the response status code should be 200
                            And the response body should be an empty array
                            And the account_id in media should match the requested account ID
                    `
                });
                // Yeni account oluştur
                const newPhone = "05551111008"; // Yeni numara
                const accountRes = await api.accounts.create(newPhone);
                
                const res = await api.media.getByAccount(accountRes.body.account_id);
                
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataEqualityChecks.isEqual(res.body.length, 0);

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
                            And the response body should be an array
                            And the array should not be empty
                            And each orphan media record should have alias_no and account_id fields
                            And the account_id should be null
                    `
                });
                const res = await chai.request(API_BASE_URL).get('/api/v1/media/orphan');
                // Orphan media endpoint'i için 200 dönmeli
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body.data || res.body);
                // Orphan media listesi boş olmamalı
                dataExistenceChecks.isArrayNotEmpty(res.body);
                if (res.body.length > 0) {
                    // Relational data check - orphan media kontrolü
                    relationalDataChecks.checkOrphanMedia(res.body[0]);
                }
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
                            And the account_id is valid
                            And the expiery_date is in the future
                            And the balance is a positive number
                            And the status is valid
                            Then the response status code should be 201
                            And the response body should contain the alias_no
                            And the response body should contain the account_id
                            And the response body should contain the balance
                            And the response body should contain the status
                            And the account_id should match the requested account ID
                            And the balance should be a positive number
                            And the status should be one of the valid statuses
                    `
                });
                // Test için özel account oluştur
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 150,
                    status: "active"
                });
                statusCodeChecks.is201(res);
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                dataEqualityChecks.isEqual(res.body.account_id, testAccount.account_id);
                // Balance ve status field'larını kontrol et
                fieldExistenceChecks.hasField(res.body, 'balance');
                fieldExistenceChecks.hasField(res.body, 'status');
                dataTypeChecks.checkIsNumber(res.body.balance);
                // Balance'ın pozitif olduğunu kontrol et
                dataEqualityChecks.isEqual(res.body.balance, 150);
                // Balance pozitif olduğunu kontrol et
                dataTypeChecks.isPositiveNumber(res.body.balance);
                dataEqualityChecks.isEqual(res.body.status, "active");
            });

            it('should create orphan media with null account_id', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Orphan Media
                          Scenario: Successful creation of orphan media record with null account_id
                            Given the API is running
                            When I send a POST request to /api/v1/media with null account_id
                            And the expiery_date is in the future
                            And the balance is a positive number
                            And the status is valid
                            Then the response status code should be 201
                            And the response body should contain the alias_no
                            And the response body should have account_id set to null
                            And the response body should contain the balance
                            And the response body should contain the status
                            And the account_id should be null
                            And the balance should be a positive number
                            And the status should be one of the valid statuses
                            And the orphan media should be returned in the orphaned media list
                            And the orphaned media should have account_id set to null
                    `
                });
                // Orphan media oluşturmak için account_id'yi null olarak ayarla
                const res = await api.media.create({
                    account_id: null,  // Explicitly set to null
                    expiery_date: "2026-12-31",
                    balance: 200,
                    status: "active"
                });
                
                statusCodeChecks.is201(res);
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                expect(res.body.account_id).to.be.null;  // Must be null, not undefined
                dataEqualityChecks.isEqual(res.body.balance, 200);
                dataEqualityChecks.isEqual(res.body.status, "active");
                fieldExistenceChecks.hasField(res.body, 'balance');
                fieldExistenceChecks.hasField(res.body, 'status');
                dataTypeChecks.checkIsNumber(res.body.balance);
                // Balance'ın pozitif olduğunu kontrol et
                dataTypeChecks.isPositiveNumber(res.body.balance);

                
                // Orphan media listesinde görünüyor mu kontrol et
                const orphanRes = await chai.request(API_BASE_URL).get('/api/v1/media/orphan');
                statusCodeChecks.is200(orphanRes);
                const orphanMedia = orphanRes.body.data || orphanRes.body;
                const createdOrphan = orphanMedia.find(m => m.alias_no === res.body.alias_no);
                expect(createdOrphan).to.exist;
                expect(createdOrphan.account_id).to.be.null;
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
                            And the response body should contain an error message
                            And the error message should indicate that required fields are missing
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
                            And the account_id is valid
                            And the expiery_date is in the future
                            And the status is valid
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that balance cannot be negative
                    `
                });
                // Test için özel account oluştur
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: -50,
                    status: "active"
                    });
                
                // ✅ FIXED: API artık negative balance'ı reddediyor!
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');

                expect(res.body.error).to.include('Balance cannot be negative');
            });

            it('should REJECT zero balance (BUSINESS LOGIC FIX APPLIED)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Zero Balance
                          Scenario: User attempts to create media with a zero balance
                            Given the API is running
                            When I send a POST request to /api/v1/media with a zero balance
                            And the account_id is valid
                            And the expiery_date is in the future
                            And the status is valid
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that balance must be greater than 0
                    `
                });
                // Test için özel account oluştur
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 0,
                    status: "active"
                });
                
                // ✅ FIXED: API artık zero balance'ı reddediyor!
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Balance must be greater than 0');
            });

            it('should reject media with invalid status (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Invalid Status
                          Scenario: User attempts to create media with an invalid status
                            Given the API is running
                            When I send a POST request to /api/v1/media with an invalid status
                            And the account_id is valid
                            And the expiery_date is in the future
                            And the balance is a positive number
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the status is invalid
                    `
                });
                // Test için özel account oluştur
                const accounts = await api.accounts.getAll();
                // Test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const res = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "invalid_status"
                    });
                
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Invalid status. Must be one of: active, blacklist');
            });

            it('should reject media with non-existent account ID with 404 (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Media with Non-Existent Account ID
                          Scenario: User attempts to create media with a non-existent account ID
                            Given the API is running
                            When I send a POST request to /api/v1/media with a non-existent account ID
                            And the expiery_date is in the future
                            And the balance is a positive number
                            And the status is valid
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the account not found
                    `
                });
                // Non-existent account_id ile media oluşturmayı dene
                const res = await api.media.create({
                    account_id: 99999,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                    });
                // API 404 Not Found dönüyor
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Account not found');
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
                            And the alias number exists
                            And the new balance is a positive number
                            Then the response status code should be 200
                            And the response body should contain the alias_no
                            And the response body should contain the updated balance
                            And the response body should have alias_no and balance fields
                            And the balance should be a positive number
                            And the alias_no should match the requested alias number
                    `
                });
                // Test için media oluştur
                const accounts = await api.accounts.getAll();
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const mediaRes = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                
                const newBalance = 250;
                const res = await api.media.updateBalance(mediaRes.body.alias_no, newBalance);
                
                statusCodeChecks.is200(res);
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                dataEqualityChecks.isEqual(res.body.balance, newBalance);
                dataEqualityChecks.isEqual(res.body.alias_no, mediaRes.body.alias_no);
                fieldExistenceChecks.hasField(res.body, 'balance');
                dataTypeChecks.checkIsNumber(res.body.balance);
                // Balance'ın pozitif olduğunu kontrol et
                dataTypeChecks.isPositiveNumber(res.body.balance);
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
                            And the new balance is a positive number
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the media not found
                    `
                });
                const res = await api.media.updateBalance(99999, 150);
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
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
                            And the alias number exists
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the balance field is required
                    `
                });
                // Media alias_no ile balance güncelleme isteği gönder
                const media = await api.media.getAll();
                expect(media.body.length).to.be.at.least(1);
                
                const res = await chai.request(API_BASE_URL)
                    .put(`/api/v1/media/${media.body[0].alias_no}/balance`)
                    .send({});
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Balance is required');
            });

            it('should REJECT negative balance update', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Balance with Negative Value
                          Scenario: User attempts to update media balance with a negative value
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/balance with a negative balance
                            And the alias number exists
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that balance cannot be negative
                    `
                });
                // Test için media oluştur
                const accounts = await api.accounts.getAll();
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const mediaRes = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                
                const res = await api.media.updateBalance(mediaRes.body.alias_no, -50);
                
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Balance cannot be negative');
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
                            And the alias number exists
                            And the new status is "blacklist"
                            Then the response status code should be 200
                            And the response body should contain the alias_no
                            And the response body should contain the updated status
                            And the response body should have alias_no and status fields
                            And the status should be "blacklist"
                            And the alias_no should match the requested alias number
                    `
                });

                // Test için media oluştur
                const accounts = await api.accounts.getAll();
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const mediaRes = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                
                const newStatus = "blacklist";
                const res = await api.media.updateStatus(mediaRes.body.alias_no, newStatus);
                
                statusCodeChecks.is200(res);
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                dataEqualityChecks.isEqual(res.body.status, newStatus);
                dataEqualityChecks.isEqual(res.body.alias_no, mediaRes.body.alias_no);
                fieldExistenceChecks.hasField(res.body, 'status');
                dataTypeChecks.checkIsString(res.body.status);
                // Status'ın blacklist olduğunu kontrol et
                dataEqualityChecks.isEqual(res.body.status, "blacklist");
            });

            it('should update media status to active', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status to Active
                          Scenario: Successful update of media status to active
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and new status
                            And the alias number exists
                            And the new status is "active"
                            Then the response status code should be 200
                            And the response body should contain the alias_no
                            And the response body should contain the updated status
                            And the response body should have alias_no and status fields
                            And the status should be "active"
                            And the alias_no should match the requested alias number
                    `
                });

                // Test için blacklist media oluştur
                const accounts = await api.accounts.getAll();
                let testAccount = accounts.body.find(acc => 
                    acc.phone_number === '05551234567' || acc.phone_number === '05559876543'
                );
                if (!testAccount && accounts.body.length > 0) {
                    testAccount = accounts.body[0]; // Fallback
                }
                expect(testAccount).to.exist;
                
                const mediaRes = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "blacklist"
                });
                
                const newStatus = "active";
                const res = await api.media.updateStatus(mediaRes.body.alias_no, newStatus);
                
                statusCodeChecks.is200(res);
                dataEqualityChecks.isEqual(res.body.status, newStatus);
                dataEqualityChecks.isEqual(res.body.alias_no, mediaRes.body.alias_no);
                fieldExistenceChecks.hasField(res.body, 'status');
                fieldExistenceChecks.hasField(res.body, 'alias_no');
                dataTypeChecks.checkIsString(res.body.status);
                // Status'ın active olduğunu kontrol et
                dataEqualityChecks.isEqual(res.body.status, "active");
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
                            And the new status is "active"
                            Then the response status code should be 404
                            And the response body should contain an error message
                            And the error message should indicate that the media not found
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
                            And the alias number exists
                            And the new status is not one of the valid statuses
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the status is invalid
                    `
                });
                // Media alias_no ile status güncelleme isteği gönder
                const media = await api.media.getAll();
                expect(media.body.length).to.be.at.least(1);
                
                const res = await api.media.updateStatus(media.body[0].alias_no, "invalid_status");
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Invalid status. Must be one of: active, blacklist');
            });

            it('should reject empty status field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Empty Field
                          Scenario: User attempts to update media status with an empty status
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and an empty status
                            And the alias number exists
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the status field is required
                    `
                });
                // Media alias_no ile status güncelleme isteği gönder
                const media = await api.media.getAll();
                expect(media.body.length).to.be.at.least(1);

                const res = await api.media.updateStatus(media.body[0].alias_no, "");
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Status is required');
            });

            it('should reject missing status field (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Update Media Status with Missing Field
                          Scenario: User attempts to update media status without providing the status field
                            Given the API is running
                            When I send a PUT request to /api/v1/media/:aliasNo/status with a valid alias number and without the status field
                            And the alias number exists
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the status field is required
                    `
                });
                // Media alias_no ile status güncelleme isteği gönder
                const media = await api.media.getAll();
                expect(media.body.length).to.be.at.least(1);
                
                const res = await chai.request(API_BASE_URL)
                    .put(`/api/v1/media/${media.body[0].alias_no}/status`)
                    .send({});
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Status is required');
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
                            And the response body should be an array
                            And the response body should contain transaction objects
                            And each transaction object should have fields: alias_no, amount, operation, and date
                    `
                });
                const res = await api.transactions.getAll();
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                expect(res.body.length).to.be.greaterThan(0); // En az bir transaction olmalı
                res.body.forEach(transaction => {
                    fieldExistenceChecks.hasField(transaction, 'alias_no');
                    fieldExistenceChecks.hasField(transaction, 'amount');
                    fieldExistenceChecks.hasField(transaction, 'operation');
                    fieldExistenceChecks.hasField(transaction, 'date');
                });
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
                            And the alias_no exists
                            And the amount is a positive number
                            And the operation is "recharge"
                            Then the response status code should be 201
                            And the response body should contain the transaction object
                            And the transaction object should have fields: alias_no, amount, operation, and date
                            And the alias_no should match the requested alias_no
                            And the amount should match the requested amount
                            And the operation should be "recharge"
                    `
                });
                // Test için account ve media oluştur
                const accountRes = await api.accounts.create("05551111011");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                const amount = 50;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: amount,
                    operation: "recharge"
                });
                
                statusCodeChecks.is201(res);
                fieldExistenceChecks.hasField(res.body.transaction, 'alias_no');
                dataEqualityChecks.isEqual(res.body.transaction.alias_no, aliasNo);
                dataEqualityChecks.isEqual(res.body.transaction.amount, amount);
                dataEqualityChecks.isEqual(res.body.transaction.operation, "recharge");
                fieldExistenceChecks.hasField(res.body.transaction, 'date');
                dataTypeChecks.checkIsString(res.body.transaction.date);
                dataTypeChecks.isPositiveNumber(res.body.transaction.amount);

            });

            it('should create usage transaction successfully', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Usage Transaction
                          Scenario: Successful creation of a usage transaction
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with valid usage data
                            And the alias_no exists
                            And the amount is a positive number
                            And the operation is "usage"
                            Then the response status code should be 201
                            And the response body should contain the transaction object
                            And the transaction object should have fields: alias_no, amount, operation, and date
                            And the alias_no should match the requested alias_no
                            And the amount should match the requested amount
                            And the operation should be "usage"
                    `
                });
                // Test için account ve media oluştur
                const accountRes = await api.accounts.create("05551111012");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                const amount = 25;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: amount,
                    operation: "usage"
                });
                statusCodeChecks.is201(res);
                dataEqualityChecks.isEqual(res.body.transaction.operation, "usage");
                dataTypeChecks.isPositiveNumber(res.body.transaction.amount);
                fieldExistenceChecks.hasField(res.body.transaction, 'alias_no');
                dataEqualityChecks.isEqual(res.body.transaction.alias_no, aliasNo);
                dataEqualityChecks.isEqual(res.body.transaction.amount, amount);
                fieldExistenceChecks.hasField(res.body.transaction, 'date');
                dataTypeChecks.checkIsString(res.body.transaction.date);
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
                    amount: 50,
                    operation: "recharge"
                });
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('alias_no, amount, and operation are required');
            });

            it('should reject transaction with missing amount (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Missing Amount
                          Scenario: User attempts to create a transaction without providing amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions without amount
                            And the alias_no is valid
                            And the operation is "recharge"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that amount is required
                    `
                });
                // Test için media oluştur
                const accountRes = await api.accounts.create("05551111013");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    operation: "recharge"
                });
                
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('alias_no, amount, and operation are required');
            });

            it('should reject transaction with missing operation (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Missing Operation
                          Scenario: User attempts to create a transaction without providing operation
                            Given the API is running
                            When I send a POST request to /api/v1/transactions without operation
                            And the alias_no is valid
                            And the amount is valid
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that operation is required
                    `
                });

                // Test için media oluştur
                const accountRes = await api.accounts.create("05551111014");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: 50
                });
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('alias_no, amount, and operation are required');
            });

            it('should reject transaction with invalid operation type (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Invalid Operation Type
                          Scenario: User attempts to create a transaction with an invalid operation type
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with an invalid operation type
                            And the alias_no is valid
                            And the amount is valid
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that operation is invalid
                    `
                });
                // Test için media oluştur
                const accountRes = await api.accounts.create("05551111015");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: 50,
                    operation: "invalid_operation"
                });
                
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Operation must be either "recharge" or "usage');
            });

            it('should reject transaction with zero amount (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Zero Amount
                          Scenario: User attempts to create a transaction with zero amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with zero amount
                            And the alias_no is valid
                            And the operation is "recharge"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that amount must be greater than zero
                    `
                });
                // Test için media oluştur
                const accountRes = await api.accounts.create("05551111016");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: 0,
                    operation: "recharge"
                });
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Amount must be greater than 0');
            });

            it('should reject transaction with negative amount (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Create Transaction with Negative Amount
                          Scenario: User attempts to create a transaction with a negative amount
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a negative amount
                            And the alias_no is valid
                            And the operation is "recharge"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that amount must be greater than zero
                    `
                });

                // Test için media oluştur
                const accountRes = await api.accounts.create("05551111017");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: -50,
                    operation: "recharge"
                });
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Amount must be greater than 0');
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
                    amount: 50,
                    operation: "recharge"
                });
                // API 404 Not Found dönüyor
                statusCodeChecks.is404(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Media not found');
            });

            it('should reject transaction on blacklisted media (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Reject Transaction on Blacklisted Media
                          Scenario: User attempts to create a transaction on a blacklisted media
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a blacklisted media alias_no
                            And the amount is valid
                            And the operation is "recharge"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the media is blacklisted

                    `
                });
                // Test için blacklist media oluştur
                let accountRes = await api.accounts.create("05551111025");
                if (!accountRes.body.account_id) {
                    // Account already exists, fetch it
                    const accounts = await api.accounts.getAll();
                    accountRes.body = accounts.body.find(acc => acc.phone_number === "05551111025");
                }
                expect(accountRes.body.account_id).to.exist;

                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "blacklist"
                });
                expect(mediaRes.body.alias_no).to.exist;

                const res = await api.transactions.create({
                    alias_no: mediaRes.body.alias_no,
                    amount: 50,
                    operation: "recharge"
                });

                // API 400 Bad Request dönüyor
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Transaction not allowed - media is blacklisted');
            
            });

            it('should reject usage transaction on blacklisted media (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Reject Usage Transaction on Blacklisted Media
                          Scenario: User attempts to create a usage transaction on a blacklisted media
                            Given the API is running
                            When I send a POST request to /api/v1/transactions with a blacklisted media alias_no
                            And the amount is valid
                            And the operation is "usage"
                            Then the response status code should be 400
                            And the response body should contain an error message
                            And the error message should indicate that the media is blacklisted
                    `
                });
                // Test için blacklist media oluştur
                let accountRes = await api.accounts.create("05551111026");
                if (!accountRes.body.account_id) {
                    // Account already exists, fetch it
                    const accounts = await api.accounts.getAll();
                    accountRes.body = accounts.body.find(acc => acc.phone_number === "05551111026");
                }
                expect(accountRes.body.account_id).to.exist;

                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "blacklist"
                });
                expect(mediaRes.body.alias_no).to.exist;

                const res = await api.transactions.create({
                    alias_no: mediaRes.body.alias_no,
                    amount: 25,
                    operation: "usage"
                });

                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Transaction not allowed - media is blacklisted');
            });

            it('should reject usage transaction with insufficient balance (worst case)', async function () {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Reject Usage Transaction with Insufficient Balance
                            Scenario: User attempts to create a usage transaction with insufficient balance
                                Given the API is running
                                When I send a POST request to /api/v1/transactions with a valid alias_no and insufficient balance
                                And the amount is greater than the current balance
                                And the operation is "usage"
                                Then the response status code should be 400
                                And the response body should contain an error message
                                And the error message should indicate that there is insufficient balance
                    `
                });

                // --- Account oluşturma ---
                let accountRes = await api.accounts.create("05551111018");

                let accountId = accountRes.body.account_id;
                if (!accountId) {
                    // Eğer zaten varsa, listeden çek
                    const accounts = await api.accounts.getAll();
                    console.log("Existing accounts:", accounts.status, accounts.body);
                    const found = accounts.body.find(acc => acc.phone_number === "05551111018");
                    accountId = found ? found.account_id : undefined;
                }
                expect(accountId, "Test setup failed: Valid account_id required").to.exist;

                const mediaRes = await api.media.create({
                    account_id: accountId,
                    expiery_date: "2026-12-31",
                    balance: 1,
                    status: "active"
                });
                expect(mediaRes.status, "Test setup failed: Media creation did not succeed").to.equal(201);
                expect(mediaRes.body.alias_no, "Test setup failed: Valid alias_no required").to.exist;
                const aliasNo = mediaRes.body.alias_no;

                const res = await api.transactions.create({
                    alias_no: aliasNo,
                    amount: 50,
                    operation: "usage"
                });

                // Beklenen sonuç: 400 ve hata mesajı
                statusCodeChecks.is400(res);
                fieldExistenceChecks.hasField(res.body, 'error');
                expect(res.body.error).to.include('Insufficient balance');
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
                            And the response body should be an array of transactions
                            And each transaction should have fields: alias_no, amount, operation, and date
                            And the alias_no in each transaction should match the requested alias_no
                    `
                });
                // Test için account, media ve transaction oluştur
                const accountRes = await api.accounts.create("05551111019");
                const mediaRes = await api.media.create({
                    account_id: accountRes.body.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });
                const aliasNo = mediaRes.body.alias_no;
                
                // Transaction oluştur
                await api.transactions.create({
                    alias_no: aliasNo,
                    amount: 50,
                    operation: "recharge"
                });
                
                const res = await api.transactions.getByAlias(aliasNo);
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                expect(res.body.length).to.be.greaterThan(0); // En az bir transaction olmalı
                res.body.forEach(transaction => {
                    fieldExistenceChecks.hasField(transaction, 'alias_no');
                    fieldExistenceChecks.hasField(transaction, 'amount');
                    fieldExistenceChecks.hasField(transaction, 'operation');
                    fieldExistenceChecks.hasField(transaction, 'date');
                    dataEqualityChecks.isEqual(transaction.alias_no, aliasNo);
                });
            
                if (res.body.length > 0) {
                    // Relational data check - transaction media ilişkisi
                    relationalDataChecks.checkTransactionsBelongToMedia(res.body, aliasNo);
                }
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
                expect(res.body.error).to.include('Media not found');
            });

            it('should return empty array for media with no transactions (worst case)', async function() {
                addContext(this, {
                    title: 'Test explanation',
                    value: `
                        Feature: Get Transactions by Alias Number with No Transactions
                          Scenario: User attempts to get transactions for a media with no transactions
                            Given the API is running
                            When I send a GET request to /api/v1/transactions/media/:aliasNo for a media with no transactions
                            Then the response status code should be 200
                            And the response body should be an empty array
                    `
                });
                // Önce yeni media oluştur
                const accounts = await api.accounts.getAll();
                // İkinci test account'u dinamik olarak bul veya fallback
                let testAccount = accounts.body.find(acc => acc.phone_number === '05559876543');
                if (!testAccount) {
                    // Fallback: herhangi bir account
                    testAccount = accounts.body.find(acc => 
                        acc.phone_number === '05551234567'
                    ) || accounts.body[0];
                }
                expect(testAccount).to.exist;
                
                const mediaRes = await api.media.create({
                    account_id: testAccount.account_id,
                    expiery_date: "2026-12-31",
                    balance: 100,
                    status: "active"
                });

                const res = await api.transactions.getByAlias(mediaRes.body.alias_no);
                statusCodeChecks.is200(res);
                dataTypeChecks.isArray(res.body);
                dataEqualityChecks.isEqual(res.body.length, 0);
                // Hiç transaction olmamalı
                res.body.forEach(transaction => {
                    fieldExistenceChecks.hasField(transaction, 'alias_no');
                    fieldExistenceChecks.hasField(transaction, 'amount');
                    fieldExistenceChecks.hasField(transaction, 'operation');
                    fieldExistenceChecks.hasField(transaction, 'date');
                });
            });
        });
    });
});

# Kentkart API (kentkart_new)

Kentkart API is a backend application built with Node.js and Express.js, using SQLite as its database. The API provides account, media (card), and transaction management, with comprehensive business logic and edge-case coverage. All features are tested with Mocha/Chai.

---

## Table of Contents
- [Architecture](#architecture)
- [Setup & Usage](#setup--usage)
- [API Endpoints](#api-endpoints)
- [Business Logic & Validation](#business-logic--validation)
- [Testing](#testing)
- [Docker Usage](#docker-usage)
- [Error Handling](#error-handling)
- [Sample Requests & Responses](#sample-requests--responses)
- [File Structure](#file-structure)
- [Developer Notes](#developer-notes)
- [License](#license)

---

## Architecture
- **Backend:** Node.js + Express.js
- **Database:** SQLite (file-based, portable)
- **Testing:** Mocha + Chai + Mochawesome
- **Containerization:** Docker & Docker Compose
- **Layers:**
  - `routes/`: API endpoint definitions
  - `services/`: Business logic and data operations
  - `tests/`: All test scenarios and helpers
  - `database.js`: SQLite connection and migration
  - `app.js`: Main app and middleware

---

## Setup & Usage

### Requirements
- Node.js (>=14)
- Docker & Docker Compose

### Steps
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start with Docker:
   ```bash
   docker compose up -d
   ```
3. Start API manually:
   ```bash
   node app.js
   ```
4. Run tests:
   ```bash
   npm test
   ```

---

## API Endpoints

### Accounts
- `POST /api/v1/accounts` - Create account
- `GET /api/v1/accounts` - Get all accounts
- `GET /api/v1/accounts/:id` - Get account details
- `PUT /api/v1/accounts/:id` - Update account
- `DELETE /api/v1/accounts/:id` - Delete account

### Media (Cards)
- `POST /api/v1/media` - Create media
- `GET /api/v1/media` - Get all media
- `GET /api/v1/media/:aliasNo` - Get media details
- `GET /api/v1/media/account/:accountId` - Get media by account
- `PUT /api/v1/media/:aliasNo/balance` - Update media balance
- `PUT /api/v1/media/:aliasNo/status` - Update media status
- `GET /api/v1/media/orphan` - Get orphan media (no account)

### Transactions
- `POST /api/v1/transactions` - Create transaction (recharge/usage)
- `GET /api/v1/transactions` - Get all transactions
- `GET /api/v1/transactions/media/:aliasNo` - Get transactions for media

---

## Business Logic & Validation
- Negative or zero balance is not allowed when creating media.
- Media balance cannot be updated to a negative value.
- Transactions on blacklisted media are forbidden.
- Usage transactions require sufficient balance.
- All required fields and types are validated.
- Meaningful error messages are returned for invalid requests.

Example validation (mediaService.js):
```js
if (balance < 0) throw new Error('Balance cannot be negative');
if (balance === 0) throw new Error('Balance must be greater than 0');
```

---

## Testing
- All edge-case and worst-case scenarios are in `tests/kk.test.js`.
- Automated setup and cleanup for test data.
- Coverage includes: negative/zero balance, missing fields, invalid status, blacklist, orphan media, foreign key, transaction logic, relational data.
- Helper functions: `tests/testFunctions.js`
- Run tests:
  ```bash
  npm test
  ```

---

## Docker Usage
- All services and database run isolated in Docker containers.
- Start everything with a single command using `docker-compose.yml`.
- SQLite file is mounted as a volume.
- Ideal for development and testing environments.

---

## Error Handling
- All endpoints use try/catch and return meaningful error messages.
- Proper HTTP status codes: 400, 404, 409, 500, etc.
- Example error response:
  ```json
  { "error": "Balance cannot be negative" }
  ```

---

## Sample Requests & Responses

### Create Media
```http
POST /api/v1/media
{
  "account_id": 123,
  "expiery_date": "2026-12-31",
  "balance": 100,
  "status": "active"
}
```
Response:
```json
{
  "alias_no": 456,
  "account_id": 123,
  "balance": 100,
  "status": "active"
}
```

### Invalid Media Creation (Negative Balance)
```http
POST /api/v1/media
{
  "account_id": 123,
  "balance": -50
}
```
Response:
```json
{ "error": "Balance cannot be negative" }
```

---

## File Structure
- `app.js`: Main app, middleware, and route setup
- `database.js`: SQLite connection and migration
- `routes/`: All API endpoint definitions
- `services/`: Business logic and data operations
- `tests/kk.test.js`: All test scenarios
- `tests/testFunctions.js`: Test helper functions
- `tests/setup-simple.js`: Test setup/cleanup
- `Dockerfile` & `docker-compose.yml`: Container configuration

---

## Developer Notes
- All business logic and edge-case controls are verified by tests.
- After code or test changes, restart Docker containers for consistency.
- API documentation available at `/api/v1/docs` and `/api/v1/postman` endpoints.

---

## License
MIT


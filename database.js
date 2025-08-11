const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

// Foreign key constraint'leri aktifleştir
db.run('PRAGMA foreign_keys = ON');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS account (
    account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT UNIQUE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS media (
    alias_no INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    create_date TEXT,
    expiery_date TEXT,
    balance REAL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blacklist')),
    FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE SET NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS [transaction] (
    alias_no INTEGER NOT NULL,
    amount REAL,
    date TEXT,
    operation TEXT CHECK (operation IN ('recharge','usage')),
    FOREIGN KEY (alias_no) REFERENCES media(alias_no)
  )`);
});

module.exports = db;

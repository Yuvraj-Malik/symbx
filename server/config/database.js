// ============================================================
// Database Configuration — better-sqlite3 (raw SQL, no ORM)
//
// better-sqlite3 is synchronous and fast. Every query in this
// project is a hand-written SQL statement — no abstraction.
// ============================================================
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const DB_PATH = path.resolve(__dirname, "..", process.env.DB_STORAGE || "database.sqlite");

const db = Database(DB_PATH, { verbose: null }); // set verbose: console.log for SQL debugging

// Enable foreign key enforcement (SQLite has it OFF by default)
db.pragma("journal_mode = WAL");     // Write-Ahead Logging for better concurrency
db.pragma("foreign_keys = ON");      // Enforce FK constraints on every connection

module.exports = db;

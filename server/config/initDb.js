// ============================================================
// Database Initializer — reads schema.sql and creates all tables.
// Called once when the server starts.
// ============================================================
const fs = require("fs");
const path = require("path");
const db = require("./database");

function initDb() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Execute the entire schema file (multiple statements)
  db.exec(schema);
  console.log("Database initialized — all 7 tables ready.");
}

module.exports = initDb;

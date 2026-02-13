// ============================================================
// SEED SCRIPT — Raw SQL INSERTs for all 7 tables.
// Run with: npm run seed
//
// This script:
//   1. Drops and recreates all tables (from schema.sql)
//   2. Inserts 17 chemicals into the chemicals table
//   3. Inserts 5 hazard rules into hazard_matrix
//   4. Inserts 5 sample users (companies) into users
//   5. Inserts 3 OFFER listings with batch_composition rows
//   6. Inserts 2 DEMAND listings with acceptance_criteria rows
//   7. Inserts 3 process_capabilities for graph queries
//
// All INSERTs use parameterized prepared statements.
// The entire seed runs inside a TRANSACTION for atomicity.
// ============================================================
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

// Use a fresh database — delete old one if exists
const DB_PATH = path.resolve(__dirname, process.env.DB_STORAGE || "database.sqlite");
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("Old database deleted.");
}

const db = Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

async function seed() {
  try {
    // --------------------------------------------------------
    // Step 0: Create all tables from schema.sql
    // --------------------------------------------------------
    const schema = fs.readFileSync(path.join(__dirname, "config", "schema.sql"), "utf-8");
    db.exec(schema);
    console.log("All 7 tables created from schema.sql.\n");

    // --------------------------------------------------------
    // Step 1: INSERT INTO chemicals (17 rows)
    // --------------------------------------------------------
    const insertChem = db.prepare(`
      INSERT INTO chemicals (id, name, hazard_level) VALUES (?, ?, ?)
    `);

    const chemData = [
      ["SIO2", "Silicon Dioxide", "LOW"],
      ["AL2O3", "Aluminum Oxide", "LOW"],
      ["FE2O3", "Iron Oxide", "LOW"],
      ["CAO", "Calcium Oxide", "MEDIUM"],
      ["MGO", "Magnesium Oxide", "LOW"],
      ["SO4", "Sulfate", "MEDIUM"],
      ["S", "Sulfur", "MEDIUM"],
      ["PB", "Lead", "HIGH"],
      ["HG", "Mercury", "HIGH"],
      ["AS", "Arsenic", "HIGH"],
      ["CD", "Cadmium", "HIGH"],
      ["CR", "Chromium", "HIGH"],
      ["ZN", "Zinc", "MEDIUM"],
      ["CU", "Copper", "MEDIUM"],
      ["NI", "Nickel", "MEDIUM"],
      ["H2O", "Water", "LOW"],
      ["N", "Nitrogen", "LOW"],
    ];

    const insertAllChemicals = db.transaction(() => {
      for (const row of chemData) {
        insertChem.run(...row);
      }
    });
    insertAllChemicals();
    console.log(`Inserted ${chemData.length} rows into 'chemicals' table.`);

    // --------------------------------------------------------
    // Step 2: INSERT INTO hazard_matrix (5 rows)
    // NOTE: chem_id_1 < chem_id_2 enforced by CHECK constraint
    // --------------------------------------------------------
    const insertHazard = db.prepare(`
      INSERT INTO hazard_matrix (chem_id_1, chem_id_2, is_incompatible) VALUES (?, ?, ?)
    `);

    const hazardData = [
      ["HG", "PB", 1],   // Mercury + Lead = dangerous
      ["AS", "CD", 1],   // Arsenic + Cadmium = dangerous
      ["HG", "S", 1],   // Mercury + Sulfur = dangerous
      ["CR", "PB", 1],   // Chromium + Lead = dangerous
      ["PB", "S", 1],   // Lead + Sulfur = dangerous
    ];

    const insertAllHazards = db.transaction(() => {
      for (const row of hazardData) {
        insertHazard.run(...row);
      }
    });
    insertAllHazards();
    console.log(`Inserted ${hazardData.length} rows into 'hazard_matrix' table.`);

    // --------------------------------------------------------
    // Step 3: INSERT INTO users (5 companies)
    // All passwords: "password123" (bcrypt hashed)
    // --------------------------------------------------------
    const hash = await bcrypt.hash("password123", 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, industry_type, location)
      VALUES (?, ?, ?, ?, ?)
    `);

    const userData = [
      ["NTPC Dadri", "ntpc@example.com", hash, "Thermal", "Dadri, UP"],
      ["UltraTech Cement", "ultratech@example.com", hash, "Cement", "Mumbai, MH"],
      ["Tata Steel", "tata@example.com", hash, "Steel", "Jamshedpur, JH"],
      ["GreenProcess Inc.", "greenproc@example.com", hash, "Chemical", "Vadodara, GJ"],
      ["PharmaCycle Ltd.", "pharma@example.com", hash, "Pharmaceutical", "Hyderabad, TS"],
    ];

    const insertAllUsers = db.transaction(() => {
      for (const row of userData) {
        insertUser.run(...row);
      }
    });
    insertAllUsers();
    console.log(`Inserted ${userData.length} rows into 'users' table.`);

    // --------------------------------------------------------
    // Step 4: INSERT OFFER listings + batch_composition
    // --------------------------------------------------------
    const insertListing = db.prepare(`
      INSERT INTO listings (user_id, type, material_name, total_quantity, status)
      VALUES (?, ?, ?, ?, 'ACTIVE')
    `);

    const insertComp = db.prepare(`
      INSERT INTO batch_composition (listing_id, chem_id, percentage)
      VALUES (?, ?, ?)
    `);

    const insertCrit = db.prepare(`
      INSERT INTO acceptance_criteria (listing_id, chem_id, min_percentage, max_percentage)
      VALUES (?, ?, ?, ?)
    `);

    const insertOffers = db.transaction(() => {
      // OFFER 1: NTPC Dadri → Fly Ash (6 chemicals)
      const o1 = insertListing.run(1, "OFFER", "Fly Ash", 5000);
      insertComp.run(o1.lastInsertRowid, "SIO2", 60);
      insertComp.run(o1.lastInsertRowid, "AL2O3", 25);
      insertComp.run(o1.lastInsertRowid, "FE2O3", 8);
      insertComp.run(o1.lastInsertRowid, "CAO", 4);
      insertComp.run(o1.lastInsertRowid, "S", 0.5);
      insertComp.run(o1.lastInsertRowid, "PB", 0.02);

      // OFFER 2: Tata Steel → Blast Furnace Slag (5 chemicals)
      const o2 = insertListing.run(3, "OFFER", "Blast Furnace Slag", 3000);
      insertComp.run(o2.lastInsertRowid, "CAO", 40);
      insertComp.run(o2.lastInsertRowid, "SIO2", 35);
      insertComp.run(o2.lastInsertRowid, "AL2O3", 15);
      insertComp.run(o2.lastInsertRowid, "MGO", 8);
      insertComp.run(o2.lastInsertRowid, "S", 1.2);

      // OFFER 3: PharmaCycle → Chemical Sludge (5 chemicals, hazardous)
      const o3 = insertListing.run(5, "OFFER", "Chemical Sludge", 200);
      insertComp.run(o3.lastInsertRowid, "H2O", 75);
      insertComp.run(o3.lastInsertRowid, "N", 12);
      insertComp.run(o3.lastInsertRowid, "S", 5);
      insertComp.run(o3.lastInsertRowid, "PB", 2);
      insertComp.run(o3.lastInsertRowid, "HG", 0.3);
    });
    insertOffers();
    console.log("Inserted 3 OFFER listings with 16 batch_composition rows.");

    // --------------------------------------------------------
    // Step 5: INSERT DEMAND listings + acceptance_criteria
    // --------------------------------------------------------
    const insertDemands = db.transaction(() => {
      // DEMAND 1: UltraTech needs Fly Ash (3 criteria)
      //   SiO2 >= 50%, Sulfur <= 1%, Lead <= 0.1%
      const d1 = insertListing.run(2, "DEMAND", "Fly Ash", 2000);
      insertCrit.run(d1.lastInsertRowid, "SIO2", 50, null);  // min 50%, no max
      insertCrit.run(d1.lastInsertRowid, "S", null, 1);      // no min, max 1%
      insertCrit.run(d1.lastInsertRowid, "PB", null, 0.1);    // no min, max 0.1%

      // DEMAND 2: Tata Steel needs Calcium Source (2 criteria)
      //   CaO >= 30%, Lead <= 0.5%
      const d2 = insertListing.run(3, "DEMAND", "Calcium Source", 1000);
      insertCrit.run(d2.lastInsertRowid, "CAO", 30, null);   // min 30%, no max
      insertCrit.run(d2.lastInsertRowid, "PB", null, 0.5);     // no min, max 0.5%
    });
    insertDemands();
    console.log("Inserted 2 DEMAND listings with 5 acceptance_criteria rows.");

    // --------------------------------------------------------
    // Step 6: INSERT INTO process_capabilities (3 rows)
    // GreenProcess Inc. (user_id=4) can convert chemicals
    // --------------------------------------------------------
    const insertProc = db.prepare(`
      INSERT INTO process_capabilities (processor_id, input_chem_id, output_chem_id, conversion_efficiency)
      VALUES (?, ?, ?, ?)
    `);

    const insertAllProcs = db.transaction(() => {
      insertProc.run(4, "S", "SO4", 0.90);  // Sulfur → Sulfate at 90%
      insertProc.run(4, "PB", "ZN", 0.60);  // Lead → Zinc at 60%
      insertProc.run(4, "SO4", "CAO", 0.75);  // Sulfate → Calcium Oxide at 75%
    });
    insertAllProcs();
    console.log("Inserted 3 rows into 'process_capabilities' table.");

    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------
    console.log("\n========================================");
    console.log("  SEED COMPLETE — Database Summary");
    console.log("========================================");

    const tables = [
      "chemicals", "hazard_matrix", "users", "listings",
      "batch_composition", "acceptance_criteria", "process_capabilities",
    ];

    for (const table of tables) {
      const count = db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get();
      console.log(`  ${table.padEnd(25)} ${count.cnt} rows`);
    }

    console.log("========================================");
    console.log("\nLogin credentials (all same password):");
    console.log("  Email: ntpc@example.com       | Password: password123");
    console.log("  Email: ultratech@example.com  | Password: password123");
    console.log("  Email: tata@example.com       | Password: password123");
    console.log("  Email: greenproc@example.com  | Password: password123");
    console.log("  Email: pharma@example.com     | Password: password123");

    db.close();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    db.close();
    process.exit(1);
  }
}

seed();

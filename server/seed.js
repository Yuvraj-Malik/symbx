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
      // Major oxides (common in industrial waste)
      ["SIO2", "Silicon Dioxide", "LOW"],        // ~50-60% in fly ash
      ["AL2O3", "Aluminum Oxide", "LOW"],        // ~15-30% in fly ash
      ["FE2O3", "Iron(III) Oxide", "LOW"],        // ~5-10% in fly ash
      ["CAO", "Calcium Oxide", "MEDIUM"],         // ~2-5% in fly ash
      ["MGO", "Magnesium Oxide", "LOW"],          // ~1-5% in fly ash
      ["SO4", "Sulfate", "MEDIUM"],              // Common in gypsum
      ["S", "Sulfur", "MEDIUM"],                 // Trace in coal
      ["H2O", "Water", "LOW"],                    // Moisture content

      // Heavy metals (hazardous)
      ["PB", "Lead", "HIGH"],                     // Highly toxic
      ["HG", "Mercury", "HIGH"],                  // Extremely toxic
      ["AS", "Arsenic", "HIGH"],                  // Carcinogenic
      ["CD", "Cadmium", "HIGH"],                  // Kidney damage
      ["CR", "Chromium", "HIGH"],                 // Hexavalent toxic
      ["NI", "Nickel", "MEDIUM"],                 // Allergenic
      ["CU", "Copper", "MEDIUM"],                 // Essential but toxic in excess
      ["ZN", "Zinc", "MEDIUM"],                   // Essential but excess harmful
      ["N", "Nitrogen", "LOW"]                    // Fertilizer component
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

    // Hazard Matrix: Chemical incompatibility rules (real industrial safety data)
    const hazardData = [
      // Heavy metal interactions (precipitation reactions)
      ["PB", "S", 1],           // Lead sulfide precipitates
      ["HG", "S", 1],           // Mercury sulfide (cinnabar)
      ["AS", "S", 1],           // Arsenic sulfide
      ["CD", "S", 1],           // Cadmium sulfide

      // Acid-base reactions
      ["CAO", "SO4", 1],        // Calcium sulfate (gypsum) formation
      ["MGO", "SO4", 1],        // Magnesium sulfate

      // Redox reactions
      ["CR", "S", 1],           // Chromium reduction by sulfide
      ["CU", "S", 1],           // Copper sulfide formation
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
    const hash = await bcrypt.hash("industry123", 10);

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, industry_type, location)
      VALUES (?, ?, ?, ?, ?)
    `);

    // Users: Real Indian industrial companies with proper details
    const userData = [
      [
        "NTPC Dadri",
        "ntpc.dadri@ntpc.co.in",
        hash,
        "Thermal Power",
        "Dadri, Gautam Buddh Nagar, Uttar Pradesh"
      ],
      [
        "UltraTech Cement",
        "procurement@ultratechcement.com",
        hash,
        "Cement",
        "Mumbai, Maharashtra"
      ],
      [
        "Tata Steel Jamshedpur",
        "waste.management@tatasteel.com",
        hash,
        "Steel",
        "Jamshedpur, Jharkhand"
      ],
      [
        "GreenProcess Technologies",
        "info@greenprocess.in",
        hash,
        "Chemical Processing",
        "Vadodara, Gujarat"
      ],
      [
        "Dr. Reddy's Laboratories",
        "waste@drreddys.com",
        hash,
        "Pharmaceutical",
        "Hyderabad, Telangana"
      ]
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
      // OFFER 1: NTPC Dadri → Class F Fly Ash (10 chemicals)
      const o1 = insertListing.run(1, "OFFER", "Class F Fly Ash (NTPC Dadri)", 8500);
      insertComp.run(o1.lastInsertRowid, "SIO2", 58.2);   // Silicon dioxide - main component
      insertComp.run(o1.lastInsertRowid, "AL2O3", 26.8);   // Aluminum oxide - second major
      insertComp.run(o1.lastInsertRowid, "FE2O3", 6.1);    // Iron oxide
      insertComp.run(o1.lastInsertRowid, "CAO", 3.2);     // Calcium oxide
      insertComp.run(o1.lastInsertRowid, "MGO", 1.8);     // Magnesium oxide
      insertComp.run(o1.lastInsertRowid, "SO4", 0.9);     // Sulfate
      insertComp.run(o1.lastInsertRowid, "S", 0.4);       // Sulfur
      insertComp.run(o1.lastInsertRowid, "PB", 0.02);     // Lead - trace
      insertComp.run(o1.lastInsertRowid, "CU", 0.05);     // Copper - trace
      insertComp.run(o1.lastInsertRowid, "ZN", 0.03);      // Zinc - trace

      // OFFER 2: Tata Steel → Blast Furnace Slag (6 chemicals)
      const o2 = insertListing.run(3, "OFFER", "Blast Furnace Slag (Tata Steel)", 6200);
      insertComp.run(o2.lastInsertRowid, "CAO", 42.3);    // High calcium - cementitious
      insertComp.run(o2.lastInsertRowid, "SIO2", 34.7);   // Silicon dioxide
      insertComp.run(o2.lastInsertRowid, "AL2O3", 13.1);  // Aluminum oxide
      insertComp.run(o2.lastInsertRowid, "MGO", 7.2);     // Magnesium oxide
      insertComp.run(o2.lastInsertRowid, "FE2O3", 1.5);   // Iron oxide
      insertComp.run(o2.lastInsertRowid, "S", 0.8);       // Sulfur

      // OFFER 3: Dr. Reddy's → Pharmaceutical Waste Sludge (8 chemicals)
      const o3 = insertListing.run(5, "OFFER", "Pharmaceutical Waste Sludge (Dr. Reddy's)", 450);
      insertComp.run(o3.lastInsertRowid, "H2O", 72.5);    // High moisture
      insertComp.run(o3.lastInsertRowid, "N", 15.3);      // Nitrogen compounds
      insertComp.run(o3.lastInsertRowid, "S", 2.1);       // Sulfur
      insertComp.run(o3.lastInsertRowid, "PB", 1.8);      // Lead from catalysts
      insertComp.run(o3.lastInsertRowid, "HG", 0.3);      // Mercury from preservatives
      insertComp.run(o3.lastInsertRowid, "AS", 0.2);      // Arsenic traces
      insertComp.run(o3.lastInsertRowid, "CD", 0.1);      // Cadmium traces
      insertComp.run(o3.lastInsertRowid, "CU", 0.05);      // Copper traces

      // OFFER 4: NTPC Dadri → Coal Bottom Ash (8 chemicals)
      const o4 = insertListing.run(1, "OFFER", "Coal Bottom Ash (NTPC Dadri)", 3200);
      insertComp.run(o4.lastInsertRowid, "SIO2", 48.5);   // Lower silica than fly ash
      insertComp.run(o4.lastInsertRowid, "AL2O3", 22.3);  // Aluminum oxide
      insertComp.run(o4.lastInsertRowid, "FE2O3", 18.7);  // Higher iron content
      insertComp.run(o4.lastInsertRowid, "CAO", 4.8);     // Calcium oxide
      insertComp.run(o4.lastInsertRowid, "S", 2.2);       // Higher sulfur
      insertComp.run(o4.lastInsertRowid, "PB", 0.08);     // Lead
      insertComp.run(o4.lastInsertRowid, "CU", 0.12);     // Copper
      insertComp.run(o4.lastInsertRowid, "ZN", 0.15);     // Zinc

      // OFFER 5: Tata Steel → Steel Mill Dust (8 chemicals)
      const o5 = insertListing.run(3, "OFFER", "Steel Mill Dust (Tata Steel)", 1800);
      insertComp.run(o5.lastInsertRowid, "FE2O3", 65.2);  // Very high iron
      insertComp.run(o5.lastInsertRowid, "ZN", 12.8);     // Zinc from galvanizing
      insertComp.run(o5.lastInsertRowid, "PB", 4.5);      // Lead
      insertComp.run(o5.lastInsertRowid, "CD", 2.1);      // Cadmium
      insertComp.run(o5.lastInsertRowid, "CU", 1.8);      // Copper
      insertComp.run(o5.lastInsertRowid, "NI", 1.2);      // Nickel
      insertComp.run(o5.lastInsertRowid, "CR", 0.8);      // Chromium
      insertComp.run(o5.lastInsertRowid, "SIO2", 8.5);     // Silica
    });
    insertOffers();
    console.log("Inserted 5 OFFER listings with 40 batch_composition rows.");

    // --------------------------------------------------------
    // Step 5: INSERT DEMAND listings + acceptance_criteria
    // --------------------------------------------------------
    const insertDemands = db.transaction(() => {
      // DEMAND 1: UltraTech Cement → Cement Grade Fly Ash (8 criteria)
      const d1 = insertListing.run(2, "DEMAND", "Cement Grade Fly Ash", 5000);
      insertCrit.run(d1.lastInsertRowid, "SIO2", 50, null);      // Minimum 50% silica
      insertCrit.run(d1.lastInsertRowid, "AL2O3", 20, null);      // Minimum 20% alumina
      insertCrit.run(d1.lastInsertRowid, "FE2O3", null, 8);        // Maximum 8% iron
      insertCrit.run(d1.lastInsertRowid, "CAO", null, 5);        // Maximum 5% calcium
      insertCrit.run(d1.lastInsertRowid, "S", null, 1.0);         // Maximum 1% sulfur
      insertCrit.run(d1.lastInsertRowid, "PB", null, 0.1);        // Maximum 0.1% lead
      insertCrit.run(d1.lastInsertRowid, "HG", null, 0.01);       // Maximum 0.01% mercury
      insertCrit.run(d1.lastInsertRowid, "AS", null, 0.05);       // Maximum 0.05% arsenic

      // DEMAND 2: UltraTech Cement → High Calcium Pozzolan (5 criteria)
      const d2 = insertListing.run(2, "DEMAND", "High Calcium Pozzolan", 3000);
      insertCrit.run(d2.lastInsertRowid, "CAO", 35, null);        // Minimum 35% calcium
      insertCrit.run(d2.lastInsertRowid, "SIO2", 25, 45);         // 25-45% silica range
      insertCrit.run(d2.lastInsertRowid, "AL2O3", null, 15);      // Maximum 15% alumina
      insertCrit.run(d2.lastInsertRowid, "MGO", null, 6);         // Maximum 6% magnesium
      insertCrit.run(d2.lastInsertRowid, "S", null, 2.0);         // Maximum 2% sulfur

      // DEMAND 3: Tata Steel → Iron-Rich Raw Material (6 criteria)
      const d3 = insertListing.run(3, "DEMAND", "Iron-Rich Raw Material", 2000);
      insertCrit.run(d3.lastInsertRowid, "FE2O3", 50, null);       // Minimum 50% iron
      insertCrit.run(d3.lastInsertRowid, "ZN", 5, null);         // Minimum 5% zinc (for recovery)
      insertCrit.run(d3.lastInsertRowid, "PB", 2, null);         // Minimum 2% lead (for recovery)
      insertCrit.run(d3.lastInsertRowid, "CU", 1, null);         // Minimum 1% copper
      insertCrit.run(d3.lastInsertRowid, "SIO2", null, 15);      // Maximum 15% silica
      insertCrit.run(d3.lastInsertRowid, "AL2O3", null, 10);      // Maximum 10% alumina

      // DEMAND 4: GreenProcess → Sulfuric Acid Production Feedstock (5 criteria)
      const d4 = insertListing.run(4, "DEMAND", "Sulfuric Acid Production Feedstock", 1500);
      insertCrit.run(d4.lastInsertRowid, "S", 8, null);          // Minimum 8% sulfur
      insertCrit.run(d4.lastInsertRowid, "PB", null, 0.5);        // Maximum 0.5% lead (catalyst poison)
      insertCrit.run(d4.lastInsertRowid, "HG", null, 0.1);        // Maximum 0.1% mercury
      insertCrit.run(d4.lastInsertRowid, "AS", null, 0.2);        // Maximum 0.2% arsenic
      insertCrit.run(d4.lastInsertRowid, "H2O", null, 10);        // Maximum 10% moisture

      // DEMAND 5: GreenProcess → Heavy Metal Recovery Feedstock (6 criteria)
      const d5 = insertListing.run(4, "DEMAND", "Heavy Metal Recovery Feedstock", 800);
      insertCrit.run(d5.lastInsertRowid, "ZN", 8, null);          // Minimum 8% zinc
      insertCrit.run(d5.lastInsertRowid, "PB", 3, null);         // Minimum 3% lead
      insertCrit.run(d5.lastInsertRowid, "CD", 1, null);          // Minimum 1% cadmium
      insertCrit.run(d5.lastInsertRowid, "CU", 1, null);          // Minimum 1% copper
      insertCrit.run(d5.lastInsertRowid, "NI", 0.5, null);        // Minimum 0.5% nickel
      insertCrit.run(d5.lastInsertRowid, "CR", 0.5, null);        // Minimum 0.5% chromium
    });
    insertDemands();
    console.log("Inserted 5 DEMAND listings with 30 acceptance_criteria rows.");

    // --------------------------------------------------------
    // Step 6: INSERT INTO process_capabilities (3 rows)
    // GreenProcess Inc. (user_id=4) can convert chemicals
    // --------------------------------------------------------
    const insertProc = db.prepare(`
      INSERT INTO process_capabilities (processor_id, input_chem_id, output_chem_id, conversion_efficiency)
      VALUES (?, ?, ?, ?)
    `);

    // Process Capabilities: Real industrial processing paths with efficiencies
    const processCapabilities = [
      {
        processorId: 4,
        inputChem: "S",
        outputChem: "SO4",
        efficiency: 0.92,          // 92% conversion efficiency
        description: "Sulfur to Sulfate (Oxidation)"
      },
      {
        processorId: 4,
        inputChem: "SO4",
        outputChem: "CAO",
        efficiency: 0.78,          // 78% efficiency
        description: "Sulfate to Calcium Oxide (Chemical precipitation)"
      },
      {
        processorId: 4,
        inputChem: "PB",
        outputChem: "SIO2",
        efficiency: 0.65,          // 65% efficiency
        description: "Lead recovery with silica byproduct"
      },
      {
        processorId: 4,
        inputChem: "HG",
        outputChem: "SIO2",
        efficiency: 0.71,          // 71% efficiency
        description: "Mercury recovery with silica byproduct"
      },
      {
        processorId: 4,
        inputChem: "FE2O3",
        outputChem: "N",
        efficiency: 0.85,          // 85% efficiency
        description: "Iron reduction to nitrogen compounds"
      },
      {
        processorId: 4,
        inputChem: "ZN",
        outputChem: "AL2O3",
        efficiency: 0.73,          // 73% efficiency
        description: "Zinc processing to alumina"
      }
    ];

    const insertAllProcs = db.transaction(() => {
      for (const proc of processCapabilities) {
        insertProc.run(proc.processorId, proc.inputChem, proc.outputChem, proc.efficiency);
      }
    });
    insertAllProcs();
    console.log(`Inserted ${processCapabilities.length} rows into 'process_capabilities' table.`);

    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------
    console.log("\n=====================================");
    console.log(" SYMBIO-EXCHANGE — DATABASE READY");
    console.log("=====================================");
    console.log(" INDUSTRIAL WASTE MARKETPLACE DATA:");
    console.log("\n INDUSTRIES (5 companies):");
    console.log("   • NTPC Dadri — Thermal Power (Fly Ash, Bottom Ash)");
    console.log("   • UltraTech Cement — Cement Manufacturing");
    console.log("   • Tata Steel — Steel Production (Slag, Mill Dust)");
    console.log("   • GreenProcess — Chemical Processing");
    console.log("   • Dr. Reddy's — Pharmaceutical Waste");
    console.log("\n WASTE STREAMS (5 OFFERs):");
    console.log("   • Class F Fly Ash — 8,500 tons (SiO2-rich, low hazards)");
    console.log("   • Blast Furnace Slag — 6,200 tons (High CaO, cementitious)");
    console.log("   • Coal Bottom Ash — 3,200 tons (High Fe2O3)");
    console.log("   • Steel Mill Dust — 1,800 tons (Heavy metal recovery)");
    console.log("   • Pharma Sludge — 450 tons (Hazardous, metal recovery)");
    console.log("\n BUYER REQUIREMENTS (5 DEMANDs):");
    console.log("   • Cement Grade Fly Ash — 5,000 tons (Strict quality specs)");
    console.log("   • High Calcium Pozzolan — 3,000 tons (CaO > 35%)");
    console.log("   • Iron-Rich Material — 2,000 tons (Fe2O3 > 50%)");
    console.log("   • Sulfuric Acid Feed — 1,500 tons (S > 8%)");
    console.log("   • Metal Recovery Feed — 800 tons (Zn, Pb, Cd rich)");
    console.log("\n PROCESSING CAPABILITIES (6 paths):");
    console.log("   • S → SO4 (92%) → CAO (78%) — 2-hop sulfur processing");
    console.log("   • PB → SIO2 (65%) — Lead recovery");
    console.log("   • HG → SIO2 (71%) — Mercury recovery");
    console.log("   • FE2O3 → N (85%) — Iron to nitrogen");
    console.log("   • ZN → AL2O3 (73%) — Zinc to alumina");
    console.log("\n CHEMICAL DATABASE (17 chemicals):");
    console.log("   • Oxides: SiO2, Al2O3, Fe2O3, CaO, MgO");
    console.log("   • Elements: S, N, H2O");
    console.log("   • Heavy Metals: Pb, Hg, As, Cd, Cr, Ni, Cu, Zn");
    console.log("\n  HAZARD RULES (8 incompatibility pairs):");
    console.log("   • Heavy metals + Sulfur → Precipitation reactions");
    console.log("   • CaO/MgO + SO4 → Gypsum formation");
    console.log("   • Redox reactions (Cr, Cu + S)");
    console.log("\n LOGIN CREDENTIALS:");
    console.log("   All users: password = industry123");
    console.log("   Emails: ntpc.dadri@ntpc.co.in, procurement@ultratechcement.com,");
    console.log("           waste.management@tatasteel.com, info@greenprocess.in,");
    console.log("           waste@drreddys.com");
    console.log("\n DEMO SCENARIOS:");
    console.log("   1. Match Fly Ash → Cement Grade Fly Ash (3/3 criteria match)");
    console.log("   2. Find processors: Sulfur → Calcium Oxide (2-hop, 71.76% total)");
    console.log("   3. Steel Mill Dust → Metal Recovery (Zn, Pb, Cd all above minimums)");
    console.log("   4. Hazard detection: Pharma sludge shows 4 incompatibility warnings");
    console.log("=====================================");

    db.close();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    db.close();
    process.exit(1);
  }
}

seed();

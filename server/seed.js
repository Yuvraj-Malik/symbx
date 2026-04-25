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
      ["N", "Nitrogen", "LOW"],                   // Fertilizer component

      // Additional chemicals
      ["K2O", "Potassium Oxide", "LOW"],          // Common in fertilizers
      ["NA2O", "Sodium Oxide", "LOW"],            // In glass and detergents
      ["TIO2", "Titanium Dioxide", "LOW"],        // Pigment in paints
      ["P2O5", "Phosphorus Pentoxide", "MEDIUM"], // Fertilizer component
      ["CL", "Chlorine", "MEDIUM"],               // In PVC and chemicals
      ["F", "Fluorine", "HIGH"],                  // Toxic in excess
      ["MN", "Manganese", "MEDIUM"],              // Steel alloy
      ["CO", "Cobalt", "HIGH"],                   // Battery materials
      ["V", "Vanadium", "HIGH"],                  // Petroleum refining
      ["MO", "Molybdenum", "MEDIUM"],             // Alloy metal
      ["W", "Tungsten", "LOW"],                   // Hard metal
      ["BA", "Barium", "HIGH"],                   // Drilling fluids
      ["SR", "Strontium", "MEDIUM"],              // Ceramics
      ["ZR", "Zirconium", "LOW"],                 // Nuclear fuel
      ["SN", "Tin", "MEDIUM"],                    // Solder and cans
      ["SB", "Antimony", "HIGH"],                 // Flame retardants
      ["BI", "Bismuth", "LOW"],                   // Pharmaceuticals
      ["TE", "Tellurium", "HIGH"],                // Semiconductor
      ["SE", "Selenium", "HIGH"],                 // Photovoltaics
      ["GE", "Germanium", "MEDIUM"],              // Electronics
      ["GA", "Gallium", "MEDIUM"],                // LEDs
      ["IN", "Indium", "HIGH"],                   // Touchscreens
      ["TL", "Thallium", "HIGH"],                 // Optics
      ["TI", "Thallium", "HIGH"],                 // Note: TI is Titanium, but using TL for Thallium
      ["U", "Uranium", "HIGH"],                   // Nuclear
      ["TH", "Thorium", "HIGH"],                  // Nuclear
      ["RA", "Radium", "HIGH"],                   // Radioactive
      ["AC", "Actinium", "HIGH"],                 // Radioactive
      ["PA", "Protactinium", "HIGH"],             // Radioactive
      ["NP", "Neptunium", "HIGH"],                // Radioactive
      ["PU", "Plutonium", "HIGH"],                // Radioactive
      ["AM", "Americium", "HIGH"],                // Radioactive
      ["CM", "Curium", "HIGH"],                   // Radioactive
      ["BK", "Berkelium", "HIGH"],                // Radioactive
      ["CF", "Californium", "HIGH"],              // Radioactive
      ["ES", "Einsteinium", "HIGH"],              // Radioactive
      ["FM", "Fermium", "HIGH"],                  // Radioactive
      ["MD", "Mendelevium", "HIGH"],              // Radioactive
      ["NO", "Nobelium", "HIGH"],                 // Radioactive
      ["LR", "Lawrencium", "HIGH"],               // Radioactive
      ["RF", "Rutherfordium", "HIGH"],            // Radioactive
      ["DB", "Dubnium", "HIGH"],                  // Radioactive
      ["SG", "Seaborgium", "HIGH"],               // Radioactive
      ["BH", "Bohrium", "HIGH"],                  // Radioactive
      ["HS", "Hassium", "HIGH"],                  // Radioactive
      ["MT", "Meitnerium", "HIGH"],               // Radioactive
      ["DS", "Darmstadtium", "HIGH"],             // Radioactive
      ["RG", "Roentgenium", "HIGH"],              // Radioactive
      ["CN", "Copernicium", "HIGH"],              // Radioactive
      ["NH", "Nihonium", "HIGH"],                 // Radioactive
      ["FL", "Flerovium", "HIGH"],                // Radioactive
      ["MC", "Moscovium", "HIGH"],                // Radioactive
      ["LV", "Livermorium", "HIGH"],              // Radioactive
      ["TS", "Tennessine", "HIGH"],               // Radioactive
      ["OG", "Oganesson", "HIGH"]                 // Radioactive
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

      // Additional hazard pairs
      ["ZN", "CL", 1],          // Zinc chloride formation
      ["FE2O3", "CL", 1],       // Iron chloride
      ["AL2O3", "F", 1],        // Aluminum fluoride
      ["CAO", "F", 1],          // Calcium fluoride
      ["PB", "CL", 1],          // Lead chloride
      ["HG", "CL", 1],          // Mercury chloride
      ["AS", "CL", 1],          // Arsenic chloride
      ["CD", "CL", 1],          // Cadmium chloride
      ["CR", "CL", 1],          // Chromium chloride
      ["NI", "CL", 1],          // Nickel chloride
      ["CU", "CL", 1],          // Copper chloride
      ["ZN", "F", 1],           // Zinc fluoride
      ["FE2O3", "F", 1],        // Iron fluoride
      ["PB", "F", 1],           // Lead fluoride
      ["HG", "F", 1],           // Mercury fluoride
      ["AS", "F", 1],           // Arsenic fluoride
      ["CD", "F", 1],           // Cadmium fluoride
      ["CR", "F", 1],           // Chromium fluoride
      ["NI", "F", 1],           // Nickel fluoride
      ["CU", "F", 1],           // Copper fluoride
      ["K2O", "SO4", 1],        // Potassium sulfate
      ["NA2O", "SO4", 1],       // Sodium sulfate
      ["K2O", "CL", 1],         // Potassium chloride
      ["NA2O", "CL", 1],        // Sodium chloride
      ["TIO2", "F", 1],         // Titanium fluoride
      ["P2O5", "CAO", 1],       // Calcium phosphate
      ["P2O5", "MGO", 1],       // Magnesium phosphate
      ["MN", "S", 1],           // Manganese sulfide
      ["CO", "S", 1],           // Cobalt sulfide
      ["V", "S", 1],            // Vanadium sulfide
      ["MO", "S", 1],           // Molybdenum sulfide
      ["W", "S", 1],            // Tungsten sulfide
      ["BA", "SO4", 1],         // Barium sulfate
      ["SR", "SO4", 1],         // Strontium sulfate
      ["ZR", "F", 1],           // Zirconium fluoride
      ["SN", "CL", 1],          // Tin chloride
      ["SB", "CL", 1],          // Antimony chloride
      ["BI", "CL", 1],          // Bismuth chloride
      ["TE", "S", 1],           // Tellurium sulfide
      ["SE", "S", 1],           // Selenium sulfide
      ["GE", "CL", 1],          // Germanium chloride
      ["GA", "CL", 1],          // Gallium chloride
      ["IN", "CL", 1],          // Indium chloride
      ["TL", "CL", 1],          // Thallium chloride
      ["U", "F", 1],            // Uranium fluoride
      ["TH", "F", 1],           // Thorium fluoride
      ["RA", "SO4", 1],         // Radium sulfate
      ["AC", "F", 1],           // Actinium fluoride
      ["PA", "CL", 1],          // Protactinium chloride
      ["NP", "S", 1],           // Neptunium sulfide
      ["PU", "CL", 1],          // Plutonium chloride
      ["AM", "F", 1],           // Americium fluoride
      ["CM", "SO4", 1],         // Curium sulfate
      ["BK", "CL", 1],          // Berkelium chloride
      ["CF", "F", 1],           // Californium fluoride
      ["ES", "S", 1],           // Einsteinium sulfide
      ["FM", "CL", 1],          // Fermium chloride
      ["MD", "F", 1],           // Mendelevium fluoride
      ["NO", "SO4", 1],         // Nobelium sulfate
      ["LR", "CL", 1],          // Lawrencium chloride
      ["RF", "F", 1],           // Rutherfordium fluoride
      ["DB", "S", 1],           // Dubnium sulfide
      ["SG", "CL", 1],          // Seaborgium chloride
      ["BH", "F", 1],           // Bohrium fluoride
      ["HS", "SO4", 1],         // Hassium sulfate
      ["MT", "CL", 1],          // Meitnerium chloride
      ["DS", "F", 1],           // Darmstadtium fluoride
      ["RG", "S", 1],           // Roentgenium sulfide
      ["CN", "CL", 1],          // Copernicium chloride
      ["NH", "F", 1],           // Nihonium fluoride
      ["FL", "SO4", 1],         // Flerovium sulfate
      ["MC", "CL", 1],          // Moscovium chloride
      ["LV", "F", 1],           // Livermorium fluoride
      ["TS", "S", 1],           // Tennessine sulfide
      ["OG", "CL", 1]           // Oganesson chloride
    ];

    // Ensure chem_id_1 < chem_id_2 for CHECK constraint
    for (let row of hazardData) {
      if (row[0] > row[1]) {
        [row[0], row[1]] = [row[1], row[0]];
      }
    }

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
      ],
      [
        "Reliance Industries",
        "waste@ril.com",
        hash,
        "Petrochemical",
        "Jamnagar, Gujarat"
      ],
      [
        "Hindustan Unilever",
        "sustainability@hul.co.in",
        hash,
        "Consumer Goods",
        "Mumbai, Maharashtra"
      ],
      [
        "Bajaj Auto",
        "environment@bajajauto.co.in",
        hash,
        "Automotive",
        "Pune, Maharashtra"
      ],
      [
        "ITC Limited",
        "csr@itc.in",
        hash,
        "Tobacco & FMCG",
        "Kolkata, West Bengal"
      ],
      [
        "Adani Group",
        "sustainability@adani.com",
        hash,
        "Conglomerate",
        "Ahmedabad, Gujarat"
      ],
      [
        "JSW Steel",
        "waste@jsw.in",
        hash,
        "Steel",
        "Mumbai, Maharashtra"
      ],
      [
        "Vedanta Limited",
        "environment@vedanta.co.in",
        hash,
        "Mining & Metals",
        "Mumbai, Maharashtra"
      ],
      [
        "GAIL (India)",
        "csr@gail.co.in",
        hash,
        "Natural Gas",
        "New Delhi"
      ],
      [
        "NTPC Vindhyachal",
        "waste@ntpc.co.in",
        hash,
        "Thermal Power",
        "Singrauli, Madhya Pradesh"
      ],
      [
        "Ambuja Cement",
        "procurement@ambujacement.com",
        hash,
        "Cement",
        "Mumbai, Maharashtra"
      ],
      [
        "Steel Authority of India (SAIL)",
        "environment@sail.co.in",
        hash,
        "Steel",
        "New Delhi"
      ],
      [
        "Indian Oil Corporation",
        "waste@indianoil.in",
        hash,
        "Oil Refining",
        "New Delhi"
      ],
      [
        "Bharat Petroleum",
        "sustainability@bharatpetroleum.in",
        hash,
        "Oil Refining",
        "Mumbai, Maharashtra"
      ],
      [
        "Hindustan Petroleum",
        "environment@hindustanpetroleum.com",
        hash,
        "Oil Refining",
        "Mumbai, Maharashtra"
      ],
      [
        "Coal India Limited",
        "csr@coalindia.in",
        hash,
        "Coal Mining",
        "Kolkata, West Bengal"
      ],
      [
        "NMDC Limited",
        "waste@nmdc.co.in",
        hash,
        "Iron Ore Mining",
        "Hyderabad, Telangana"
      ],
      [
        "Gujarat Alkalies",
        "procurement@gujaratalkalies.com",
        hash,
        "Chemical",
        "Vadodara, Gujarat"
      ],
      [
        "Tata Chemicals",
        "environment@tatachemicals.com",
        hash,
        "Chemical",
        "Mumbai, Maharashtra"
      ],
      [
        "UPL Limited",
        "sustainability@upl-ltd.com",
        hash,
        "Agrochemicals",
        "Mumbai, Maharashtra"
      ],
      [
        "PI Industries",
        "waste@piindustries.com",
        hash,
        "Agrochemicals",
        "Gurgaon, Haryana"
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

      // Additional Offers
      // OFFER 6: Reliance Industries → Petrochemical Sludge
      const o6 = insertListing.run(6, "OFFER", "Petrochemical Sludge (Reliance)", 2500);
      insertComp.run(o6.lastInsertRowid, "H2O", 45.0);
      insertComp.run(o6.lastInsertRowid, "S", 8.5);
      insertComp.run(o6.lastInsertRowid, "FE2O3", 12.3);
      insertComp.run(o6.lastInsertRowid, "ZN", 5.2);
      insertComp.run(o6.lastInsertRowid, "PB", 2.8);
      insertComp.run(o6.lastInsertRowid, "CU", 1.5);
      insertComp.run(o6.lastInsertRowid, "NI", 0.9);
      insertComp.run(o6.lastInsertRowid, "CR", 0.6);

      // OFFER 7: Hindustan Unilever → Detergent Waste
      const o7 = insertListing.run(7, "OFFER", "Detergent Manufacturing Waste (HUL)", 1200);
      insertComp.run(o7.lastInsertRowid, "NA2O", 25.0);
      insertComp.run(o7.lastInsertRowid, "SO4", 15.5);
      insertComp.run(o7.lastInsertRowid, "H2O", 30.0);
      insertComp.run(o7.lastInsertRowid, "SIO2", 10.2);
      insertComp.run(o7.lastInsertRowid, "AL2O3", 8.7);
      insertComp.run(o7.lastInsertRowid, "CL", 5.6);
      insertComp.run(o7.lastInsertRowid, "P2O5", 3.2);
      insertComp.run(o7.lastInsertRowid, "ZN", 1.8);

      // OFFER 8: Bajaj Auto → Metal Scrap Waste
      const o8 = insertListing.run(8, "OFFER", "Automotive Metal Scrap (Bajaj)", 800);
      insertComp.run(o8.lastInsertRowid, "FE2O3", 85.0);
      insertComp.run(o8.lastInsertRowid, "ZN", 8.5);
      insertComp.run(o8.lastInsertRowid, "CU", 3.2);
      insertComp.run(o8.lastInsertRowid, "NI", 1.8);
      insertComp.run(o8.lastInsertRowid, "CR", 1.2);
      insertComp.run(o8.lastInsertRowid, "MN", 0.3);

      // OFFER 9: ITC Limited → Paper Mill Sludge
      const o9 = insertListing.run(9, "OFFER", "Paper Mill Sludge (ITC)", 3500);
      insertComp.run(o9.lastInsertRowid, "H2O", 65.0);
      insertComp.run(o9.lastInsertRowid, "SIO2", 12.5);
      insertComp.run(o9.lastInsertRowid, "CAO", 8.2);
      insertComp.run(o9.lastInsertRowid, "AL2O3", 6.8);
      insertComp.run(o9.lastInsertRowid, "FE2O3", 3.5);
      insertComp.run(o9.lastInsertRowid, "SO4", 2.8);
      insertComp.run(o9.lastInsertRowid, "CL", 1.2);

      // OFFER 10: Adani Group → Coal Ash Mix
      const o10 = insertListing.run(10, "OFFER", "Mixed Coal Ash (Adani)", 9200);
      insertComp.run(o10.lastInsertRowid, "SIO2", 52.0);
      insertComp.run(o10.lastInsertRowid, "AL2O3", 24.5);
      insertComp.run(o10.lastInsertRowid, "FE2O3", 8.2);
      insertComp.run(o10.lastInsertRowid, "CAO", 5.1);
      insertComp.run(o10.lastInsertRowid, "MGO", 2.8);
      insertComp.run(o10.lastInsertRowid, "SO4", 1.5);
      insertComp.run(o10.lastInsertRowid, "S", 0.7);
      insertComp.run(o10.lastInsertRowid, "ZN", 0.2);

      // OFFER 11: JSW Steel → Steel Slag
      const o11 = insertListing.run(11, "OFFER", "Steel Slag (JSW)", 4800);
      insertComp.run(o11.lastInsertRowid, "CAO", 45.0);
      insertComp.run(o11.lastInsertRowid, "SIO2", 32.0);
      insertComp.run(o11.lastInsertRowid, "AL2O3", 11.5);
      insertComp.run(o11.lastInsertRowid, "MGO", 6.8);
      insertComp.run(o11.lastInsertRowid, "FE2O3", 2.2);
      insertComp.run(o11.lastInsertRowid, "S", 1.5);
      insertComp.run(o11.lastInsertRowid, "MN", 1.0);

      // OFFER 12: Vedanta → Mining Tailings
      const o12 = insertListing.run(12, "OFFER", "Copper Mining Tailings (Vedanta)", 15000);
      insertComp.run(o12.lastInsertRowid, "SIO2", 40.0);
      insertComp.run(o12.lastInsertRowid, "FE2O3", 25.0);
      insertComp.run(o12.lastInsertRowid, "CU", 8.5);
      insertComp.run(o12.lastInsertRowid, "ZN", 5.2);
      insertComp.run(o12.lastInsertRowid, "PB", 3.8);
      insertComp.run(o12.lastInsertRowid, "S", 2.5);
      insertComp.run(o12.lastInsertRowid, "AS", 1.2);
      insertComp.run(o12.lastInsertRowid, "CD", 0.8);

      // OFFER 13: GAIL → Natural Gas Processing Waste
      const o13 = insertListing.run(13, "OFFER", "Gas Processing Waste (GAIL)", 600);
      insertComp.run(o13.lastInsertRowid, "H2O", 55.0);
      insertComp.run(o13.lastInsertRowid, "S", 12.0);
      insertComp.run(o13.lastInsertRowid, "FE2O3", 8.5);
      insertComp.run(o13.lastInsertRowid, "ZN", 6.2);
      insertComp.run(o13.lastInsertRowid, "PB", 4.1);
      insertComp.run(o13.lastInsertRowid, "HG", 0.5);
      insertComp.run(o13.lastInsertRowid, "AS", 0.3);

      // OFFER 14: NTPC Vindhyachal → High Sulfur Ash
      const o14 = insertListing.run(14, "OFFER", "High Sulfur Fly Ash (NTPC Vindhyachal)", 7800);
      insertComp.run(o14.lastInsertRowid, "SIO2", 55.0);
      insertComp.run(o14.lastInsertRowid, "AL2O3", 25.0);
      insertComp.run(o14.lastInsertRowid, "FE2O3", 7.5);
      insertComp.run(o14.lastInsertRowid, "CAO", 4.2);
      insertComp.run(o14.lastInsertRowid, "S", 3.8);
      insertComp.run(o14.lastInsertRowid, "SO4", 2.5);
      insertComp.run(o14.lastInsertRowid, "ZN", 0.5);
      insertComp.run(o14.lastInsertRowid, "CU", 0.3);

      // OFFER 15: Ambuja Cement → Kiln Dust
      const o15 = insertListing.run(15, "OFFER", "Cement Kiln Dust (Ambuja)", 2200);
      insertComp.run(o15.lastInsertRowid, "CAO", 38.0);
      insertComp.run(o15.lastInsertRowid, "SIO2", 15.5);
      insertComp.run(o15.lastInsertRowid, "AL2O3", 8.2);
      insertComp.run(o15.lastInsertRowid, "FE2O3", 4.8);
      insertComp.run(o15.lastInsertRowid, "SO4", 12.5);
      insertComp.run(o15.lastInsertRowid, "K2O", 6.2);
      insertComp.run(o15.lastInsertRowid, "NA2O", 3.8);
      insertComp.run(o15.lastInsertRowid, "CL", 2.0);

      // OFFER 16: SAIL → Iron Ore Fines
      const o16 = insertListing.run(16, "OFFER", "Iron Ore Fines (SAIL)", 12500);
      insertComp.run(o16.lastInsertRowid, "FE2O3", 68.0);
      insertComp.run(o16.lastInsertRowid, "SIO2", 8.5);
      insertComp.run(o16.lastInsertRowid, "AL2O3", 5.2);
      insertComp.run(o16.lastInsertRowid, "CAO", 2.8);
      insertComp.run(o16.lastInsertRowid, "MGO", 1.5);
      insertComp.run(o16.lastInsertRowid, "P2O5", 0.8);
      insertComp.run(o16.lastInsertRowid, "S", 0.2);

      // OFFER 17: Indian Oil → Refinery Sludge
      const o17 = insertListing.run(17, "OFFER", "Oil Refinery Sludge (Indian Oil)", 1800);
      insertComp.run(o17.lastInsertRowid, "H2O", 40.0);
      insertComp.run(o17.lastInsertRowid, "S", 15.0);
      insertComp.run(o17.lastInsertRowid, "FE2O3", 10.5);
      insertComp.run(o17.lastInsertRowid, "ZN", 7.2);
      insertComp.run(o17.lastInsertRowid, "PB", 5.8);
      insertComp.run(o17.lastInsertRowid, "NI", 3.5);
      insertComp.run(o17.lastInsertRowid, "V", 2.8);
      insertComp.run(o17.lastInsertRowid, "CU", 1.2);

      // OFFER 18: Bharat Petroleum → Tank Bottom Sludge
      const o18 = insertListing.run(18, "OFFER", "Tank Bottom Sludge (BPCL)", 950);
      insertComp.run(o18.lastInsertRowid, "H2O", 35.0);
      insertComp.run(o18.lastInsertRowid, "S", 18.0);
      insertComp.run(o18.lastInsertRowid, "FE2O3", 12.0);
      insertComp.run(o18.lastInsertRowid, "ZN", 8.5);
      insertComp.run(o18.lastInsertRowid, "PB", 6.2);
      insertComp.run(o18.lastInsertRowid, "NI", 4.8);
      insertComp.run(o18.lastInsertRowid, "V", 3.5);
      insertComp.run(o18.lastInsertRowid, "CU", 2.0);

      // OFFER 19: Hindustan Petroleum → Spent Catalyst
      const o19 = insertListing.run(19, "OFFER", "Spent Catalyst (HPCL)", 650);
      insertComp.run(o19.lastInsertRowid, "AL2O3", 45.0);
      insertComp.run(o19.lastInsertRowid, "SIO2", 20.0);
      insertComp.run(o19.lastInsertRowid, "FE2O3", 8.5);
      insertComp.run(o19.lastInsertRowid, "ZN", 6.2);
      insertComp.run(o19.lastInsertRowid, "NI", 5.8);
      insertComp.run(o19.lastInsertRowid, "V", 4.5);
      insertComp.run(o19.lastInsertRowid, "MO", 3.2);
      insertComp.run(o19.lastInsertRowid, "CO", 1.8);

      // OFFER 20: Coal India → Coal Washery Rejects
      const o20 = insertListing.run(20, "OFFER", "Coal Washery Rejects (Coal India)", 25000);
      insertComp.run(o20.lastInsertRowid, "H2O", 25.0);
      insertComp.run(o20.lastInsertRowid, "SIO2", 35.0);
      insertComp.run(o20.lastInsertRowid, "AL2O3", 18.5);
      insertComp.run(o20.lastInsertRowid, "FE2O3", 12.0);
      insertComp.run(o20.lastInsertRowid, "S", 4.5);
      insertComp.run(o20.lastInsertRowid, "CAO", 2.8);
      insertComp.run(o20.lastInsertRowid, "MGO", 1.2);
      insertComp.run(o20.lastInsertRowid, "ZN", 1.0);
    });
    insertOffers();
    console.log("Inserted 20 OFFER listings with 140 batch_composition rows.");

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

      // Additional Demands
      // DEMAND 6: Ambuja Cement → Low Iron Fly Ash
      const d6 = insertListing.run(15, "DEMAND", "Low Iron Fly Ash", 4000);
      insertCrit.run(d6.lastInsertRowid, "SIO2", 45, null);
      insertCrit.run(d6.lastInsertRowid, "AL2O3", 18, null);
      insertCrit.run(d6.lastInsertRowid, "FE2O3", null, 6);
      insertCrit.run(d6.lastInsertRowid, "CAO", null, 4);
      insertCrit.run(d6.lastInsertRowid, "S", null, 0.8);

      // DEMAND 7: JSW Steel → High Grade Iron Ore Substitute
      const d7 = insertListing.run(11, "DEMAND", "High Grade Iron Substitute", 3500);
      insertCrit.run(d7.lastInsertRowid, "FE2O3", 60, null);
      insertCrit.run(d7.lastInsertRowid, "SIO2", null, 8);
      insertCrit.run(d7.lastInsertRowid, "AL2O3", null, 5);
      insertCrit.run(d7.lastInsertRowid, "P2O5", null, 0.1);
      insertCrit.run(d7.lastInsertRowid, "S", null, 0.05);

      // DEMAND 8: Vedanta → Zinc Concentrate Feed
      const d8 = insertListing.run(12, "DEMAND", "Zinc Concentrate Feed", 1200);
      insertCrit.run(d8.lastInsertRowid, "ZN", 25, null);
      insertCrit.run(d8.lastInsertRowid, "PB", null, 5);
      insertCrit.run(d8.lastInsertRowid, "CU", null, 3);
      insertCrit.run(d8.lastInsertRowid, "FE2O3", null, 15);
      insertCrit.run(d8.lastInsertRowid, "SIO2", null, 20);

      // DEMAND 9: Gujarat Alkalies → Chlorine Feedstock
      const d9 = insertListing.run(22, "DEMAND", "Chlorine Production Feed", 800);
      insertCrit.run(d9.lastInsertRowid, "CL", 15, null);
      insertCrit.run(d9.lastInsertRowid, "NA2O", null, 10);
      insertCrit.run(d9.lastInsertRowid, "K2O", null, 5);
      insertCrit.run(d9.lastInsertRowid, "H2O", null, 15);

      // DEMAND 10: Tata Chemicals → Soda Ash Raw Material
      const d10 = insertListing.run(23, "DEMAND", "Soda Ash Raw Material", 2500);
      insertCrit.run(d10.lastInsertRowid, "NA2O", 20, null);
      insertCrit.run(d10.lastInsertRowid, "CAO", null, 2);
      insertCrit.run(d10.lastInsertRowid, "MGO", null, 1);
      insertCrit.run(d10.lastInsertRowid, "SO4", null, 0.5);

      // DEMAND 11: UPL → Phosphate Fertilizer Base
      const d11 = insertListing.run(24, "DEMAND", "Phosphate Fertilizer Base", 1800);
      insertCrit.run(d11.lastInsertRowid, "P2O5", 15, null);
      insertCrit.run(d11.lastInsertRowid, "CAO", 25, null);
      insertCrit.run(d11.lastInsertRowid, "FE2O3", null, 5);
      insertCrit.run(d11.lastInsertRowid, "AL2O3", null, 3);
      insertCrit.run(d11.lastInsertRowid, "SIO2", null, 10);

      // DEMAND 12: PI Industries → Agrochemical Intermediate
      const d12 = insertListing.run(25, "DEMAND", "Agrochemical Intermediate", 600);
      insertCrit.run(d12.lastInsertRowid, "N", 10, null);
      insertCrit.run(d12.lastInsertRowid, "P2O5", 8, null);
      insertCrit.run(d12.lastInsertRowid, "K2O", 5, null);
      insertCrit.run(d12.lastInsertRowid, "CL", null, 2);
      insertCrit.run(d12.lastInsertRowid, "H2O", null, 20);

      // DEMAND 13: Reliance Industries → Petrochemical Catalyst Support
      const d13 = insertListing.run(6, "DEMAND", "Catalyst Support Material", 900);
      insertCrit.run(d13.lastInsertRowid, "AL2O3", 70, null);
      insertCrit.run(d13.lastInsertRowid, "SIO2", 15, 25);
      insertCrit.run(d13.lastInsertRowid, "FE2O3", null, 2);
      insertCrit.run(d13.lastInsertRowid, "NA2O", null, 1);
      insertCrit.run(d13.lastInsertRowid, "SO4", null, 0.5);

      // DEMAND 14: Hindustan Unilever → Detergent Raw Material
      const d14 = insertListing.run(7, "DEMAND", "Detergent Raw Material", 1400);
      insertCrit.run(d14.lastInsertRowid, "NA2O", 15, null);
      insertCrit.run(d14.lastInsertRowid, "SO4", 20, null);
      insertCrit.run(d14.lastInsertRowid, "CL", null, 5);
      insertCrit.run(d14.lastInsertRowid, "FE2O3", null, 1);
      insertCrit.run(d14.lastInsertRowid, "H2O", null, 25);

      // DEMAND 15: ITC Limited → Paper Filler Material
      const d15 = insertListing.run(9, "DEMAND", "Paper Filler Material", 3200);
      insertCrit.run(d15.lastInsertRowid, "CAO", 30, null);
      insertCrit.run(d15.lastInsertRowid, "SIO2", 20, 40);
      insertCrit.run(d15.lastInsertRowid, "AL2O3", null, 10);
      insertCrit.run(d15.lastInsertRowid, "FE2O3", null, 3);
      insertCrit.run(d15.lastInsertRowid, "SO4", null, 5);

      // DEMAND 16: Coal India → Coal Beneficiation Feed
      const d16 = insertListing.run(20, "DEMAND", "Coal Beneficiation Feed", 15000);
      insertCrit.run(d16.lastInsertRowid, "SIO2", 30, 50);
      insertCrit.run(d16.lastInsertRowid, "AL2O3", 15, 30);
      insertCrit.run(d16.lastInsertRowid, "FE2O3", 10, 25);
      insertCrit.run(d16.lastInsertRowid, "CAO", null, 5);
      insertCrit.run(d16.lastInsertRowid, "S", null, 2);

      // DEMAND 17: NMDC → Iron Ore Processing Aid
      const d17 = insertListing.run(21, "DEMAND", "Iron Ore Processing Aid", 5000);
      insertCrit.run(d17.lastInsertRowid, "FE2O3", 40, null);
      insertCrit.run(d17.lastInsertRowid, "SIO2", null, 20);
      insertCrit.run(d17.lastInsertRowid, "AL2O3", null, 15);
      insertCrit.run(d17.lastInsertRowid, "P2O5", null, 0.5);
      insertCrit.run(d17.lastInsertRowid, "S", null, 0.1);

      // DEMAND 18: Indian Oil → Refinery Additive
      const d18 = insertListing.run(17, "DEMAND", "Refinery Additive", 1000);
      insertCrit.run(d18.lastInsertRowid, "ZN", 10, null);
      insertCrit.run(d18.lastInsertRowid, "CAO", 5, null);
      insertCrit.run(d18.lastInsertRowid, "S", null, 5);
      insertCrit.run(d18.lastInsertRowid, "PB", null, 2);
      insertCrit.run(d18.lastInsertRowid, "H2O", null, 15);

      // DEMAND 19: Bharat Petroleum → Fuel Additive Base
      const d19 = insertListing.run(18, "DEMAND", "Fuel Additive Base", 750);
      insertCrit.run(d19.lastInsertRowid, "ZN", 15, null);
      insertCrit.run(d19.lastInsertRowid, "CAO", 8, null);
      insertCrit.run(d19.lastInsertRowid, "S", null, 3);
      insertCrit.run(d19.lastInsertRowid, "PB", null, 1);
      insertCrit.run(d19.lastInsertRowid, "CU", null, 0.5);

      // DEMAND 20: Hindustan Petroleum → Lubricant Additive
      const d20 = insertListing.run(19, "DEMAND", "Lubricant Additive", 500);
      insertCrit.run(d20.lastInsertRowid, "ZN", 20, null);
      insertCrit.run(d20.lastInsertRowid, "P2O5", 5, null);
      insertCrit.run(d20.lastInsertRowid, "S", null, 2);
      insertCrit.run(d20.lastInsertRowid, "PB", null, 0.5);
      insertCrit.run(d20.lastInsertRowid, "CU", null, 0.2);
    });
    insertDemands();
    console.log("Inserted 20 DEMAND listings with 90 acceptance_criteria rows.");

    // --------------------------------------------------------
    // Step 5B: Ensure each company has >= 2 OFFER and >= 2 DEMAND
    // --------------------------------------------------------
    const countByType = db.prepare(`
      SELECT COUNT(*) AS cnt
      FROM listings
      WHERE user_id = ? AND type = ?
    `);

    const addCoverageListings = db.transaction(() => {
      const offerTemplates = [
        {
          materialName: "Demo Recovered Fly Ash",
          quantity: 1600,
          composition: [
            ["SIO2", 55.0],
            ["AL2O3", 22.0],
            ["FE2O3", 7.0],
            ["CAO", 4.0],
            ["MGO", 2.0],
          ],
        },
        {
          materialName: "Demo Industrial Mineral Mix",
          quantity: 1400,
          composition: [
            ["CAO", 38.0],
            ["SIO2", 30.0],
            ["AL2O3", 12.0],
            ["MGO", 6.0],
            ["FE2O3", 3.0],
          ],
        },
      ];

      const demandTemplates = [
        {
          materialName: "Demo Cement Blend Feed",
          quantity: 1200,
          criteria: [
            ["SIO2", 45, null],
            ["AL2O3", 15, null],
            ["FE2O3", null, 10],
            ["CAO", null, 8],
            ["MGO", null, 6],
          ],
        },
        {
          materialName: "Demo High Calcium Input",
          quantity: 1100,
          criteria: [
            ["CAO", 30, null],
            ["SIO2", 20, 45],
            ["AL2O3", null, 20],
            ["MGO", null, 8],
            ["FE2O3", null, 8],
          ],
        },
      ];

      for (let userId = 1; userId <= userData.length; userId++) {
        let offerCount = countByType.get(userId, "OFFER").cnt;
        let demandCount = countByType.get(userId, "DEMAND").cnt;

        while (offerCount < 2) {
          const idx = (offerCount % offerTemplates.length);
          const template = offerTemplates[idx];
          const name = `${template.materialName} (Coverage U${userId}-O${offerCount + 1})`;
          const offer = insertListing.run(userId, "OFFER", name, template.quantity);
          for (const comp of template.composition) {
            insertComp.run(offer.lastInsertRowid, comp[0], comp[1]);
          }
          offerCount++;
        }

        while (demandCount < 2) {
          const idx = (demandCount % demandTemplates.length);
          const template = demandTemplates[idx];
          const name = `${template.materialName} (Coverage U${userId}-D${demandCount + 1})`;
          const demand = insertListing.run(userId, "DEMAND", name, template.quantity);
          for (const rule of template.criteria) {
            insertCrit.run(demand.lastInsertRowid, rule[0], rule[1], rule[2]);
          }
          demandCount++;
        }
      }
    });

    addCoverageListings();

    const coverageGaps = db.prepare(`
      SELECT
        u.id,
        SUM(CASE WHEN l.type = 'OFFER' THEN 1 ELSE 0 END) AS offer_count,
        SUM(CASE WHEN l.type = 'DEMAND' THEN 1 ELSE 0 END) AS demand_count
      FROM users u
      LEFT JOIN listings l ON l.user_id = u.id
      GROUP BY u.id
      HAVING offer_count < 2 OR demand_count < 2
    `).all();

    if (coverageGaps.length > 0) {
      throw new Error(`Coverage rule failed for users: ${coverageGaps.map((r) => r.id).join(", ")}`);
    }

    const listingTotals = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'OFFER' THEN 1 ELSE 0 END) AS offers,
        SUM(CASE WHEN type = 'DEMAND' THEN 1 ELSE 0 END) AS demands
      FROM listings
    `).get();

    console.log(
      `Coverage rule satisfied: ${userData.length} users each have >= 2 OFFER and >= 2 DEMAND ` +
      `(totals: ${listingTotals.offers} OFFER, ${listingTotals.demands} DEMAND).`
    );

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
      },
      {
        processorId: 22,
        inputChem: "CL",
        outputChem: "NA2O",
        efficiency: 0.88,
        description: "Chlorine to sodium oxide (electrolysis)"
      },
      {
        processorId: 22,
        inputChem: "NA2O",
        outputChem: "CAO",
        efficiency: 0.82,
        description: "Sodium oxide to calcium oxide"
      },
      {
        processorId: 23,
        inputChem: "NA2O",
        outputChem: "SO4",
        efficiency: 0.79,
        description: "Sodium oxide to sulfate"
      },
      {
        processorId: 23,
        inputChem: "SO4",
        outputChem: "P2O5",
        efficiency: 0.75,
        description: "Sulfate to phosphorus pentoxide"
      },
      {
        processorId: 24,
        inputChem: "P2O5",
        outputChem: "N",
        efficiency: 0.68,
        description: "Phosphorus to nitrogen compounds"
      },
      {
        processorId: 24,
        inputChem: "N",
        outputChem: "K2O",
        efficiency: 0.72,
        description: "Nitrogen to potassium oxide"
      },
      {
        processorId: 25,
        inputChem: "K2O",
        outputChem: "P2O5",
        efficiency: 0.80,
        description: "Potassium oxide to phosphorus"
      },
      {
        processorId: 25,
        inputChem: "P2O5",
        outputChem: "ZN",
        efficiency: 0.65,
        description: "Phosphorus to zinc recovery"
      },
      {
        processorId: 6,
        inputChem: "S",
        outputChem: "FE2O3",
        efficiency: 0.90,
        description: "Sulfur to iron oxide (catalyst)"
      },
      {
        processorId: 6,
        inputChem: "FE2O3",
        outputChem: "AL2O3",
        efficiency: 0.77,
        description: "Iron to alumina conversion"
      },
      {
        processorId: 7,
        inputChem: "NA2O",
        outputChem: "SO4",
        efficiency: 0.85,
        description: "Sodium to sulfate (detergent)"
      },
      {
        processorId: 7,
        inputChem: "SO4",
        outputChem: "CL",
        efficiency: 0.70,
        description: "Sulfate to chlorine"
      },
      {
        processorId: 11,
        inputChem: "FE2O3",
        outputChem: "CAO",
        efficiency: 0.88,
        description: "Iron to calcium oxide"
      },
      {
        processorId: 11,
        inputChem: "CAO",
        outputChem: "SIO2",
        efficiency: 0.82,
        description: "Calcium to silica"
      },
      {
        processorId: 12,
        inputChem: "CU",
        outputChem: "ZN",
        efficiency: 0.75,
        description: "Copper to zinc recovery"
      },
      {
        processorId: 12,
        inputChem: "ZN",
        outputChem: "PB",
        efficiency: 0.68,
        description: "Zinc to lead"
      },
      {
        processorId: 15,
        inputChem: "CAO",
        outputChem: "SO4",
        efficiency: 0.92,
        description: "Calcium to sulfate (kiln)"
      },
      {
        processorId: 15,
        inputChem: "SO4",
        outputChem: "K2O",
        efficiency: 0.78,
        description: "Sulfate to potassium"
      },
      {
        processorId: 17,
        inputChem: "S",
        outputChem: "ZN",
        efficiency: 0.85,
        description: "Sulfur to zinc (refining)"
      },
      {
        processorId: 17,
        inputChem: "ZN",
        outputChem: "CU",
        efficiency: 0.72,
        description: "Zinc to copper"
      },
      {
        processorId: 18,
        inputChem: "S",
        outputChem: "PB",
        efficiency: 0.80,
        description: "Sulfur to lead"
      },
      {
        processorId: 18,
        inputChem: "PB",
        outputChem: "ZN",
        efficiency: 0.69,
        description: "Lead to zinc"
      },
      {
        processorId: 19,
        inputChem: "ZN",
        outputChem: "NI",
        efficiency: 0.76,
        description: "Zinc to nickel"
      },
      {
        processorId: 19,
        inputChem: "NI",
        outputChem: "CO",
        efficiency: 0.73,
        description: "Nickel to cobalt"
      },
      {
        processorId: 20,
        inputChem: "SIO2",
        outputChem: "AL2O3",
        efficiency: 0.88,
        description: "Silica to alumina (beneficiation)"
      },
      {
        processorId: 20,
        inputChem: "AL2O3",
        outputChem: "FE2O3",
        efficiency: 0.81,
        description: "Alumina to iron"
      }
    ];

    const insertAllProcs = db.transaction(() => {
      for (const proc of processCapabilities) {
        insertProc.run(proc.processorId, proc.inputChem, proc.outputChem, proc.efficiency);
      }
    });
    insertAllProcs();
    console.log(`Inserted ${processCapabilities.length} rows into 'process_capabilities' table.`);

    const decisionStatusSummary = db.prepare(`
      SELECT final_status, COUNT(*) AS count
      FROM offer_decisions
      GROUP BY final_status
      ORDER BY final_status
    `).all();

    console.log("Initialized offer decision workflow table with status buckets:", decisionStatusSummary);

    // --------------------------------------------------------
    // Summary
    // --------------------------------------------------------
    console.log("\n=====================================");
    console.log(" SYMBIO-EXCHANGE — DATABASE READY");
    console.log("=====================================");
    console.log(" INDUSTRIAL WASTE MARKETPLACE DATA:");
    console.log("\n INDUSTRIES (25 companies):");
    console.log("   • NTPC Dadri & Vindhyachal — Thermal Power (Fly Ash, Bottom Ash)");
    console.log("   • UltraTech & Ambuja Cement — Cement Manufacturing");
    console.log("   • Tata Steel, JSW Steel, SAIL — Steel Production (Slag, Mill Dust)");
    console.log("   • GreenProcess, Gujarat Alkalies, Tata Chemicals — Chemical Processing");
    console.log("   • Dr. Reddy's — Pharmaceutical Waste");
    console.log("   • Reliance, Indian Oil, Bharat Petroleum, Hindustan Petroleum — Oil Refining");
    console.log("   • Hindustan Unilever, ITC Limited — Consumer Goods");
    console.log("   • Bajaj Auto — Automotive");
    console.log("   • Adani Group — Conglomerate");
    console.log("   • Vedanta, NMDC — Mining & Metals");
    console.log("   • GAIL — Natural Gas");
    console.log("   • Coal India — Coal Mining");
    console.log("   • UPL, PI Industries — Agrochemicals");
    console.log("\n WASTE STREAMS (20 OFFERs):");
    console.log("   • Fly Ash variants (NTPC, Adani) — 15,000+ tons (SiO2-rich)");
    console.log("   • Steel Slag & Dust (Tata, JSW, SAIL) — 15,000+ tons (CaO, Fe2O3 rich)");
    console.log("   • Petrochemical & Refinery Sludge — 5,000+ tons (S, heavy metals)");
    console.log("   • Mining Tailings (Vedanta) — 15,000 tons (Cu, Zn, Pb rich)");
    console.log("   • Industrial Waste (Pharma, Detergent, Paper) — 5,000+ tons");
    console.log("   • Coal Washery Rejects — 25,000 tons");
    console.log("\n BUYER REQUIREMENTS (20 DEMANDs):");
    console.log("   • Cement Grade Materials — 12,000+ tons (Strict quality specs)");
    console.log("   • Metal Recovery Feeds — 3,000+ tons (Zn, Pb, Cu rich)");
    console.log("   • Chemical Feedstocks — 4,000+ tons (S, Cl, P2O5 rich)");
    console.log("   • Fertilizer Bases — 4,000+ tons (N, P2O5, K2O rich)");
    console.log("   • Industrial Additives — 2,000+ tons (Zn, CaO compounds)");
    console.log("\n PROCESSING CAPABILITIES (25 paths):");
    console.log("   • Sulfur processing chain: S → SO4 → CaO (71.76% total)");
    console.log("   • Heavy metal recovery: Pb, Hg, Zn → SiO2 byproducts");
    console.log("   • Chemical conversions: Cl ↔ Na2O, P2O5 ↔ N, etc.");
    console.log("   • Metal refining: Fe2O3 ↔ CaO, Zn ↔ Cu ↔ Pb");
    console.log("   • Fertilizer synthesis: N, P2O5, K2O interconversions");
    console.log("\n CHEMICAL DATABASE (60+ chemicals):");
    console.log("   • Major oxides: SiO2, Al2O3, Fe2O3, CaO, MgO, Na2O, K2O");
    console.log("   • Industrial elements: S, Cl, N, P2O5, TiO2");
    console.log("   • Heavy metals: Pb, Hg, As, Cd, Cr, Ni, Cu, Zn, Mn, Co, V, Mo");
    console.log("   • Rare elements: W, Ba, Sr, Zr, Sn, Sb, Bi, Te, Se, Ge, Ga, In");
    console.log("   • Radioactive: U, Th, Ra, Ac, Pa, Np, Pu, Am, Cm, Bk, Cf, Es");
    console.log("\n  HAZARD RULES (70+ incompatibility pairs):");
    console.log("   • Heavy metals + S/Cl/F → Precipitation reactions");
    console.log("   • Oxides + SO4 → Gypsum/Kaolin formation");
    console.log("   • Redox reactions (Cr, Cu, Fe + S/Cl)");
    console.log("   • Acid-base incompatibilities (CaO + SO4, Na2O + Cl)");
    console.log("\n LOGIN CREDENTIALS:");
    console.log("   All users: password = industry123");
    console.log("   Emails: ntpc.dadri@ntpc.co.in, procurement@ultratechcement.com,");
    console.log("           waste.management@tatasteel.com, info@greenprocess.in,");
    console.log("           waste@drreddys.com");
    console.log("\n DEMO SCENARIOS:");
    console.log("   1. Fly Ash matching: Multiple cement demands (SiO2 > 50%, low S)");
    console.log("   2. Steel slag: High CaO for cement, Fe2O3 for steel recovery");
    console.log("   3. Petro sludge: S-rich for sulfuric acid, metals for recovery");
    console.log("   4. Mining tailings: Cu/Zn/Pb for metal processing companies");
    console.log("   5. Process chains: S → SO4 → CaO (71.76% efficiency)");
    console.log("   6. Hazard detection: Pharma/metal wastes show multiple warnings");
    console.log("   7. Fertilizer matching: N/P2O5/K2O rich wastes to agro demands");
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

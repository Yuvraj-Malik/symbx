# ⚙️ Config — Database Configuration

**Database setup and schema definitions for Symbio-Exchange**

---

## 📁 Files Overview

| File | Purpose | Key Features |
|------|---------|-------------|
| `database.js` | SQLite connection setup | better-sqlite3, foreign keys, WAL mode |
| `schema.sql` | Complete database schema | 7 tables, 309 lines, fully documented |
| `initDb.js` | Database initialization | Reads schema.sql, creates tables |

---

## 🗄️ Database Setup

### Connection (`database.js`)
```javascript
const Database = require("better-sqlite3");
const db = new Database(process.env.DB_STORAGE || "database.sqlite");

// Performance and safety settings
db.pragma("journal_mode = WAL");      // Better concurrent access
db.pragma("foreign_keys = ON");       // Enforce referential integrity
```

**Key Features:**
- **Synchronous operations** with `better-sqlite3`
- **Foreign key enforcement** for data integrity
- **WAL mode** for better performance
- **Environment-based** database path

---

## 📋 Schema (`schema.sql`)

### Design Philosophy
- **Explicit constraints**: Every PK, FK, CHECK, UNIQUE documented
- **Self-documenting**: Extensive comments for each table/column
- **Production-ready**: Indexes, defaults, proper data types
- **DBMS-friendly**: Compatible with PostgreSQL (minor tweaks)

### Tables Overview

```sql
-- 1. users — Industries/factories on the platform
CREATE TABLE users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    industry_type   TEXT NOT NULL,
    location        TEXT DEFAULT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. chemicals — Master chemical lookup
CREATE TABLE chemicals (
    id              TEXT PRIMARY KEY,        -- PB, SIO2, etc.
    name            TEXT NOT NULL,
    hazard_level    TEXT NOT NULL DEFAULT 'LOW'
        CHECK (hazard_level IN ('LOW', 'MEDIUM', 'HIGH'))
);

-- 3. listings — OFFER/DEMAND posts (transactional core)
CREATE TABLE listings (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('OFFER', 'DEMAND')),
    material_name   TEXT NOT NULL,
    total_quantity  REAL NOT NULL CHECK (total_quantity > 0),
    status          TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CLOSED', 'EXPIRED')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. batch_composition — What's inside waste streams
CREATE TABLE batch_composition (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id      INTEGER NOT NULL,
    chem_id         TEXT NOT NULL,
    percentage      REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    UNIQUE (listing_id, chem_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT
);

-- 5. acceptance_criteria — Buyer constraints
CREATE TABLE acceptance_criteria (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id       INTEGER NOT NULL,
    chem_id          TEXT NOT NULL,
    min_percentage   REAL DEFAULT NULL CHECK (min_percentage IS NULL OR min_percentage >= 0),
    max_percentage   REAL DEFAULT NULL CHECK (max_percentage IS NULL OR max_percentage <= 100),
    CHECK (min_percentage IS NULL OR max_percentage IS NULL OR min_percentage <= max_percentage),
    UNIQUE (listing_id, chem_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT
);

-- 6. hazard_matrix — Chemical incompatibility rules
CREATE TABLE hazard_matrix (
    chem_id_1        TEXT NOT NULL,
    chem_id_2        TEXT NOT NULL,
    is_incompatible  INTEGER NOT NULL DEFAULT 0 CHECK (is_incompatible IN (0, 1)),
    PRIMARY KEY (chem_id_1, chem_id_2),
    CHECK (chem_id_1 < chem_id_2),  -- Prevent duplicate pairs
    FOREIGN KEY (chem_id_1) REFERENCES chemicals(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id_2) REFERENCES chemicals(id) ON DELETE CASCADE
);

-- 7. process_capabilities — Processing graph
CREATE TABLE process_capabilities (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    processor_id            INTEGER NOT NULL,
    input_chem_id           TEXT NOT NULL,
    output_chem_id          TEXT NOT NULL,
    conversion_efficiency   REAL NOT NULL CHECK (conversion_efficiency >= 0 AND conversion_efficiency <= 1),
    CHECK (input_chem_id != output_chem_id),
    UNIQUE (processor_id, input_chem_id, output_chem_id),
    FOREIGN KEY (processor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (input_chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT,
    FOREIGN KEY (output_chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT
);
```

### Performance Indexes
```sql
-- 11 indexes for optimal query performance
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_batch_comp_listing ON batch_composition(listing_id);
CREATE INDEX idx_batch_comp_chem ON batch_composition(chem_id);
CREATE INDEX idx_accept_crit_listing ON acceptance_criteria(listing_id);
CREATE INDEX idx_accept_crit_chem ON acceptance_criteria(chem_id);
CREATE INDEX idx_proc_cap_processor ON process_capabilities(processor_id);
CREATE INDEX idx_proc_cap_input ON process_capabilities(input_chem_id);
CREATE INDEX idx_proc_cap_output ON process_capabilities(output_chem_id);
```

---

## 🚀 Initialization (`initDb.js`)

Simple but effective database setup:

```javascript
const fs = require("fs");
const path = require("path");
const db = require("./database");

function initDb() {
  const schema = fs.readFileSync(
    path.join(__dirname, "schema.sql"), 
    "utf8"
  );
  db.exec(schema);
  console.log("Database initialized — all 7 tables ready.");
}

module.exports = initDb;
```

**Usage in server:**
```javascript
// index.js
const initDb = require("./config/initDb");
initDb(); // Creates all tables from schema.sql
```

---

## 🔧 Configuration Details

### Foreign Key Behavior
- **CASCADE**: Delete dependent records (users → listings)
- **RESTRICT**: Prevent deletion if referenced (chemicals in use)

### Check Constraints
- **Hazard levels**: Only LOW/MEDIUM/HIGH allowed
- **Percentages**: Must be between 0-100
- **Quantities**: Must be positive
- **Email**: Unique constraint enforced

### Defaults
- **Timestamps**: `datetime('now')` for created_at
- **Status**: 'ACTIVE' for new listings
- **Hazard level**: 'LOW' default for chemicals

---

## 📊 Schema Statistics

| Metric | Value |
|--------|-------|
| Tables | 7 |
| Columns | 28 total |
| Foreign Keys | 8 |
| Check Constraints | 12 |
| Unique Constraints | 4 |
| Indexes | 11 |
| Lines of SQL | 309 |

---

## 🔄 Migration Notes

### From Sequelize to Raw SQL
- **Model definitions** → `CREATE TABLE` statements
- **Associations** → Explicit `FOREIGN KEY` constraints
- **Validations** → `CHECK` constraints
- **Indexes** → Explicit `CREATE INDEX` statements

### PostgreSQL Compatibility
Minimal changes needed:
- Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`
- Replace `datetime('now')` with `NOW()`
- Adjust string lengths if desired

---

## 🧪 Testing the Schema

```sql
-- Test foreign key enforcement
INSERT INTO listings (user_id, type, material_name, total_quantity)
VALUES (999, 'OFFER', 'Test', 100);
-- → Error: FOREIGN KEY constraint failed

-- Test check constraints
INSERT INTO chemicals (id, name, hazard_level)
VALUES ('TEST', 'Test Chemical', 'INVALID');
-- → Error: CHECK constraint failed

-- Test unique constraints
INSERT INTO users (name, email, password_hash, industry_type)
VALUES ('Test', 'ntpc@example.com', 'hash', 'Test');
-- → Error: UNIQUE constraint failed
```

---

**Designed for clarity, performance, and educational value**

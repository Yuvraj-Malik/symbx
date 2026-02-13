-- ============================================================
-- SYMBIO-EXCHANGE DATABASE SCHEMA
-- Industrial Symbiosis Marketplace — Full Relational Schema
--
-- Database : SQLite 3 (compatible with PostgreSQL with minor tweaks)
-- Tables   : 7
-- Author   : Symbio-Exchange Team
-- ============================================================
--
-- TABLE SUMMARY:
-- ┌─────────────────────────┬──────────────────────────────────────────────┐
-- │ Table Name              │ Purpose                                      │
-- ├─────────────────────────┼──────────────────────────────────────────────┤
-- │ 1. users                │ Industries / factories on the platform       │
-- │ 2. chemicals            │ Master lookup of chemical compounds          │
-- │ 3. listings             │ OFFER or DEMAND posts by users               │
-- │ 4. batch_composition    │ What chemicals are inside a waste stream     │
-- │ 5. acceptance_criteria  │ Buyer's min/max constraints on chemicals     │
-- │ 6. hazard_matrix        │ Incompatible chemical pairs (safety rules)   │
-- │ 7. process_capabilities │ Processor conversion graph (A → C → B)      │
-- └─────────────────────────┴──────────────────────────────────────────────┘
--
-- RELATIONSHIP MAP:
--   users ──(1:N)──> listings
--   listings ──(1:N)──> batch_composition ──(N:1)──> chemicals
--   listings ──(1:N)──> acceptance_criteria ──(N:1)──> chemicals
--   chemicals ──(M:N)──> chemicals  (via hazard_matrix)
--   users ──(1:N)──> process_capabilities ──(N:1)──> chemicals (input & output)
--
-- ============================================================


-- ============================================================
-- TABLE 1: users
-- ============================================================
-- Stores all registered industries/factories.
--
-- COLUMNS:
--   id             INTEGER   — Primary Key, Auto-Increment
--   name           TEXT      — Company name, NOT NULL
--   email          TEXT      — Unique login email, NOT NULL, UNIQUE
--   password_hash  TEXT      — bcrypt hashed password, NOT NULL
--   industry_type  TEXT      — e.g. Thermal, Cement, Steel, NOT NULL
--   location       TEXT      — City/state, NULLABLE
--   created_at     TEXT      — ISO timestamp, DEFAULT CURRENT_TIMESTAMP
--
-- CONSTRAINTS:
--   PK: id
--   UNIQUE: email
--   NOT NULL: name, email, password_hash, industry_type
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    name            TEXT        NOT NULL,
    email           TEXT        NOT NULL    UNIQUE,
    password_hash   TEXT        NOT NULL,
    industry_type   TEXT        NOT NULL,
    location        TEXT        DEFAULT NULL,
    created_at      TEXT        NOT NULL    DEFAULT (datetime('now'))
);


-- ============================================================
-- TABLE 2: chemicals
-- ============================================================
-- Master lookup table for all chemical compounds.
-- Used by dropdowns on the frontend and referenced by
-- batch_composition, acceptance_criteria, hazard_matrix,
-- and process_capabilities.
--
-- COLUMNS:
--   id             TEXT(10)  — Short code like 'PB', 'SIO2', Primary Key
--   name           TEXT      — Human-readable name, NOT NULL
--   hazard_level   TEXT      — 'LOW', 'MEDIUM', or 'HIGH', NOT NULL
--
-- CONSTRAINTS:
--   PK: id
--   NOT NULL: name, hazard_level
--   CHECK: hazard_level must be one of ('LOW','MEDIUM','HIGH')
-- ============================================================
CREATE TABLE IF NOT EXISTS chemicals (
    id              TEXT        PRIMARY KEY,
    name            TEXT        NOT NULL,
    hazard_level    TEXT        NOT NULL    DEFAULT 'LOW'
        CHECK (hazard_level IN ('LOW', 'MEDIUM', 'HIGH'))
);


-- ============================================================
-- TABLE 3: listings
-- ============================================================
-- An OFFER ("I have this waste") or DEMAND ("I need this material")
-- posted by a user. This is the central transactional table.
--
-- COLUMNS:
--   id              INTEGER  — Primary Key, Auto-Increment
--   user_id         INTEGER  — FK → users(id), NOT NULL
--   type            TEXT     — 'OFFER' or 'DEMAND', NOT NULL
--   material_name   TEXT     — e.g. "Fly Ash", "Blast Furnace Slag", NOT NULL
--   total_quantity  REAL     — Quantity in tons, NOT NULL, must be > 0
--   status          TEXT     — 'ACTIVE', 'CLOSED', or 'EXPIRED', NOT NULL
--   created_at      TEXT     — ISO timestamp, DEFAULT CURRENT_TIMESTAMP
--
-- CONSTRAINTS:
--   PK: id
--   FK: user_id → users(id) ON DELETE CASCADE
--   NOT NULL: user_id, type, material_name, total_quantity, status
--   CHECK: type must be 'OFFER' or 'DEMAND'
--   CHECK: status must be 'ACTIVE', 'CLOSED', or 'EXPIRED'
--   CHECK: total_quantity > 0
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER     NOT NULL,
    type            TEXT        NOT NULL
        CHECK (type IN ('OFFER', 'DEMAND')),
    material_name   TEXT        NOT NULL,
    total_quantity  REAL        NOT NULL
        CHECK (total_quantity > 0),
    status          TEXT        NOT NULL    DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'CLOSED', 'EXPIRED')),
    created_at      TEXT        NOT NULL    DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- ============================================================
-- TABLE 4: batch_composition
-- ============================================================
-- The 1-to-Many "Composition" link.
-- Each row says: "Listing #X contains Y% of Chemical Z."
-- An OFFER listing typically has 3–10 composition rows.
--
-- COLUMNS:
--   id             INTEGER  — Primary Key, Auto-Increment
--   listing_id     INTEGER  — FK → listings(id), NOT NULL
--   chem_id        TEXT     — FK → chemicals(id), NOT NULL
--   percentage     REAL     — 0.00 to 100.00, NOT NULL
--
-- CONSTRAINTS:
--   PK: id
--   FK: listing_id → listings(id) ON DELETE CASCADE
--   FK: chem_id → chemicals(id) ON DELETE RESTRICT
--   NOT NULL: listing_id, chem_id, percentage
--   CHECK: percentage BETWEEN 0 AND 100
--   UNIQUE: (listing_id, chem_id) — one entry per chemical per listing
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_composition (
    id              INTEGER     PRIMARY KEY AUTOINCREMENT,
    listing_id      INTEGER     NOT NULL,
    chem_id         TEXT        NOT NULL,
    percentage      REAL        NOT NULL
        CHECK (percentage >= 0 AND percentage <= 100),

    UNIQUE (listing_id, chem_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id)    REFERENCES chemicals(id) ON DELETE RESTRICT
);


-- ============================================================
-- TABLE 5: acceptance_criteria
-- ============================================================
-- The "Constraint" link — buyer-side rules on a DEMAND listing.
-- Each row says: "For Demand #X, Chemical Z must be between min% and max%."
--
-- This is the FILTER table. The SQL challenge is to check if a
-- seller's batch_composition fits inside a buyer's acceptance_criteria
-- using JOINs + GROUP BY + HAVING COUNT.
--
-- COLUMNS:
--   id               INTEGER  — Primary Key, Auto-Increment
--   listing_id       INTEGER  — FK → listings(id), NOT NULL (must be DEMAND)
--   chem_id          TEXT     — FK → chemicals(id), NOT NULL
--   min_percentage   REAL     — Lower bound (NULL = no lower bound)
--   max_percentage   REAL     — Upper bound (NULL = no upper bound)
--
-- CONSTRAINTS:
--   PK: id
--   FK: listing_id → listings(id) ON DELETE CASCADE
--   FK: chem_id → chemicals(id) ON DELETE RESTRICT
--   NOT NULL: listing_id, chem_id
--   CHECK: min_percentage >= 0 (when not NULL)
--   CHECK: max_percentage <= 100 (when not NULL)
--   CHECK: min_percentage <= max_percentage (when both are set)
--   UNIQUE: (listing_id, chem_id) — one criterion per chemical per listing
-- ============================================================
CREATE TABLE IF NOT EXISTS acceptance_criteria (
    id               INTEGER    PRIMARY KEY AUTOINCREMENT,
    listing_id       INTEGER    NOT NULL,
    chem_id          TEXT       NOT NULL,
    min_percentage   REAL       DEFAULT NULL
        CHECK (min_percentage IS NULL OR min_percentage >= 0),
    max_percentage   REAL       DEFAULT NULL
        CHECK (max_percentage IS NULL OR max_percentage <= 100),

    -- Ensure min <= max when both are provided
    CHECK (
        min_percentage IS NULL
        OR max_percentage IS NULL
        OR min_percentage <= max_percentage
    ),

    UNIQUE (listing_id, chem_id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id)    REFERENCES chemicals(id) ON DELETE RESTRICT
);


-- ============================================================
-- TABLE 6: hazard_matrix
-- ============================================================
-- Many-to-Many safety rules: which chemical pairs are incompatible.
-- Before finalizing a deal, the system checks this table to ensure
-- the waste stream doesn't contain a dangerous combination.
--
-- COLUMNS:
--   chem_id_1        TEXT     — FK → chemicals(id), part of composite PK
--   chem_id_2        TEXT     — FK → chemicals(id), part of composite PK
--   is_incompatible  INTEGER  — 1 = dangerous mix, 0 = safe (BOOLEAN)
--
-- CONSTRAINTS:
--   PK: (chem_id_1, chem_id_2) — composite primary key
--   FK: chem_id_1 → chemicals(id) ON DELETE CASCADE
--   FK: chem_id_2 → chemicals(id) ON DELETE CASCADE
--   CHECK: chem_id_1 < chem_id_2 (prevents duplicate reversed pairs)
--   CHECK: is_incompatible IN (0, 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS hazard_matrix (
    chem_id_1        TEXT       NOT NULL,
    chem_id_2        TEXT       NOT NULL,
    is_incompatible  INTEGER    NOT NULL    DEFAULT 0
        CHECK (is_incompatible IN (0, 1)),

    -- Composite Primary Key
    PRIMARY KEY (chem_id_1, chem_id_2),

    -- Enforce ordering to avoid duplicate reversed pairs (e.g. PB-HG and HG-PB)
    CHECK (chem_id_1 < chem_id_2),

    FOREIGN KEY (chem_id_1) REFERENCES chemicals(id) ON DELETE CASCADE,
    FOREIGN KEY (chem_id_2) REFERENCES chemicals(id) ON DELETE CASCADE
);


-- ============================================================
-- TABLE 7: process_capabilities
-- ============================================================
-- The "Intermediary" graph link.
-- Defines what a processor (a User) can convert:
--   "Processor C can take Chemical X and produce Chemical Y
--    at a given conversion efficiency."
--
-- Used for graph-path queries:
--   1-hop: A → C → B  (direct conversion)
--   2-hop: A → C1 → intermediate → C2 → B  (two processors)
--
-- COLUMNS:
--   id                      INTEGER  — Primary Key, Auto-Increment
--   processor_id            INTEGER  — FK → users(id), NOT NULL
--   input_chem_id           TEXT     — FK → chemicals(id), NOT NULL
--   output_chem_id          TEXT     — FK → chemicals(id), NOT NULL
--   conversion_efficiency   REAL     — 0.00 to 1.00 (e.g. 0.85 = 85%), NOT NULL
--
-- CONSTRAINTS:
--   PK: id
--   FK: processor_id → users(id) ON DELETE CASCADE
--   FK: input_chem_id → chemicals(id) ON DELETE RESTRICT
--   FK: output_chem_id → chemicals(id) ON DELETE RESTRICT
--   NOT NULL: processor_id, input_chem_id, output_chem_id, conversion_efficiency
--   CHECK: conversion_efficiency BETWEEN 0 AND 1
--   CHECK: input_chem_id != output_chem_id (can't convert to itself)
--   UNIQUE: (processor_id, input_chem_id, output_chem_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS process_capabilities (
    id                      INTEGER     PRIMARY KEY AUTOINCREMENT,
    processor_id            INTEGER     NOT NULL,
    input_chem_id           TEXT        NOT NULL,
    output_chem_id          TEXT        NOT NULL,
    conversion_efficiency   REAL        NOT NULL
        CHECK (conversion_efficiency >= 0 AND conversion_efficiency <= 1),

    -- A processor can't convert a chemical to itself
    CHECK (input_chem_id != output_chem_id),

    -- One conversion rule per processor per input-output pair
    UNIQUE (processor_id, input_chem_id, output_chem_id),

    FOREIGN KEY (processor_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (input_chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT,
    FOREIGN KEY (output_chem_id) REFERENCES chemicals(id) ON DELETE RESTRICT
);


-- ============================================================
-- INDEXES (for query performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_listings_user_id     ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_type         ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_status       ON listings(status);
CREATE INDEX IF NOT EXISTS idx_batch_comp_listing    ON batch_composition(listing_id);
CREATE INDEX IF NOT EXISTS idx_batch_comp_chem       ON batch_composition(chem_id);
CREATE INDEX IF NOT EXISTS idx_accept_crit_listing   ON acceptance_criteria(listing_id);
CREATE INDEX IF NOT EXISTS idx_accept_crit_chem      ON acceptance_criteria(chem_id);
CREATE INDEX IF NOT EXISTS idx_proc_cap_processor    ON process_capabilities(processor_id);
CREATE INDEX IF NOT EXISTS idx_proc_cap_input        ON process_capabilities(input_chem_id);
CREATE INDEX IF NOT EXISTS idx_proc_cap_output       ON process_capabilities(output_chem_id);

# 🎮 Controllers — Business Logic & Raw SQL

**All API endpoints with hand-written SQL queries**

---

## 📁 Controller Overview

| Controller | Purpose | Key SQL Concepts |
|------------|---------|-------------------|
| `authController.js` | User authentication | INSERT, SELECT, bcrypt, JWT |
| `masterController.js` | Master data (chemicals) | Simple SELECT |
| `listingsController.js` | CRUD operations | Transactions, multi-table INSERT |
| `searchController.js` | Complex search logic | EXISTS, JOIN, GROUP BY, self-JOIN |
| `utilsController.js` | Utility functions | Pure JavaScript (no DB) |

---

## 🔐 Auth Controller

### Features
- **User Registration**: Email uniqueness check, password hashing
- **User Login**: Credential verification, JWT token generation
- **Security**: bcrypt hashing, JWT with 24h expiration

### Key Queries
```javascript
// Check email uniqueness
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

// Insert new user
const result = db.prepare(`
  INSERT INTO users (name, email, password_hash, industry_type, location)
  VALUES (?, ?, ?, ?, ?)
`).run(name, email, password_hash, industry_type, location || null);

// Login verification
const user = db.prepare(`
  SELECT id, name, email, password_hash, industry_type, location
  FROM users WHERE email = ?
`).get(email);
```

---

## 📋 Master Controller

### Purpose
Provides master data for dropdowns and references.

### Query
```javascript
// All chemicals ordered by name
const chemicals = db.prepare(`
  SELECT id, name, hazard_level 
  FROM chemicals 
  ORDER BY name ASC
`).all();
```

---

## 📦 Listings Controller

### Features
- **Create Listings**: Atomic transaction with composition/criteria
- **Fetch Listings**: Multi-table JOIN with nested data
- **Type Support**: OFFER (composition) vs DEMAND (criteria)

### Transaction Logic
```javascript
const createTransaction = db.transaction(() => {
  // Step 1: INSERT INTO listings
  const result = insertListing.run(userId, type, materialName, Number(quantity));
  const listingId = result.lastInsertRowid;

  // Step 2a: INSERT INTO batch_composition (OFFERs)
  if (composition && composition.length) {
    for (const c of composition) {
      insertComposition.run(listingId, c.chemId, Number(c.percentage));
    }
  }

  // Step 2b: INSERT INTO acceptance_criteria (DEMANDs)
  if (criteria && criteria.length) {
    for (const c of criteria) {
      insertCriteria.run(listingId, c.chemId, c.minPercentage, c.maxPercentage);
    }
  }

  return listingId;
});
```

### Complex Fetch
```javascript
// Get listings with user info
const listings = db.prepare(`
  SELECT l.id, l.user_id, l.type, l.material_name, l.total_quantity,
         l.status, l.created_at AS createdAt,
         u.name AS user_name, u.industry_type, u.location
  FROM listings l
  JOIN users u ON u.id = l.user_id
  WHERE l.status = 'ACTIVE'
  ORDER BY l.created_at DESC
`).all();

// Get all composition rows
const allComposition = db.prepare(`
  SELECT bc.listing_id, bc.chem_id, bc.percentage,
         c.name AS chem_name, c.hazard_level
  FROM batch_composition bc
  JOIN chemicals c ON c.id = bc.chem_id
  WHERE bc.listing_id IN (SELECT id FROM listings WHERE status = 'ACTIVE')
  ORDER BY bc.percentage DESC
`).all();
```

---

## 🔍 Search Controller

### The Star Query — matchBuyers
**Purpose**: Find DEMAND listings that fully match a supply listing's composition

```sql
SELECT demand.id AS demand_id,
       demand.material_name AS demand_material,
       buyer.name AS buyer_name,
       COUNT(ac.id) AS matched_criteria,
       total_crit.total AS total_criteria
FROM listings demand
JOIN users buyer ON buyer.id = demand.user_id
JOIN acceptance_criteria ac ON ac.listing_id = demand.id
JOIN batch_composition mc ON mc.listing_id = ? AND mc.chem_id = ac.chem_id
JOIN (
  SELECT listing_id, COUNT(*) AS total
  FROM acceptance_criteria
  GROUP BY listing_id
) total_crit ON total_crit.listing_id = demand.id
WHERE demand.type = 'DEMAND'
  AND demand.status = 'ACTIVE'
  AND (ac.min_percentage IS NULL OR mc.percentage >= ac.min_percentage)
  AND (ac.max_percentage IS NULL OR mc.percentage <= ac.max_percentage)
GROUP BY demand.id, demand.material_name, buyer.name, total_crit.total
HAVING COUNT(ac.id) = total_crit.total  -- ALL criteria must match
```

### Filter Search — matchListings
**Purpose**: Dynamic filtering with EXISTS subqueries

```javascript
// Build one EXISTS subquery per filter
conditions.push(`
  EXISTS (
    SELECT 1 FROM batch_composition bc
    WHERE bc.listing_id = l.id
      AND bc.chem_id = ?
      AND bc.percentage ${f.operator} ?
  )
`);
```

### Graph Traversal — findProcessors
**Purpose**: Find 1-hop and 2-hop processing paths

```sql
-- 1-hop: Direct conversion
SELECT pc.id AS capability_id, u.name AS processor_name,
       c_in.name AS input_name, c_out.name AS output_name,
       pc.conversion_efficiency, 1 AS hops
FROM process_capabilities pc
JOIN users u ON u.id = pc.processor_id
JOIN chemicals c_in ON c_in.id = pc.input_chem_id
JOIN chemicals c_out ON c_out.id = pc.output_chem_id
WHERE pc.input_chem_id = ? AND pc.output_chem_id = ?

-- 2-hop: Two-step conversion via intermediate
SELECT pc1.id AS step1_id, u1.name AS processor1_name,
       c_mid.name AS intermediate_chemical,
       (pc1.conversion_efficiency * pc2.conversion_efficiency) AS total_efficiency,
       2 AS hops
FROM process_capabilities pc1
JOIN process_capabilities pc2 ON pc1.output_chem_id = pc2.input_chem_id
JOIN users u1 ON u1.id = pc1.processor_id
JOIN users u2 ON u2.id = pc2.processor_id
JOIN chemicals c_mid ON c_mid.id = pc1.output_chem_id
WHERE pc1.input_chem_id = ? AND pc2.output_chem_id = ?
  AND pc1.id != pc2.id
```

### Hazard Detection
```sql
-- Check for incompatible chemical pairs
SELECT mc1.chem_id AS chem_a, mc2.chem_id AS chem_b,
       c1.name AS chem_a_name, c2.name AS chem_b_name
FROM batch_composition mc1
JOIN batch_composition mc2 ON mc1.listing_id = mc2.listing_id
                          AND mc1.chem_id < mc2.chem_id
JOIN hazard_matrix hm ON hm.chem_id_1 = mc1.chem_id
                    AND hm.chem_id_2 = mc2.chem_id
                    AND hm.is_incompatible = 1
JOIN chemicals c1 ON c1.id = mc1.chem_id
JOIN chemicals c2 ON c2.id = mc2.chem_id
WHERE mc1.listing_id = ?
```

---

## 🛠️ Utils Controller

### AI Prompt Parser
**Purpose**: Convert natural language to structured filters

```javascript
// Example: "fly ash with less than 1% sulfur and more than 50% silica"
// Output: [
//   { chemId: "S", operator: "<", value: 1 },
//   { chemId: "SIO2", operator: ">", value: 50 }
// ]
```

**Features**:
- **Chemical recognition**: Maps names to IDs
- **Operator extraction**: <, >, <=, >=, =
- **Value parsing**: Numeric extraction
- **Graceful fallback**: Returns partial matches

---

## 🎯 SQL Concepts Demonstrated

| Concept | Controller | Example |
|---------|------------|---------|
| **Transactions** | listings | Atomic listing + composition creation |
| **EXISTS Subquery** | search | Dynamic filter matching |
| **GROUP BY + HAVING** | search | Star query for buyer matching |
| **Self-JOIN** | search | 2-hop processor paths |
| **Correlated Subquery** | search | Total criteria count |
| **NULL-safe Comparisons** | search | `IS NULL OR` patterns |
| **Computed Columns** | search | Efficiency multiplication |
| **Prepared Statements** | all | Parameterized queries for security |

---

## 📊 Query Performance

### Optimizations
- **Prepared statements**: Cached by `better-sqlite3`
- **Indexes**: All FK and query columns indexed
- **Efficient joins**: Proper join conditions
- **Minimal data**: Only fetch required columns

### Complex Query Analysis
- **Star query**: 5-table JOIN with aggregation
- **Graph query**: Self-JOIN with computed efficiency
- **Filter query**: Dynamic EXISTS subqueries

---

## 🧪 Testing Controllers

### Manual Testing
```bash
# Test match-buyers star query
curl -X POST http://localhost:5000/api/search/match-buyers \
  -H "Content-Type: application/json" \
  -d '{"supplyListingId": 1}'

# Test processor finder
curl -X POST http://localhost:5000/api/search/find-processors \
  -H "Content-Type: application/json" \
  -d '{"inputChemId":"S","outputChemId":"CAO"}'
```

### Expected Results
- **matchBuyers**: UltraTech matches Fly Ash (3/3 criteria)
- **findProcessors**: S→SO4 (90%) and S→CAO (67.5% via SO4)
- **matchListings**: Fly Ash found for SiO2>50 AND S<2

---

## 🔄 From ORM to Raw SQL

### Before (Sequelize)
```javascript
const listing = await Listing.create(data);
const composition = await BatchComposition.bulkCreate(comps);
```

### After (Raw SQL)
```javascript
const createTransaction = db.transaction(() => {
  const result = insertListing.run(...);
  for (const c of composition) {
    insertComposition.run(result.lastInsertRowid, ...);
  }
});
```

**Benefits**:
- **Explicit control**: Every SQL statement visible
- **Performance**: No ORM overhead
- **Learning**: Direct SQL experience
- **Debugging**: Clear query strings

---

**Built to showcase advanced SQL and database design skills**

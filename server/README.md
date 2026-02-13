# 🗄️ Server — Raw SQL Backend

**Node.js + Express backend with pure SQL database operations**

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite with `better-sqlite3` (synchronous, no ORM)
- **Authentication**: JWT + bcryptjs
- **Environment**: dotenv for configuration

---

## 📁 Folder Structure

```
server/
├── config/
│   ├── database.js        # SQLite connection setup
│   ├── schema.sql         # Complete database schema (309 lines)
│   └── initDb.js          # Database initialization
├── controllers/
│   ├── authController.js  # User registration & login
│   ├── masterController.js # Master data (chemicals)
│   ├── listingsController.js # CRUD with transactions
│   ├── searchController.js # Complex SQL queries
│   └── utilsController.js  # AI prompt parser
├── middleware/
│   └── authMiddleware.js  # JWT authentication
├── models/                 # DELETED — no ORM models
├── routes/
│   ├── auth.js            # Auth endpoints
│   ├── master.js          # Master data endpoints
│   ├── listings.js        # Listing CRUD
│   ├── search.js          # Search endpoints
│   └── utils.js           # Utility endpoints
├── .env.example           # Environment variables template
├── index.js               # Express server entry point
├── package.json
├── render.yaml            # Render deployment config
└── seed.js                # Database seeding script
```

---

## 🚀 Quick Start

```bash
cd server
npm install
npm run seed    # Create database and populate with demo data
npm start       # Start server (http://localhost:5000)
```

---

## 🗄️ Database Schema

### Core Design Principles
- **Pure SQL**: No ORM abstraction, all queries hand-written
- **Explicit Constraints**: PK, FK, CHECK, UNIQUE, NOT NULL documented
- **Referential Integrity**: Foreign keys with CASCADE/RESTRICT
- **Performance**: 11 indexes for query optimization

### Tables (7 total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Industries/factories | Auth, industry types, locations |
| `chemicals` | Chemical master data | Hazard levels (LOW/MEDIUM/HIGH) |
| `listings` | OFFER/DEMAND posts | Transactional core |
| `batch_composition` | Waste composition | Property-bag approach |
| `acceptance_criteria` | Buyer constraints | Min/max percentage ranges |
| `hazard_matrix` | Safety rules | Incompatible chemical pairs |
| `process_capabilities` | Processing graph | Conversion efficiencies |

**Full schema**: See `config/schema.sql` for complete DDL with constraints and comments.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login (returns JWT)

### Master Data
- `GET /api/master/chemicals` — All chemicals (17 rows)

### Listings
- `GET /api/listings` — All active listings with composition/criteria
- `POST /api/listings` — Create listing (auth required, transactional)

### Search (Complex SQL)
- `POST /api/search/match` — Filter search with EXISTS subqueries
- `POST /api/search/match-buyers` — Star query (JOIN + GROUP BY + HAVING)
- `POST /api/search/find-processors` — Graph paths (self-JOIN)

### Utilities
- `POST /api/utils/parse-prompt` — AI-powered prompt parsing

### Health
- `GET /api/health` — Service health check

---

## 🧪 SQL Concepts Demonstrated

### Transactions
```javascript
// listingsController.js — atomic listing creation
const createTransaction = db.transaction(() => {
  // INSERT INTO listings
  // INSERT INTO batch_composition (multiple rows)
  // INSERT INTO acceptance_criteria (if DEMAND)
});
```

### Complex Queries
```sql
-- Star query: matchBuyers
SELECT demand.id, buyer.name, COUNT(ac.id) AS matched_criteria
FROM listings demand
JOIN acceptance_criteria ac ON ac.listing_id = demand.id
JOIN batch_composition mc ON mc.listing_id = ? AND mc.chem_id = ac.chem_id
WHERE demand.type = 'DEMAND'
  AND (ac.min_percentage IS NULL OR mc.percentage >= ac.min_percentage)
  AND (ac.max_percentage IS NULL OR mc.percentage <= ac.max_percentage)
GROUP BY demand.id
HAVING COUNT(ac.id) = total_crit.total
```

### Self-JOIN for Graph Traversal
```sql
-- findProcessors: 2-hop paths
SELECT pc1.id AS step1_id, pc2.id AS step2_id,
       (pc1.conversion_efficiency * pc2.conversion_efficiency) AS total_efficiency
FROM process_capabilities pc1
JOIN process_capabilities pc2 ON pc1.output_chem_id = pc2.input_chem_id
WHERE pc1.input_chem_id = ? AND pc2.output_chem_id = ?
```

---

## 🔐 Security

### Authentication
- **JWT tokens**: 24-hour expiration
- **bcrypt**: Password hashing (10 rounds)
- **Protected routes**: Middleware checks JWT validity

### Input Validation
- **Parameterized queries**: All SQL uses `?` placeholders
- **Request validation**: Required fields checked
- **Type checking**: Numeric values validated

### CORS
- **Permissive**: All origins allowed (adjustable for production)

---

## 📊 Performance

### Database Optimization
- **Indexes**: 11 indexes on FK columns and query fields
- **Prepared statements**: `better-sqlite3` caches prepared statements
- **Synchronous operations**: No async overhead

### Query Performance
- **Complex joins**: Optimized with proper indexes
- **Aggregations**: Efficient GROUP BY operations
- **Subqueries**: Correlated subqueries for filtering

---

## 🌱 Seeding

The `seed.js` script:
1. **Creates database** from `schema.sql`
2. **Inserts 17 chemicals** with hazard levels
3. **Adds 5 hazard rules** for safety checking
4. **Creates 5 users** (industries)
5. **Generates demo listings**:
   - 3 OFFER listings with composition
   - 2 DEMAND listings with criteria
6. **Adds 3 processing capabilities** for graph queries

**Run**: `npm run seed` (or `node seed.js`)

---

## 🚀 Deployment

### Render (Recommended)
```yaml
# render.yaml
services:
  - type: web
    name: symbio-exchange-api
    runtime: node
    buildCommand: npm install
    startCommand: node seed.js && node index.js
```

### Environment Variables
- `PORT`: Server port (default 5000)
- `JWT_SECRET`: JWT signing secret
- `DB_STORAGE`: Database file path
- `NODE_ENV`: Environment (development/production)

---

## 🧪 Testing

### Manual API Tests
```bash
# Health check
curl http://localhost:5000/api/health

# Get chemicals
curl http://localhost:5000/api/master/chemicals

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ntpc@example.com","password":"password123"}'
```

### Test Coverage
- ✅ All CRUD operations
- ✅ Authentication flow
- ✅ Complex search queries
- ✅ Transaction integrity
- ✅ Error handling

---

## 📚 Educational Value

This backend demonstrates:
- **Pure SQL mastery**: No ORM crutches
- **Advanced queries**: Complex JOINs, subqueries, aggregations
- **Transaction management**: ACID properties
- **Database design**: Normalization, constraints, indexing
- **API design**: RESTful principles, authentication
- **Production readiness**: Error handling, logging, deployment

Perfect for DBMS courses wanting to showcase raw SQL expertise.

---

## 🔄 Migration from ORM

This project was originally built with Sequelize ORM and completely refactored to raw SQL:

| Before (ORM) | After (Raw SQL) |
|--------------|----------------|
| `Model.create()` | `db.prepare("INSERT...").run()` |
| `Model.findAll()` | `db.prepare("SELECT...").all()` |
| `sequelize.transaction()` | `db.transaction(() => { ... })` |
| 8 model files | 1 schema.sql file |

The refactoring maintains all functionality while making every SQL statement explicit and visible.

---

**Built to showcase advanced SQL and database design skills**

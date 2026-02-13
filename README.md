# Symbio-Exchange 

**Industrial Symbiosis Marketplace — Raw SQL Backend + React Frontend**

> One factory's waste is another factory's raw material.

---

##  Project Overview

Symbio-Exchange is a B2B marketplace where industries can:
- **OFFER** waste materials (fly ash, slag, chemical sludge)
- **DEMAND** raw materials with specific chemical constraints
- **MATCH** waste streams to buyer requirements using complex SQL queries
- **FIND PROCESSORS** for chemical transformations via graph algorithms

### Key Features
- **Pure SQL Backend** — No ORM, every query is hand-written
- **Complex SQL** — JOINs, GROUP BY + HAVING, EXISTS, self-JOINs
- **Transactions** — Atomic operations with BEGIN/COMMIT/ROLLBACK
- **Hazard Detection** — Chemical incompatibility matrix
- **AI-Powered Search** — Natural language prompt parser
- **Graph Processing** — 1-hop and 2-hop conversion paths

---

##  Live Demo

- **Frontend**: https://symbx.netlify.app/
- **Backend API**: https://symbx.onrender.com/api

**Login Credentials** (all same password):
- Email: `ntpc@example.com` | Password: `password123`
- Email: `ultratech@example.com` | Password: `password123`
- Email: `tata@example.com` | Password: `password123`

---

##  Project Structure

```
symbio-exchange/
├── client/                 # React frontend (Vite + TailwindCSS)
├── server/                 # Node.js + SQLite backend (raw SQL)
├── DEPLOYMENT.md           # Full deployment guide
└── README.md              # This file
```

---

##  Quick Start

### Prerequisites
- Node.js 18+
- Git

### Local Development
```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/symbx.git
cd symbx

# Backend
cd server
npm install
npm run seed
npm start

# Frontend (new terminal)
cd ../client
npm install
npm run dev
```

Visit http://localhost:3000

---

##  Architecture

### Backend (Raw SQL)
- **Database**: SQLite with `better-sqlite3` driver
- **Tables**: 7 tables with full constraints (PK, FK, CHECK, UNIQUE)
- **Schema**: `server/config/schema.sql` — 309 lines of documented SQL
- **Controllers**: All queries hand-written, no ORM abstraction

### Frontend (React)
- **Framework**: React 18 with Vite
- **Styling**: TailwindCSS with dark mode
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP**: Axios with JWT interceptors

---

##  Database Schema

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | Industries/factories | Auth, industry types, locations |
| `chemicals` | Chemical master data | Hazard levels (LOW/MEDIUM/HIGH) |
| `listings` | OFFER/DEMAND posts | Transactional core |
| `batch_composition` | Waste composition | Property-bag approach |
| `acceptance_criteria` | Buyer constraints | Min/max percentage ranges |
| `hazard_matrix` | Safety rules | Incompatible chemical pairs |
| `process_capabilities` | Processing graph | Conversion efficiencies |

See `server/config/schema.sql` for complete schema with constraints.

---

##  Key SQL Concepts Demonstrated

| Concept | Where Used |
|---------|------------|
| **Transactions** | `listingsController.js` — atomic listing creation |
| **EXISTS Subqueries** | `searchController.js` — filter matching |
| **GROUP BY + HAVING** | `searchController.js` — star query for buyer matching |
| **Self-JOIN** | `searchController.js` — 2-hop processor paths |
| **Composite PK** | `hazard_matrix` table |
| **CHECK Constraints** | All tables — data integrity |
| **Foreign Keys** | All relationships with CASCADE/RESTRICT |

---

##  Testing

### API Tests (14/14 passing)
```bash
# Health check
curl https://symbx.onrender.com/api/health

# Chemicals (17 rows)
curl https://symbx.onrender.com/api/master/chemicals

# Listings with composition
curl https://symbx.onrender.com/api/listings
```

### Frontend Tests
- Login flow 
- Dashboard loads 
- Smart search 
- Match buyers 
- Processor finder 

---

##  Deployment

### Backend → Render (Free)
1. Push to GitHub
2. Connect repo to Render
3. Set build command: `npm install`
4. Set start command: `node seed.js && node index.js`
5. Add env vars: `PORT`, `JWT_SECRET`, `DB_STORAGE`

### Frontend → Netlify (Free)
1. Connect repo to Netlify
2. Base directory: `client`
3. Build command: `npm run build`
4. Add env var: `VITE_API_URL=https://your-backend.onrender.com/api`

See `DEPLOYMENT.md` for detailed guide.

---

##  Educational Value

This project demonstrates:
- **DBMS Fundamentals**: Normalization, constraints, relationships
- **Advanced SQL**: Complex queries, transactions, performance
- **Full-Stack Development**: API design, authentication, state management
- **Industrial Symbiosis**: Real-world sustainability application
- **Modern Tooling**: Vite, TailwindCSS, Git workflows

Perfect for DBMS course presentations or portfolio projects.

---

##  Contributing

1. Fork the repo
2. Create feature branch
3. Push changes
4. Open Pull Request

---

##  License

MIT License — feel free to use for educational or commercial purposes.

---

**Built with  for a sustainable industrial future**

##  Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18 + Vite + Tailwind + Framer Motion | Context API, dark mode, animations |
| Backend | Express + Sequelize | RESTful, JWT auth, DB transactions |
| Database | SQLite (dev) / PostgreSQL (prod) | 7 tables, complex JOINs |

##  Database Schema (7 Tables)

| Table | Purpose | Link Type |
|-------|---------|-----------|
| `users` | Industries/factories | - |
| `chemicals` | Master chemical data | - |
| `listings` | OFFER/DEMAND posts | User → Listings (1:N) |
| `batch_composition` | What's inside a waste stream | Listing → Composition (1:N) |
| `acceptance_criteria` | Buyer's min/max constraints | Listing → Criteria (1:N) |
| `hazard_matrix` | Incompatible chemical pairs | Chemical × Chemical (M:N) |
| `process_capabilities` | Processor conversion graph | User × Chemical × Chemical |

## Key SQL Queries

### The Star Query: Match Buyers
Given a supply listing, find all DEMAND listings whose AcceptanceCriteria are FULLY satisfied:
- JOIN composition with criteria ON matching chem_id
- WHERE percentage is within [min, max]
- GROUP BY demand, HAVING COUNT = total criteria (ALL must match)

### Graph Query: Find Processors
- 1-hop: Direct conversion X → Y via Processor C
- 2-hop: X → Z (via C1) → Y (via C2) with combined efficiency

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/master/chemicals` | No | Chemical dropdown data |
| POST | `/api/listings` | Yes | Create listing (transactional) |
| GET | `/api/listings` | No | All active listings |
| POST | `/api/search/match` | No | Filter listings by composition |
| POST | `/api/search/match-buyers` | No | Find buyers for a supply listing |
| POST | `/api/search/find-processors` | No | Find processing paths |
| POST | `/api/utils/parse-prompt` | No | NLP → filter JSON |

## Seeded Test Data

| Entity | Count | Details |
|--------|-------|---------|
| Chemicals | 17 | SiO2, Al2O3, Lead, Mercury, etc. |
| Users | 5 | NTPC, UltraTech, Tata Steel, GreenProcess, PharmaCycle |
| OFFER listings | 3 | Fly Ash, Blast Furnace Slag, Chemical Sludge |
| DEMAND listings | 2 | Fly Ash (strict), Calcium Source |
| Hazard rules | 5 | Pb+Hg, As+Cd, Hg+S, Cr+Pb, Pb+S |
| Process capabilities | 3 | S→SO4, Pb→Zn, SO4→CaO |

All seeded users have password: `password123`

## Switching to PostgreSQL

1. `npm install pg pg-hstore` in `/server`
2. Update `.env`:
   ```
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=symbio_exchange
   DB_USER=postgres
   DB_PASS=yourpassword
   ```
3. Update `server/config/database.js` to read those env vars.

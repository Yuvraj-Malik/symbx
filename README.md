# Symbio-Exchange — Industrial Symbiosis Marketplace

A B2B marketplace where factories trade industrial waste based on chemical composition.
Built with React, Express, Sequelize, and SQLite.

## Quick Start

### 1. Backend
```bash
cd server
npm install
npm run seed    # Seeds chemicals, users, listings, hazard rules, processors
npm run dev     # Starts on http://localhost:5000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev     # Starts on http://localhost:3000 (proxied to backend)
```

### 3. Test Flow
1. Open `http://localhost:3000`
2. Login with seeded account: `ntpc@example.com` / `password123`
3. Browse the Dashboard — see 5 pre-seeded listings
4. Go to **Smart Search** — try: *"I need fly ash with less than 1% sulfur and more than 50% silica"*
5. Go to **Match Buyers** — enter Supply Listing ID `1` to find matching buyers
6. Go to **Processor Finder** — select Sulfur → Calcium Oxide to see 2-hop path

## Architecture

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18 + Vite + Tailwind + Framer Motion | Context API, dark mode, animations |
| Backend | Express + Sequelize | RESTful, JWT auth, DB transactions |
| Database | SQLite (dev) / PostgreSQL (prod) | 7 tables, complex JOINs |

## Database Schema (7 Tables)

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

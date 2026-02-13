# 🛣️ Routes — API Endpoints

**RESTful API routing for Symbio-Exchange**

---

## 📁 Route Files

| File | Endpoints | Purpose |
|------|-----------|---------|
| `auth.js` | `/api/auth/*` | User authentication |
| `master.js` | `/api/master/*` | Master data (chemicals) |
| `listings.js` | `/api/listings/*` | Listing CRUD operations |
| `search.js` | `/api/search/*` | Complex search endpoints |
| `utils.js` | `/api/utils/*` | Utility functions |

---

## 🔐 Authentication Routes (`auth.js`)

### POST `/api/auth/register`
**Purpose**: Create new user account

**Request Body**:
```json
{
  "name": "Company Name",
  "email": "company@example.com",
  "password": "password123",
  "industry_type": "Thermal",
  "location": "City, State"
}
```

**Response**:
```json
{
  "message": "Registration successful.",
  "user": {
    "id": 1,
    "name": "Company Name",
    "email": "company@example.com"
  }
}
```

### POST `/api/auth/login`
**Purpose**: Authenticate user and return JWT

**Request Body**:
```json
{
  "email": "company@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Company Name",
    "email": "company@example.com",
    "industry_type": "Thermal"
  }
}
```

---

## 📋 Master Data Routes (`master.js`)

### GET `/api/master/chemicals`
**Purpose**: Get all chemicals for dropdowns

**Response**:
```json
[
  {
    "id": "SIO2",
    "name": "Silicon Dioxide",
    "hazard_level": "LOW"
  },
  {
    "id": "PB",
    "name": "Lead",
    "hazard_level": "HIGH"
  }
]
```

---

## 📦 Listing Routes (`listings.js`)

### GET `/api/listings`
**Purpose**: Get all active listings with full details

**Response**:
```json
[
  {
    "id": 1,
    "type": "OFFER",
    "material_name": "Fly Ash",
    "total_quantity": 5000,
    "status": "ACTIVE",
    "createdAt": "2026-02-13 19:23:26",
    "user": {
      "name": "NTPC Dadri",
      "industry_type": "Thermal",
      "location": "Dadri, UP"
    },
    "composition": [
      {
        "chem_id": "SIO2",
        "percentage": 60,
        "chem_name": "Silicon Dioxide",
        "hazard_level": "LOW"
      }
    ],
    "criteria": []
  }
]
```

### POST `/api/listings`
**Purpose**: Create new listing (requires authentication)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Request Body (OFFER)**:
```json
{
  "type": "OFFER",
  "materialName": "Red Mud",
  "quantity": 800,
  "composition": [
    {
      "chemId": "FE2O3",
      "percentage": 45
    },
    {
      "chemId": "AL2O3",
      "percentage": 20
    }
  ]
}
```

**Request Body (DEMAND)**:
```json
{
  "type": "DEMAND",
  "materialName": "Iron-Rich Slag",
  "quantity": 500,
  "criteria": [
    {
      "chemId": "FE2O3",
      "minPercentage": 30,
      "maxPercentage": null
    },
    {
      "chemId": "PB",
      "minPercentage": null,
      "maxPercentage": 0.5
    }
  ]
}
```

**Response**:
```json
{
  "message": "Listing created successfully.",
  "listing": {
    "id": 6,
    "type": "OFFER",
    "materialName": "Red Mud",
    "quantity": 800
  }
}
```

---

## 🔍 Search Routes (`search.js`)

### POST `/api/search/match`
**Purpose**: Find listings matching chemical constraints

**Request Body**:
```json
{
  "filters": [
    {
      "chemId": "SIO2",
      "operator": ">",
      "value": 50
    },
    {
      "chemId": "S",
      "operator": "<",
      "value": 2
    }
  ]
}
```

**Response**:
```json
[
  {
    "id": 1,
    "type": "OFFER",
    "material_name": "Fly Ash",
    "total_quantity": 5000,
    "user_name": "NTPC Dadri",
    "industry_type": "Thermal",
    "composition": [
      {
        "chem_id": "SIO2",
        "percentage": 60,
        "chem_name": "Silicon Dioxide"
      }
    ]
  }
]
```

### POST `/api/search/match-buyers`
**Purpose**: Find buyers for a specific supply listing (star query)

**Request Body**:
```json
{
  "supplyListingId": 1
}
```

**Response**:
```json
{
  "matches": [
    {
      "demand_id": 4,
      "demand_material": "Fly Ash",
      "demand_quantity": 2000,
      "buyer_name": "UltraTech Cement",
      "buyer_industry": "Cement",
      "buyer_location": "Mumbai, MH",
      "matched_criteria": 3,
      "total_criteria": 3
    }
  ],
  "hazardWarnings": [
    {
      "chem_a": "PB",
      "chem_b": "S",
      "chem_a_name": "Lead",
      "chem_b_name": "Sulfur"
    }
  ],
  "note": "Transport hazard detected — some chemicals in this waste are incompatible."
}
```

### POST `/api/search/find-processors`
**Purpose**: Find processing paths between chemicals

**Request Body**:
```json
{
  "inputChemId": "S",
  "outputChemId": "CAO"
}
```

**Response**:
```json
{
  "directPaths": [],
  "twoHopPaths": [
    {
      "step1_id": 1,
      "processor1_name": "GreenProcess Inc.",
      "processor1_location": "Vadodara, GJ",
      "intermediate_chemical": "Sulfate",
      "step1_efficiency": 0.9,
      "step2_id": 3,
      "processor2_name": "GreenProcess Inc.",
      "processor2_location": "Vadodara, GJ",
      "step2_efficiency": 0.75,
      "total_efficiency": 0.675,
      "hops": 2
    }
  ],
  "totalRoutes": 1
}
```

---

## 🛠️ Utility Routes (`utils.js`)

### POST `/api/utils/parse-prompt`
**Purpose**: Parse natural language search prompt

**Request Body**:
```json
{
  "prompt": "I need fly ash with less than 1% sulfur and more than 50% silica"
}
```

**Response**:
```json
{
  "parsed": true,
  "filters": [
    {
      "chemId": "S",
      "operator": "<",
      "value": 1
    },
    {
      "chemId": "SIO2",
      "operator": ">",
      "value": 50
    }
  ],
  "materialHint": "Fly Ash",
  "rawPrompt": "I need fly ash with less than 1% sulfur and more than 50% silica",
  "note": "Review and adjust the filters below before searching."
}
```

---

## 🔒 Authentication

Protected routes require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

**Protected endpoints**:
- `POST /api/listings` (create listing)

**Public endpoints**:
- `GET /api/listings` (browse listings)
- `POST /api/auth/*` (authentication)
- `GET /api/master/*` (master data)
- `POST /api/search/*` (search)
- `POST /api/utils/*` (utilities)

---

## 📊 Response Format

### Success Responses
- **200 OK**: Data retrieval
- **201 Created**: Resource created
- **204 No Content**: Successful operation with no response body

### Error Responses
```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes**:
- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid JWT
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server error

---

## 🧪 API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Authentication Flow
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123","industry_type":"Test"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create Listing (with JWT)
```bash
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{"type":"OFFER","materialName":"Test Waste","quantity":100,"composition":[{"chemId":"SIO2","percentage":50}]}'
```

---

## 🔄 Route Evolution

### From REST to GraphQL (Future)
The current REST API could be evolved to GraphQL for:
- **Single endpoint**: `/graphql`
- **Flexible queries**: Request only needed fields
- **Real-time subscriptions**: Live updates for new listings

### API Versioning
Future versions could use:
- `/api/v1/*` (current)
- `/api/v2/*` (breaking changes)

---

**Designed for clarity, consistency, and ease of use**

# 🛡️ Middleware — Request Processing

**Authentication and request handling middleware**

---

## 📁 Middleware Files

| File | Purpose | Features |
|------|---------|----------|
| `authMiddleware.js` | JWT authentication | Token validation, user extraction |

---

## 🔐 Authentication Middleware

### Purpose
Protects routes by verifying JWT tokens and attaching user info to requests.

### Implementation
```javascript
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
```

### Usage in Routes
```javascript
const authMiddleware = require("../middleware/authMiddleware");

// Protect route
router.post("/", authMiddleware, listingsController.createListing);

// Public route (no middleware)
router.get("/", listingsController.getListings);
```

### Features
- **Bearer token extraction**: Standard `Authorization: Bearer <token>` format
- **JWT verification**: Uses `jsonwebtoken` library
- **User attachment**: Adds `req.user` with decoded user data
- **Error handling**: Clear error messages for missing/invalid tokens
- **Next chaining**: Proper middleware flow

---

## 🔒 Security Features

### Token Validation
- **Signature verification**: Ensures token hasn't been tampered
- **Expiration check**: Tokens expire after 24 hours
- **Secret validation**: Uses server-side JWT secret

### Error Responses
- **401 Unauthorized**: Missing or invalid token
- **Clear messages**: Helpful error descriptions

### User Data Extraction
```javascript
// Decoded JWT payload
{
  "id": 1,
  "email": "ntpc@example.com",
  "iat": 1737009662,
  "exp": 1737096062
}

// Available in req.user
req.user = {
  id: 1,
  email: "ntpc@example.com"
}
```

---

## 🛠️ Integration

### Controller Usage
```javascript
// listingsController.js
exports.createListing = (req, res) => {
  const userId = req.user.id;  // Available from middleware
  // ... create listing with userId
};
```

### Route Protection
```javascript
// routes/listings.js
const router = require("express").Router();
const listingsController = require("../controllers/listingsController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected: must be logged in to create listings
router.post("/", authMiddleware, listingsController.createListing);

// Public: anyone can browse
router.get("/", listingsController.getListings);
```

---

## 🔧 Configuration

### JWT Secret
Set in `.env` file:
```
JWT_SECRET=symbio_exchange_dev_secret_change_in_prod
```

### Token Expiration
Set during login:
```javascript
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: "24h" }
);
```

---

## 🧪 Testing Middleware

### Valid Token
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ntpc@example.com","password":"password123"}' | \
  jq -r '.token')

# Use token to access protected route
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"OFFER","materialName":"Test","quantity":100,"composition":[{"chemId":"SIO2","percentage":50}]}'
```

### Invalid Token
```bash
# Missing token
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -d '{"type":"OFFER","materialName":"Test","quantity":100}'
# → 401 Unauthorized

# Invalid token
curl -X POST http://localhost:5000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{"type":"OFFER","materialName":"Test","quantity":100}'
# → 401 Unauthorized
```

---

## 🔄 Future Enhancements

### Rate Limiting
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### Role-Based Access
```javascript
// Enhanced middleware for role checking
const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Usage
router.post("/admin", authMiddleware, requireRole("admin"), adminController);
```

### CORS Configuration
```javascript
const cors = require("cors");

app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? ["https://symbx.netlify.app"] 
    : ["http://localhost:3000"],
  credentials: true
}));
```

---

## 📊 Security Best Practices

### Implemented
- ✅ **JWT tokens**: Secure authentication
- ✅ **Bearer format**: Standard token header
- ✅ **Error handling**: Clear security messages
- ✅ **Token expiration**: 24-hour limit

### Recommendations
- 🔄 **HTTPS**: Required for production
- 🔄 **Token refresh**: Implement refresh tokens
- 🔄 **Rate limiting**: Prevent abuse
- 🔄 **Input validation**: Already implemented in controllers

---

## 🐛 Debugging

### Common Issues
1. **Missing Bearer prefix**: Must be `Bearer <token>`
2. **Expired token**: Tokens expire after 24 hours
3. **Invalid secret**: JWT_SECRET must match login server
4. **Malformed token**: Corrupted or modified token

### Debug Steps
```javascript
// Add logging to middleware
module.exports = (req, res, next) => {
  console.log("Auth header:", req.headers.authorization);
  // ... rest of middleware
};
```

---

**Simple, secure, and effective authentication middleware**

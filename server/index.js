// ============================================================
// Symbio-Exchange — Express Server Entry Point
// Raw SQL backend using better-sqlite3 (no ORM)
// ============================================================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const initDb = require("./config/initDb");

// Import route modules
const authRoutes = require("./routes/auth");
const masterRoutes = require("./routes/master");
const listingsRoutes = require("./routes/listings");
const searchRoutes = require("./routes/search");
const utilsRoutes = require("./routes/utils");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/master", masterRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/utils", utilsRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// --- Initialize DB and Start Server ---
const PORT = process.env.PORT || 5000;

try {
  initDb(); // Creates all 7 tables from schema.sql
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("Failed to initialize database:", err);
  process.exit(1);
}

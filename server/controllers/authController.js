// ============================================================
// Auth Controller — raw SQL for user registration and login
// ============================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
require("dotenv").config();

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, industry_type, location } = req.body;

    if (!name || !email || !password || !industry_type) {
      return res.status(400).json({ error: "name, email, password, and industry_type are required." });
    }

    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // INSERT INTO users
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, industry_type, location)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, email, password_hash, industry_type, location || null);

    return res.status(201).json({
      message: "Registration successful.",
      user: { id: result.lastInsertRowid, name, email },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required." });
    }

    // SELECT user by email
    const user = db.prepare(`
      SELECT id, name, email, password_hash, industry_type, location
      FROM users
      WHERE email = ?
    `).get(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, industry_type: user.industry_type },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

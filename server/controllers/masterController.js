// ============================================================
// Master Data Controller — raw SQL for chemical lookups
// ============================================================
const db = require("../config/database");

// GET /api/master/chemicals — returns all chemicals for dropdown population
exports.getChemicals = (req, res) => {
  try {
    const chemicals = db.prepare(`
      SELECT id, name, hazard_level
      FROM chemicals
      ORDER BY name ASC
    `).all();

    return res.json(chemicals);
  } catch (err) {
    console.error("getChemicals error:", err);
    return res.status(500).json({ error: "Failed to fetch chemicals." });
  }
};

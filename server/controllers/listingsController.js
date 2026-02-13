// ============================================================
// Listings Controller — raw SQL with explicit transactions
//
// KEY DBMS CONCEPT: We use BEGIN / COMMIT / ROLLBACK to ensure
// atomicity. If inserting composition rows fails, the listing
// itself is rolled back — no orphan data.
// ============================================================
const db = require("../config/database");

// Prepared statements for inserts (better-sqlite3 caches these)
const insertListing = db.prepare(`
  INSERT INTO listings (user_id, type, material_name, total_quantity, status)
  VALUES (?, ?, ?, ?, 'ACTIVE')
`);

const insertComposition = db.prepare(`
  INSERT INTO batch_composition (listing_id, chem_id, percentage)
  VALUES (?, ?, ?)
`);

const insertCriteria = db.prepare(`
  INSERT INTO acceptance_criteria (listing_id, chem_id, min_percentage, max_percentage)
  VALUES (?, ?, ?, ?)
`);

// POST /api/listings — create a new listing (transactional)
exports.createListing = (req, res) => {
  try {
    const { type, materialName, quantity, composition, criteria } = req.body;
    const userId = req.user.id;

    // --- Validation ---
    if (!type || !materialName || !quantity) {
      return res.status(400).json({ error: "type, materialName, and quantity are required." });
    }
    if (!["OFFER", "DEMAND"].includes(type)) {
      return res.status(400).json({ error: "type must be OFFER or DEMAND." });
    }
    if (type === "OFFER" && (!composition || !composition.length)) {
      return res.status(400).json({ error: "OFFER listings require at least one composition row." });
    }
    if (type === "DEMAND" && (!criteria || !criteria.length)) {
      return res.status(400).json({ error: "DEMAND listings require at least one acceptance criteria row." });
    }
    if (composition && composition.length) {
      const totalPct = composition.reduce((sum, c) => sum + (c.percentage || 0), 0);
      if (totalPct > 100) {
        return res.status(400).json({ error: "Total composition percentage cannot exceed 100%." });
      }
    }

    // --- Transaction: BEGIN → INSERT listing → INSERT children → COMMIT ---
    // better-sqlite3's .transaction() auto-handles BEGIN/COMMIT/ROLLBACK
    const createTransaction = db.transaction(() => {
      // Step 1: INSERT INTO listings
      const result = insertListing.run(userId, type, materialName, Number(quantity));
      const listingId = result.lastInsertRowid;

      // Step 2a: INSERT INTO batch_composition (for OFFERs)
      if (composition && composition.length) {
        for (const c of composition) {
          insertComposition.run(listingId, c.chemId, Number(c.percentage));
        }
      }

      // Step 2b: INSERT INTO acceptance_criteria (for DEMANDs)
      if (criteria && criteria.length) {
        for (const c of criteria) {
          insertCriteria.run(
            listingId,
            c.chemId,
            c.minPercentage != null ? Number(c.minPercentage) : null,
            c.maxPercentage != null ? Number(c.maxPercentage) : null
          );
        }
      }

      return listingId;
    });

    const listingId = createTransaction();

    return res.status(201).json({
      message: "Listing created successfully.",
      listing: { id: listingId, type, materialName, quantity },
    });
  } catch (err) {
    // Transaction auto-rolled-back by better-sqlite3 on error
    console.error("createListing error:", err);
    return res.status(500).json({ error: "Failed to create listing." });
  }
};

// GET /api/listings — fetch all active listings with composition + criteria + user info
exports.getListings = (req, res) => {
  try {
    // Step 1: Get all active listings with user info (JOIN)
    const listings = db.prepare(`
      SELECT
        l.id, l.user_id, l.type, l.material_name, l.total_quantity,
        l.status, l.created_at AS createdAt,
        u.name AS user_name, u.industry_type, u.location
      FROM listings l
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'ACTIVE'
      ORDER BY l.created_at DESC
    `).all();

    // Step 2: Get all composition rows for these listings
    const allComposition = db.prepare(`
      SELECT bc.listing_id, bc.chem_id, bc.percentage,
             c.name AS chem_name, c.hazard_level
      FROM batch_composition bc
      JOIN chemicals c ON c.id = bc.chem_id
      WHERE bc.listing_id IN (SELECT id FROM listings WHERE status = 'ACTIVE')
      ORDER BY bc.percentage DESC
    `).all();

    // Step 3: Get all criteria rows for these listings
    const allCriteria = db.prepare(`
      SELECT ac.listing_id, ac.chem_id, ac.min_percentage, ac.max_percentage,
             c.name AS chem_name, c.hazard_level
      FROM acceptance_criteria ac
      JOIN chemicals c ON c.id = ac.chem_id
      WHERE ac.listing_id IN (SELECT id FROM listings WHERE status = 'ACTIVE')
    `).all();

    // Step 4: Group composition and criteria by listing_id
    const compMap = {};
    for (const row of allComposition) {
      if (!compMap[row.listing_id]) compMap[row.listing_id] = [];
      compMap[row.listing_id].push(row);
    }

    const critMap = {};
    for (const row of allCriteria) {
      if (!critMap[row.listing_id]) critMap[row.listing_id] = [];
      critMap[row.listing_id].push(row);
    }

    // Step 5: Assemble final response
    const result = listings.map((l) => ({
      ...l,
      user: { name: l.user_name, industry_type: l.industry_type, location: l.location },
      composition: compMap[l.id] || [],
      criteria: critMap[l.id] || [],
    }));

    return res.json(result);
  } catch (err) {
    console.error("getListings error:", err);
    return res.status(500).json({ error: "Failed to fetch listings." });
  }
};

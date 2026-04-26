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
    const userId = req.user.id;

    // Get all active listings with user info
    const listings = db.prepare(`
      SELECT l.id, l.user_id, l.type, l.material_name, l.total_quantity,
             l.status, l.created_at AS createdAt,
             u.name AS userName, u.industry_type, u.location
      FROM listings l
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM hidden_listings hl
          WHERE hl.user_id = ? AND hl.listing_id = l.id
        )
      ORDER BY l.created_at DESC
    `).all(userId);

    // Get all composition rows for these listings
    const allComposition = db.prepare(`
      SELECT bc.listing_id, bc.chem_id, bc.percentage,
             c.name AS chemName, c.hazard_level
      FROM batch_composition bc
      JOIN chemicals c ON c.id = bc.chem_id
      WHERE bc.listing_id IN (
        SELECT id FROM listings
        WHERE status = 'ACTIVE'
          AND NOT EXISTS (
            SELECT 1 FROM hidden_listings hl
            WHERE hl.user_id = ? AND hl.listing_id = listings.id
          )
      )
      ORDER BY bc.percentage DESC
    `).all(userId);

    // Get all criteria rows for these listings
    const allCriteria = db.prepare(`
      SELECT ac.listing_id, ac.chem_id, ac.min_percentage, ac.max_percentage,
             c.name AS chemName, c.hazard_level
      FROM acceptance_criteria ac
      JOIN chemicals c ON c.id = ac.chem_id
      WHERE ac.listing_id IN (
        SELECT id FROM listings
        WHERE status = 'ACTIVE'
          AND NOT EXISTS (
            SELECT 1 FROM hidden_listings hl
            WHERE hl.user_id = ? AND hl.listing_id = listings.id
          )
      )
      ORDER BY c.name ASC
    `).all(userId);

    // Attach composition and criteria to each listing
    const listingsWithDetails = listings.map(listing => ({
      ...listing,
      composition: allComposition.filter(comp => comp.listing_id === listing.id),
      criteria: allCriteria.filter(crit => crit.listing_id === listing.id),
      user: { name: listing.userName, industry_type: listing.industry_type, location: listing.location }
    }));

    return res.json(listingsWithDetails);
  } catch (err) {
    console.error("getListings error:", err);
    return res.status(500).json({ error: "Failed to fetch listings." });
  }
};

exports.getMyListings = (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's listings
    const listings = db.prepare(`
      SELECT l.id, l.user_id, l.type, l.material_name, l.total_quantity,
             l.status, l.created_at AS createdAt,
             u.name AS userName, u.industry_type, u.location
      FROM listings l
      JOIN users u ON u.id = l.user_id
      WHERE l.user_id = ? AND l.status = 'ACTIVE'
      ORDER BY l.created_at DESC
    `).all(userId);

    // Get composition and criteria for user's listings
    const allComposition = db.prepare(`
      SELECT bc.listing_id, bc.chem_id, bc.percentage,
             c.name AS chemName, c.hazard_level
      FROM batch_composition bc
      JOIN chemicals c ON c.id = bc.chem_id
      WHERE bc.listing_id IN (
        SELECT id FROM listings WHERE user_id = ? AND status = 'ACTIVE'
      )
      ORDER BY bc.percentage DESC
    `).all(userId);

    const allCriteria = db.prepare(`
      SELECT ac.listing_id, ac.chem_id, ac.min_percentage, ac.max_percentage,
             c.name AS chemName, c.hazard_level
      FROM acceptance_criteria ac
      JOIN chemicals c ON c.id = ac.chem_id
      WHERE ac.listing_id IN (
        SELECT id FROM listings WHERE user_id = ? AND status = 'ACTIVE'
      )
      ORDER BY c.name ASC
    `).all(userId);

    // Attach composition and criteria
    const listingsWithDetails = listings.map(listing => ({
      ...listing,
      composition: allComposition.filter(comp => comp.listing_id === listing.id),
      criteria: allCriteria.filter(crit => crit.listing_id === listing.id),
      user: { name: listing.userName, industry_type: listing.industry_type, location: listing.location }
    }));

    res.json(listingsWithDetails);
  } catch (err) {
    console.error("Failed to fetch user listings:", err);
    res.status(500).json({ error: "Failed to fetch your listings." });
  }
};

// GET /api/listings/:id — fetch one listing with composition + criteria + user info
exports.getListingById = (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const userId = req.user.id;

    if (!listingId) {
      return res.status(400).json({ error: "Valid listing id is required." });
    }

    const listing = db.prepare(`
      SELECT l.id, l.user_id, l.type, l.material_name, l.total_quantity,
             l.status, l.created_at AS createdAt,
             u.name AS userName, u.industry_type, u.location
      FROM listings l
      JOIN users u ON u.id = l.user_id
      WHERE l.id = ?
    `).get(listingId);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (listing.user_id !== userId) {
      const hidden = db.prepare(`
        SELECT 1
        FROM hidden_listings
        WHERE user_id = ? AND listing_id = ?
      `).get(userId, listingId);

      if (hidden) {
        return res.status(404).json({ error: "Listing not found." });
      }
    }

    const composition = db.prepare(`
      SELECT bc.listing_id, bc.chem_id, bc.percentage,
             c.name AS chemName, c.hazard_level
      FROM batch_composition bc
      JOIN chemicals c ON c.id = bc.chem_id
      WHERE bc.listing_id = ?
      ORDER BY bc.percentage DESC
    `).all(listingId);

    const criteria = db.prepare(`
      SELECT ac.listing_id, ac.chem_id, ac.min_percentage, ac.max_percentage,
             c.name AS chemName, c.hazard_level
      FROM acceptance_criteria ac
      JOIN chemicals c ON c.id = ac.chem_id
      WHERE ac.listing_id = ?
      ORDER BY c.name ASC
    `).all(listingId);

    return res.json({
      ...listing,
      composition,
      criteria,
      user: {
        name: listing.userName,
        industry_type: listing.industry_type,
        location: listing.location,
      },
    });
  } catch (err) {
    console.error("getListingById error:", err);
    return res.status(500).json({ error: "Failed to fetch listing details." });
  }
};

// PUT /api/listings/:id — update a listing (composition/criteria)
exports.updateListing = (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const userId = req.user.id;
    const { materialName, quantity, composition, criteria } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: "Valid listing id is required." });
    }

    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (listing.user_id !== userId) {
      return res.status(403).json({ error: "You can only edit your own listings." });
    }

    if (listing.status !== "ACTIVE") {
      return res.status(400).json({ error: "Can only edit ACTIVE listings." });
    }

    // Validation
    if (materialName && materialName.trim() === "") {
      return res.status(400).json({ error: "materialName cannot be empty." });
    }
    if (quantity && Number(quantity) <= 0) {
      return res.status(400).json({ error: "quantity must be > 0." });
    }

    // Update transaction
    const updateTransaction = db.transaction(() => {
      // Update listing name and quantity if provided
      if (materialName || quantity) {
        const updateListing = db.prepare(`
          UPDATE listings
          SET material_name = ?, total_quantity = ?
          WHERE id = ?
        `);
        updateListing.run(materialName || listing.material_name, quantity || listing.total_quantity, listingId);
      }

      // Update composition (OFFER) if provided
      if (composition && composition.length > 0) {
        // Delete old composition
        db.prepare("DELETE FROM batch_composition WHERE listing_id = ?").run(listingId);
        // Insert new composition
        const insertComp = db.prepare(`
          INSERT INTO batch_composition (listing_id, chem_id, percentage)
          VALUES (?, ?, ?)
        `);
        for (const c of composition) {
          insertComp.run(listingId, c.chemId, Number(c.percentage));
        }
      }

      // Update criteria (DEMAND) if provided
      if (criteria && criteria.length > 0) {
        // Delete old criteria
        db.prepare("DELETE FROM acceptance_criteria WHERE listing_id = ?").run(listingId);
        // Insert new criteria
        const insertCrit = db.prepare(`
          INSERT INTO acceptance_criteria (listing_id, chem_id, min_percentage, max_percentage)
          VALUES (?, ?, ?, ?)
        `);
        for (const c of criteria) {
          insertCrit.run(
            listingId,
            c.chemId,
            c.minPercentage != null ? Number(c.minPercentage) : null,
            c.maxPercentage != null ? Number(c.maxPercentage) : null
          );
        }
      }

      // Fetch updated listing
      return db.prepare(`
        SELECT l.id, l.user_id, l.type, l.material_name, l.total_quantity,
               l.status, l.created_at AS createdAt,
               u.name AS userName, u.industry_type, u.location
        FROM listings l
        JOIN users u ON u.id = l.user_id
        WHERE l.id = ?
      `).get(listingId);
    });

    const updatedListing = updateTransaction();

    const updatedComposition = db.prepare(`
      SELECT bc.listing_id, bc.chem_id, bc.percentage,
             c.name AS chemName, c.hazard_level
      FROM batch_composition bc
      JOIN chemicals c ON c.id = bc.chem_id
      WHERE bc.listing_id = ?
      ORDER BY bc.percentage DESC
    `).all(listingId);

    const updatedCriteria = db.prepare(`
      SELECT ac.listing_id, ac.chem_id, ac.min_percentage, ac.max_percentage,
             c.name AS chemName, c.hazard_level
      FROM acceptance_criteria ac
      JOIN chemicals c ON c.id = ac.chem_id
      WHERE ac.listing_id = ?
      ORDER BY c.name ASC
    `).all(listingId);

    return res.json({
      message: "Listing updated successfully.",
      listing: {
        ...updatedListing,
        composition: updatedComposition,
        criteria: updatedCriteria,
        user: {
          name: updatedListing.userName,
          industry_type: updatedListing.industry_type,
          location: updatedListing.location,
        },
      },
    });
  } catch (err) {
    console.error("updateListing error:", err);
    return res.status(500).json({ error: "Failed to update listing." });
  }
};

// DELETE /api/listings/:id — delete a listing
exports.deleteListing = (req, res) => {
  try {
    const listingId = Number(req.params.id);
    const userId = req.user.id;

    if (!listingId) {
      return res.status(400).json({ error: "Valid listing id is required." });
    }

    const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found." });
    }

    if (listing.user_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own listings." });
    }

    // Delete transaction
    const deleteTransaction = db.transaction(() => {
      // Delete composition/criteria rows first
      db.prepare("DELETE FROM batch_composition WHERE listing_id = ?").run(listingId);
      db.prepare("DELETE FROM acceptance_criteria WHERE listing_id = ?").run(listingId);
      // Delete the listing
      const result = db.prepare("DELETE FROM listings WHERE id = ?").run(listingId);
      return result.changes;
    });

    const changes = deleteTransaction();

    if (changes === 0) {
      return res.status(400).json({ error: "Failed to delete listing." });
    }

    return res.json({
      message: "Listing deleted successfully.",
    });
  } catch (err) {
    console.error("deleteListing error:", err);
    return res.status(500).json({ error: "Failed to delete listing." });
  }
};

// ============================================================
// SEARCH CONTROLLER — The complex SQL logic lives here.
// Every query is hand-written SQL. No ORM.
//
// Three endpoints:
//   1. matchListings  — EXISTS subqueries with dynamic filters
//   2. matchBuyers    — JOIN + GROUP BY + HAVING COUNT (the star query)
//   3. findProcessors — graph-path JOINs (1-hop and 2-hop)
// ============================================================
const db = require("../config/database");

// ============================================================
// POST /api/search/match
//
// Manual filter search: find OFFER listings where composition
// meets user-specified constraints.
//
// SQL CONCEPTS USED:
//   - EXISTS subquery (one per filter)
//   - Dynamic SQL construction with parameterized queries
//   - JOIN (listings ↔ users)
//   - Correlated subquery (bc.listing_id = l.id)
// ============================================================
exports.matchListings = (req, res) => {
  try {
    const { filters } = req.body;

    if (!filters || !filters.length) {
      return res.status(400).json({ error: "At least one filter is required." });
    }

    const allowedOps = ["<", ">", "<=", ">=", "="];
    const conditions = [];
    const params = [];

    // Build one EXISTS subquery per filter
    filters.forEach((f) => {
      if (!allowedOps.includes(f.operator)) {
        throw new Error(`Invalid operator: ${f.operator}`);
      }

      // Each filter becomes:
      //   EXISTS (SELECT 1 FROM batch_composition
      //           WHERE listing_id = l.id AND chem_id = ? AND percentage <op> ?)
      conditions.push(`
        EXISTS (
          SELECT 1 FROM batch_composition bc
          WHERE bc.listing_id = l.id
            AND bc.chem_id = ?
            AND bc.percentage ${f.operator} ?
        )
      `);
      params.push(f.chemId, Number(f.value));
    });

    const sql = `
      SELECT
        l.id, l.type, l.material_name, l.total_quantity,
        l.status, l.created_at AS createdAt,
        u.name AS user_name, u.industry_type, u.location
      FROM listings l
      JOIN users u ON u.id = l.user_id
      WHERE l.status = 'ACTIVE'
        AND ${conditions.join(" AND ")}
      ORDER BY l.created_at DESC
    `;

    const results = db.prepare(sql).all(...params);

    // Fetch full composition for matched listings
    if (results.length > 0) {
      const ids = results.map((r) => r.id);
      const placeholders = ids.map(() => "?").join(",");

      const compositions = db.prepare(`
        SELECT bc.listing_id, bc.chem_id, bc.percentage,
               c.name AS chem_name, c.hazard_level
        FROM batch_composition bc
        JOIN chemicals c ON c.id = bc.chem_id
        WHERE bc.listing_id IN (${placeholders})
      `).all(...ids);

      const compMap = {};
      for (const c of compositions) {
        if (!compMap[c.listing_id]) compMap[c.listing_id] = [];
        compMap[c.listing_id].push(c);
      }

      for (const r of results) {
        r.composition = compMap[r.id] || [];
      }
    }

    return res.json(results);
  } catch (err) {
    console.error("matchListings error:", err);
    return res.status(500).json({ error: err.message || "Search failed." });
  }
};

// ============================================================
// POST /api/search/match-buyers
//
// ★ THE STAR QUERY — "Find a buyer for my waste listing #X" ★
//
// Given a supply listing's batch_composition, find all DEMAND
// listings whose acceptance_criteria are FULLY satisfied.
//
// SQL CONCEPTS USED:
//   - Multi-table JOIN (5 tables in one query)
//   - Correlated subquery (total criteria count)
//   - GROUP BY with HAVING COUNT (ensure ALL criteria match)
//   - NULL-safe comparisons (IS NULL OR ...)
//   - Aggregate functions: COUNT()
//
// LOGIC:
//   For EVERY chemical the buyer cares about, the seller's
//   percentage must fall within [min_percentage, max_percentage].
//   We GROUP BY demand listing and use HAVING COUNT = total
//   criteria count to ensure ALL criteria are satisfied.
// ============================================================
exports.matchBuyers = (req, res) => {
  try {
    const { supplyListingId } = req.body;

    if (!supplyListingId) {
      return res.status(400).json({ error: "supplyListingId is required." });
    }

    const matches = db.prepare(`
      SELECT
        demand.id                   AS demand_id,
        demand.material_name        AS demand_material,
        demand.total_quantity        AS demand_quantity,
        buyer.name                  AS buyer_name,
        buyer.industry_type         AS buyer_industry,
        buyer.location              AS buyer_location,
        COUNT(ac.id)                AS matched_criteria,
        total_crit.total            AS total_criteria

      FROM listings demand

      -- Join buyer info
      JOIN users buyer
        ON buyer.id = demand.user_id

      -- Join the buyer's acceptance criteria
      JOIN acceptance_criteria ac
        ON ac.listing_id = demand.id

      -- Join the SELLER's composition, matching on the SAME chemical
      JOIN batch_composition mc
        ON mc.listing_id = ?
        AND mc.chem_id = ac.chem_id

      -- Subquery: count total criteria per demand listing
      JOIN (
        SELECT listing_id, COUNT(*) AS total
        FROM acceptance_criteria
        GROUP BY listing_id
      ) total_crit
        ON total_crit.listing_id = demand.id

      WHERE demand.type   = 'DEMAND'
        AND demand.status = 'ACTIVE'
        -- NULL-safe range check:
        AND (ac.min_percentage IS NULL OR mc.percentage >= ac.min_percentage)
        AND (ac.max_percentage IS NULL OR mc.percentage <= ac.max_percentage)

      GROUP BY
        demand.id, demand.material_name, demand.total_quantity,
        buyer.name, buyer.industry_type, buyer.location,
        total_crit.total

      -- THE KEY: only return demands where ALL criteria matched
      HAVING COUNT(ac.id) = total_crit.total

      ORDER BY demand.created_at DESC
    `).all(supplyListingId);

    // Check hazard compatibility for the supply listing
    const hazardWarnings = db.prepare(`
      SELECT
        mc1.chem_id     AS chem_a,
        mc2.chem_id     AS chem_b,
        c1.name         AS chem_a_name,
        c2.name         AS chem_b_name
      FROM batch_composition mc1
      JOIN batch_composition mc2
        ON mc1.listing_id = mc2.listing_id
        AND mc1.chem_id < mc2.chem_id
      JOIN hazard_matrix hm
        ON hm.chem_id_1 = mc1.chem_id
        AND hm.chem_id_2 = mc2.chem_id
        AND hm.is_incompatible = 1
      JOIN chemicals c1 ON c1.id = mc1.chem_id
      JOIN chemicals c2 ON c2.id = mc2.chem_id
      WHERE mc1.listing_id = ?
    `).all(supplyListingId);

    return res.json({
      matches,
      hazardWarnings,
      note: hazardWarnings.length > 0
        ? "Transport hazard detected — some chemicals in this waste are incompatible."
        : null,
    });
  } catch (err) {
    console.error("matchBuyers error:", err);
    return res.status(500).json({ error: err.message || "Buyer matching failed." });
  }
};

// ============================================================
// POST /api/search/find-processors
//
// GRAPH LOGIC — "Find a processing path from Chemical A → B"
//
// SQL CONCEPTS USED:
//   - Self-JOIN on process_capabilities (pc1 JOIN pc2)
//   - Multi-table JOIN (process_capabilities ↔ users ↔ chemicals)
//   - Computed column (efficiency multiplication)
//   - Inequality filter (pc1.id != pc2.id — prevent self-join on same row)
//
// PATHS:
//   1-hop: X → Y via Processor C
//   2-hop: X → Z (via C1) → Y (via C2)
// ============================================================
exports.findProcessors = (req, res) => {
  try {
    const { inputChemId, outputChemId } = req.body;

    if (!inputChemId || !outputChemId) {
      return res.status(400).json({ error: "inputChemId and outputChemId are required." });
    }

    // 1-hop: direct conversion X → Y
    const directPaths = db.prepare(`
      SELECT
        pc.id                       AS capability_id,
        u.id                        AS processor_id,
        u.name                      AS processor_name,
        u.location                  AS processor_location,
        c_in.name                   AS input_name,
        c_out.name                  AS output_name,
        pc.conversion_efficiency,
        1                           AS hops
      FROM process_capabilities pc
      JOIN users u       ON u.id = pc.processor_id
      JOIN chemicals c_in  ON c_in.id = pc.input_chem_id
      JOIN chemicals c_out ON c_out.id = pc.output_chem_id
      WHERE pc.input_chem_id  = ?
        AND pc.output_chem_id = ?
    `).all(inputChemId, outputChemId);

    // 2-hop: X → Z (Processor C1) → Y (Processor C2)
    // This is a SELF-JOIN on process_capabilities
    const twoHopPaths = db.prepare(`
      SELECT
        pc1.id                      AS step1_id,
        u1.name                     AS processor1_name,
        u1.location                 AS processor1_location,
        c_mid.name                  AS intermediate_chemical,
        pc1.conversion_efficiency   AS step1_efficiency,
        pc2.id                      AS step2_id,
        u2.name                     AS processor2_name,
        u2.location                 AS processor2_location,
        pc2.conversion_efficiency   AS step2_efficiency,
        (pc1.conversion_efficiency * pc2.conversion_efficiency) AS total_efficiency,
        2                           AS hops
      FROM process_capabilities pc1
      -- Self-join: output of step 1 = input of step 2
      JOIN process_capabilities pc2
        ON pc1.output_chem_id = pc2.input_chem_id
      JOIN users u1     ON u1.id = pc1.processor_id
      JOIN users u2     ON u2.id = pc2.processor_id
      JOIN chemicals c_mid ON c_mid.id = pc1.output_chem_id
      WHERE pc1.input_chem_id  = ?
        AND pc2.output_chem_id = ?
        AND pc1.id != pc2.id
    `).all(inputChemId, outputChemId);

    return res.json({
      directPaths,
      twoHopPaths,
      totalRoutes: directPaths.length + twoHopPaths.length,
    });
  } catch (err) {
    console.error("findProcessors error:", err);
    return res.status(500).json({ error: err.message || "Processor search failed." });
  }
};

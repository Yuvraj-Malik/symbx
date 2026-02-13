// ============================================================
// AI Prompt Parser — Rule-Based (Regex) implementation.
// This is the dev-mode "AI" that extracts chemical names and
// numeric constraints from a natural language prompt.
//
// DESIGN: This is an ENHANCEMENT. If it fails, the user still
// has the manual dropdowns to set filters. The frontend never
// auto-submits based on this output — it only pre-fills fields.
// ============================================================

// Map of common chemical names/aliases → master data IDs
const CHEM_ALIASES = {
  "lead":       "PB",
  "pb":         "PB",
  "sulfur":     "S",
  "sulphur":    "S",
  "s":          "S",
  "sulfate":    "SO4",
  "sulphate":   "SO4",
  "so4":        "SO4",
  "silicon dioxide": "SIO2",
  "silica":     "SIO2",
  "sio2":       "SIO2",
  "alumina":    "AL2O3",
  "aluminum oxide": "AL2O3",
  "al2o3":      "AL2O3",
  "iron oxide": "FE2O3",
  "fe2o3":      "FE2O3",
  "calcium oxide": "CAO",
  "calcium":    "CAO",
  "cao":        "CAO",
  "magnesium oxide": "MGO",
  "magnesia":   "MGO",
  "mgo":        "MGO",
  "mercury":    "HG",
  "hg":         "HG",
  "arsenic":    "AS",
  "as":         "AS",
  "cadmium":    "CD",
  "cd":         "CD",
  "chromium":   "CR",
  "cr":         "CR",
  "zinc":       "ZN",
  "zn":         "ZN",
  "copper":     "CU",
  "cu":         "CU",
  "nickel":     "NI",
  "ni":         "NI",
  "water":      "H2O",
  "h2o":        "H2O",
  "nitrogen":   "N",
  "n":          "N",
};

// POST /api/utils/parse-prompt
exports.parsePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "A text prompt is required." });
    }

    const text = prompt.toLowerCase();
    const filters = [];

    // Strategy: scan for patterns like "less than 1% sulfur", "sulfur < 1",
    // "lead below 5%", "at least 60% silica", "silica > 50", etc.

    // Build a regex-friendly list of chemical names (sorted longest first to avoid partial matches)
    const chemNames = Object.keys(CHEM_ALIASES).sort((a, b) => b.length - a.length);
    const chemPattern = chemNames.join("|");

    // Regex: captures [chemical] [operator words] [number]
    const patterns = [
      // "sulfur less than 5%" or "sulfur < 5"
      new RegExp(`(${chemPattern})\\s*(?:less than|below|under|<|<=)\\s*(\\d+\\.?\\d*)\\s*%?`, "gi"),
      // "less than 5% sulfur"
      new RegExp(`(?:less than|below|under|<|<=)\\s*(\\d+\\.?\\d*)\\s*%?\\s*(?:of\\s+)?(${chemPattern})`, "gi"),
      // "sulfur more than 50%" or "sulfur > 50"
      new RegExp(`(${chemPattern})\\s*(?:more than|above|over|greater than|>|>=|at least)\\s*(\\d+\\.?\\d*)\\s*%?`, "gi"),
      // "more than 50% silica" or "at least 60% silica"
      new RegExp(`(?:more than|above|over|greater than|>|>=|at least)\\s*(\\d+\\.?\\d*)\\s*%?\\s*(?:of\\s+)?(${chemPattern})`, "gi"),
    ];

    const seen = new Set(); // avoid duplicate filters

    // Patterns 0 and 2: chemical first, then number
    [0, 2].forEach((idx) => {
      let match;
      const isLessThan = idx === 0;
      while ((match = patterns[idx].exec(text)) !== null) {
        const chemName = match[1].toLowerCase();
        const value = parseFloat(match[2]);
        const chemId = CHEM_ALIASES[chemName];
        const key = `${chemId}-${isLessThan ? "<" : ">"}`;
        if (chemId && !seen.has(key)) {
          seen.add(key);
          filters.push({ chemId, operator: isLessThan ? "<" : ">", value });
        }
      }
    });

    // Patterns 1 and 3: number first, then chemical
    [1, 3].forEach((idx) => {
      let match;
      const isLessThan = idx === 1;
      while ((match = patterns[idx].exec(text)) !== null) {
        const value = parseFloat(match[1]);
        const chemName = match[2].toLowerCase();
        const chemId = CHEM_ALIASES[chemName];
        const key = `${chemId}-${isLessThan ? "<" : ">"}`;
        if (chemId && !seen.has(key)) {
          seen.add(key);
          filters.push({ chemId, operator: isLessThan ? "<" : ">", value });
        }
      }
    });

    // Also try to extract a material name (e.g., "fly ash", "slag", "gypsum")
    const materialKeywords = ["fly ash", "slag", "gypsum", "red mud", "bottom ash", "clinker", "phosphogypsum", "blast furnace slag"];
    let materialHint = null;
    for (const kw of materialKeywords) {
      if (text.includes(kw)) {
        materialHint = kw.replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
        break;
      }
    }

    return res.json({
      parsed: true,
      filters,
      materialHint,
      rawPrompt: prompt,
      note: "Review and adjust the filters below before searching.",
    });
  } catch (err) {
    console.error("parsePrompt error:", err);
    // Graceful degradation — return empty filters so the UI still works
    return res.json({
      parsed: false,
      filters: [],
      materialHint: null,
      rawPrompt: req.body.prompt || "",
      note: "Could not parse prompt. Please use manual filters.",
    });
  }
};

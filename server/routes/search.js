const router = require("express").Router();
const searchController = require("../controllers/searchController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/match", searchController.matchListings);
router.post("/match-buyers", searchController.matchBuyers);
router.post("/find-processors", searchController.findProcessors);

// Offer decision workflow
router.post("/decisions/respond", authMiddleware, searchController.respondDecision);

module.exports = router;

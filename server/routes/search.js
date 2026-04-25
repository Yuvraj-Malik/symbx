const router = require("express").Router();
const searchController = require("../controllers/searchController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/match", searchController.matchListings);
router.post("/match-buyers", searchController.matchBuyers);
router.post("/find-processors", searchController.findProcessors);

// Offer decision workflow (two-step handshake)
router.post("/decisions/create", authMiddleware, searchController.createDecision);
router.post("/decisions/respond", authMiddleware, searchController.respondDecision);
router.get("/decisions/offer/:offerListingId", authMiddleware, searchController.getOfferDecisions);

module.exports = router;

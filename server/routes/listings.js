const router = require("express").Router();
const listingsController = require("../controllers/listingsController");
const authMiddleware = require("../middleware/authMiddleware");

// Public: anyone can browse
router.get("/", listingsController.getListings);

// Protected: must be logged in to create listings
router.post("/", authMiddleware, listingsController.createListing);

// Protected: get user's own listings
router.get("/my", authMiddleware, listingsController.getMyListings);

module.exports = router;

const router = require("express").Router();
const listingsController = require("../controllers/listingsController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected: must be logged in to create listings
router.post("/", authMiddleware, listingsController.createListing);
// Public: anyone can browse
router.get("/", listingsController.getListings);

module.exports = router;

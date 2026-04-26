const router = require("express").Router();
const listingsController = require("../controllers/listingsController");
const authMiddleware = require("../middleware/authMiddleware");

// Protected: must be logged in to browse listings
router.get("/", authMiddleware, listingsController.getListings);

// Protected: must be logged in to create listings
router.post("/", authMiddleware, listingsController.createListing);

// Protected: get user's own listings
router.get("/my", authMiddleware, listingsController.getMyListings);

// Protected: get one listing details
router.get("/:id", authMiddleware, listingsController.getListingById);

// Protected: update a listing
router.put("/:id", authMiddleware, listingsController.updateListing);

// Protected: delete a listing
router.delete("/:id", authMiddleware, listingsController.deleteListing);

module.exports = router;

const router = require("express").Router();
const searchController = require("../controllers/searchController");

router.post("/match", searchController.matchListings);
router.post("/match-buyers", searchController.matchBuyers);
router.post("/find-processors", searchController.findProcessors);

module.exports = router;

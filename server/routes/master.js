const router = require("express").Router();
const masterController = require("../controllers/masterController");

router.get("/chemicals", masterController.getChemicals);

module.exports = router;

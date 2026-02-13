const router = require("express").Router();
const utilsController = require("../controllers/utilsController");

router.post("/parse-prompt", utilsController.parsePrompt);

module.exports = router;

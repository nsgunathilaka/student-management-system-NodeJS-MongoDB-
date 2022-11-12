const express = require("express");
const { registerStudent, login } = require("../controllers/studentController");
const router = express.Router();

router.post("/register", registerStudent)
router.post("/login", login)


module.exports = router;
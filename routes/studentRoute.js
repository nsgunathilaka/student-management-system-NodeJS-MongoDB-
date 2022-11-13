const express = require("express");
const protectRoutes = require("../controllers/authMiddleware");
const { registerStudent, login, logOut, getStudent, loginStatus } = require("../controllers/studentController");
const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", login);
router.get("/logout", logOut);
router.get("/getStudent", protectRoutes, getStudent);
router.get("/loggedIn", loginStatus);


module.exports = router;
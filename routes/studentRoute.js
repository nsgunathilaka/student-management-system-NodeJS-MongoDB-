const express = require("express");
const protectRoutes = require("../controllers/authMiddleware");
const { registerStudent, login, logOut, getStudent, loginStatus, updateStudent, changePassword } = require("../controllers/studentController");
const router = express.Router();

router.post("/register", registerStudent);
router.post("/login", login);
router.get("/logout", logOut);
router.get("/getStudent", protectRoutes, getStudent);
router.get("/loggedIn", loginStatus);
router.patch("/updateStudent", protectRoutes, updateStudent);
router.patch("/changePassword", protectRoutes, changePassword);


module.exports = router;
const asyncHandler = require("express-async-handler");
const Student = require("../models/studentModel");
const jwt = require("jsonwebtoken");

const protectRoutes = asyncHandler(async (req, res, next) => {

    try {
        const token = req.cookies.token
        if (!token) {
            res.status(401)
            throw new Error("Not authorized, Please login")
        }

        //verify token
        const verified = jwt.verify(token, process.env.JWT_SECRET)
        //get user id from token
        const student = await Student.findById(verified.id).select("-password")

        if (!student) {
            res.status(401)
            throw new Error("User not found")
        }
        req.student = student
        next()

    } catch (error) {
        res.status(401)
        throw new Error("Not authorized, Please login")
    }
});

module.exports = protectRoutes;
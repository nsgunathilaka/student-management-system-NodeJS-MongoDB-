const asyncHandler = require("express-async-handler");
const Student = require("../models/studentModel");

const registerStudent = asyncHandler(async (req, res) => {

    const { name, faculty, batch, email, phone, password } = req.body;

    if (!name || !faculty || !batch || !email || !phone || !password) {
        res.status(400)
        throw new Error("Please fill in all required fields")
    }
    if (password.length < 6) {
        res.status(400)
        throw new Error("Password should be upto 6 characters")
    }

    //check if email is already exists
    const studentExists = await Student.findOne({ email });

    if (studentExists) {
        res.status(400)
        throw new Error("Provided email is already registered")
    }

    const student = await Student.create({
        name,
        faculty,
        batch,
        email,
        phone,
        password
    });

    if (student) {
        res.status(200).json({
            _id: student.id,
            name: student.name,
            email: student.email
        })
    } else {
        res.status(400)
        throw new Error("Invalid student data!")
    }
});


module.exports = {
    registerStudent
}
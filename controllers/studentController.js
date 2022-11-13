const asyncHandler = require("express-async-handler");
const Student = require("../models/studentModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

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

    //generate token
    const token = generateToken(student._id)  //_id <= this because in the mongodb database id property like this.

    // send http-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1 day
        sameSite: "none",
        secure: true,
    });

    if (student) {
        res.status(200).json({
            id: student._id,
            name: student.name,
            email: student.email,
            token,
        });
    } else {
        res.status(400)
        throw new Error("Invalid student data!")
    }
});



const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400)
        throw new Error("Please fill all required fields")
    }

    //check user availability
    const studentExists = await Student.findOne({ email });

    if (!studentExists) {
        res.status(400)
        throw new Error("User not found.Please create a new account")
    }

    // check password is correct or not
    const passwordIsValid = await bcrypt.compare(password, studentExists.password);

    //generate token
    const token = generateToken(studentExists._id);

    // send http-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //one day
        sameSite: "none",
        secure: true
    });

    if (studentExists && passwordIsValid) {
        res.status(200).json({
            id: studentExists._id,
            name: studentExists.name,
            faculty: studentExists.faculty,
            batch: studentExists.batch,
            phone: studentExists.phone,
            email: studentExists.email,
            avatar: studentExists.avatar,
            bio: studentExists.bio,
            token
        });
    } else {
        res.status(400)
        throw new Error("Invalid email or password. Please try again later.")
    }

});


const logOut = asyncHandler(async (req, res) => {
    res.clearCookie('token');

    return res.status(200).json({ message: 'Successfully logged out!' })
});


const getStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.student._id)

    if (student) {
        res.status(200).json({
            id: student._id,
            name: student.name,
            faculty: student.faculty,
            batch: student.batch,
            phone: student.phone,
            email: student.email,
            avatar: student.avatar,
            bio: student.bio,
        });
    } else {
        res.status(404)
        throw new Error("User Not Found!")
    }

});

const loginStatus = asyncHandler(async (req, res) => {

    const token = req.cookies.token;
    if (!token) {
        return res.json(false);
    }

    //verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (verified) {
        return res.json(true)
    }
    return res.json(false);

});


const updateStudent = asyncHandler(async (req, res) => {
    const student = await Student.findById(req.student._id);

    if (student) {

        const { name, faculty, batch, phone, email, avatar, bio } = student;

        student.name = req.body.name || name;
        student.faculty = req.body.faculty || faculty;
        student.batch = req.body.batch || batch;
        student.phone = req.body.phone || phone;
        student.email = email; //doesn't allow change email address to user
        student.avatar = req.body.avatar || avatar;
        student.bio = req.body.bio || bio;

        const updatedStudent = await Student.save();
        res.status(200).json("Profile data updated successfully!")
    } else {
        res.status(400)
        throw new Error("User Not Found")
    }

});


const changePassword = asyncHandler(async (req, res) => {

    const student = await Student.findById(req.student._id)

    if (student) {

        if (!req.body.newPassword || !req.body.oldPassword) {

            const passwordIsValid = await bcrypt.compare(req.body.newPassword, student.password);

            if (passwordIsValid) {
                student.password = req.body.newPassword;
                await student.save()
                res.status(200).json("Password updated successfully!")
            } else {
                res.status(400)
                throw new Error("Password doesn't match!")
            }
        }

        else {
            res.status(400)
            throw new Error("Please enter old password and new password")
        }


    } else {
        res.status(400).json("User Not Found!")
    }
});

const forgotPassword = asyncHandler(async (req, res) => {

    const { email } = req.body;

    const student = await Student.findOne({ email });

    if (!student) {
        res.status(404)
        throw new Error("User Not Found!")
    }

    // Delete token if it exists in DB
    const token = await Token.findOne({ userId: student._id });
    if (token) {
        await token.deleteOne();
    }

    //create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + student._id;
   // console.log(resetToken);

    // Hash token before saving to DB
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");


    // Save Token to DB
    await new Token({
        userId: student._id,
        token: hashedToken,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();

    // Construct Reset Url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

    // Reset Email
    const message = `
      <p>Hello ${student.name},</p>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30 minutes.</p>

      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>

      <p>Regards,</p>
      <p>Student Management Team</p>
    `;
    const subject = "Password Reset Request";
    const send_to = student.email;
    const sent_from = process.env.EMAIL_USER;

    try {
        await sendEmail(subject, message, send_to, sent_from);
        res.status(200).json({ success: true, message: "Reset Email Sent" });
    } catch (error) {
        res.status(500);
        throw new Error("Email not sent, please try again");
    }
});


const resetPassword = asyncHandler(async(req, res) => {

    const {password} = req.body;
    const {resetToken} = req.params;

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const studentToken = await Token.findOne({token:hashedToken, expiresAt:{$gt:Date.now()}}) //gt = greater than

    if(!studentToken) {
        res.status(404)
        throw new Error("Invalid or Expired Token")
    }

    const student = await Student.findOne({_id : studentToken.userId})
    student.password = password
    await student.save()
    res.status(200).json({message:"Password Reset Successfully"})

});



module.exports = {
    registerStudent,
    login,
    logOut,
    getStudent,
    loginStatus,
    updateStudent,
    changePassword,
    forgotPassword,
    resetPassword
}
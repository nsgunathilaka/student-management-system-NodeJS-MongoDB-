const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const studentSchema = mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please enter name"]
    },
    faculty: {
        type: String,
        required: [true, "Please enter faculty"]
    },
    batch: {
        type: String,
        required: [true, "Please enter batch"]
    },
    phone: {
        type: String,
        required: [true, "Please enter phone number"]
    },
    email: {
        type: String,
        required: [true, "Please enter name"],
        unique: true,
        trim: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please enter a valid email"
        ]
    },
    avatar: {
        type: String,
        required: [true, "Please upload profile picture"],
        default: "https://storage.googleapis.com/covid-19-self-care-app.appspot.com/avatars/default-avatar.png"
    },
    bio: {
        type: String,
        maxLength: [250, "Bio should not be more than 250 characters"],
        default: "I am a student"
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
        minLength: [6, "Password should be up to 6 characters"]
    },
},
    {
        timestamps: true,
    });

    studentSchema.pre("save", async function(next) {
        if(!this.isModified("password")) {
            return next();
        }

        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(this.password, salt);
        this.password = encryptedPassword
        next();
    })

const Student = mongoose.model("Student", studentSchema)

module.exports = Student;
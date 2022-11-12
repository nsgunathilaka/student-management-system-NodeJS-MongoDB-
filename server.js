const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const errorHandler = require("./middleWare/errorMiddleware");

const studentRoute = require("./routes/studentRoute")

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
   // origin: ["http://localhost:3000", "https://pinvent-app.vercel.app"],
   origin: "*",
    credentials: true,
  })
);


// Routes middleware
app.use("/api/students", studentRoute);

const PORT = process.env.PORT || 8083;

// Routes

app.get("/", (req, res) => {
    res.send("Hi from API")
});

//error middleware
app.use(errorHandler);


// connect to mongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server Running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

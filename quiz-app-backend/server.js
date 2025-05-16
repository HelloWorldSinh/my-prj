require("dotenv").config();

const express = require("express");
const passport = require("passport");
const cors = require("cors");
const session = require("express-session"); // Thêm module này
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const examRoutes = require("./routes/exams");
const submissionRoutes = require("./routes/submissions");

// Initialize the app
const app = express();

// Connect to the database
connectDB();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Configure express-session
app.use(
    session({
        secret: process.env.SESSION_SECRET || "your-session-secret", // Cung cấp một secret (có thể đặt trong .env)
        resave: false,
        saveUninitialized: false,
    })
);

// Passport setup
require("./config/passport");
app.use(passport.initialize());
app.use(passport.session()); // Thêm passport.session() để hỗ trợ session

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/submissions", submissionRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

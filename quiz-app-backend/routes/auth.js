const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Google OAuth routes
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account", // Thêm tham số prompt
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async (req, res) => {
        const user = req.user;
        console.log("Google callback - User from DB:", user); // Debug
        if (user.role === null) {
            console.log(
                "Google callback - Role is null, redirecting to /select-role"
            ); // Debug
            return res.redirect(
                `http://localhost:3000/select-role?googleId=${user.googleId}`
            );
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
        );
        console.log("Google callback - Redirecting to dashboard with:", {
            token,
            role: user.role,
        }); // Debug
        res.redirect(
            `http://localhost:3000/dashboard?token=${token}&role=${user.role}`
        );
    }
);

// Route to set role during first registration
router.post("/set-role", async (req, res) => {
    const { googleId, role } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { googleId },
            { role },
            { new: true }
        );
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30m" }
        );
        res.status(200).json({ token, role: user.role });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;

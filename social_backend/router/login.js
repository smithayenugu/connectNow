const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Login Route
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt:", { email, password });
    // Find user by email
    const user = await User.findOne({ email });
    console.log("User found:", user);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    // Check password using bcrypt
    const isMatch = await user.comparePassword(password);
    console.log("Password match:", isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Success", user: { name: user.name, email: user.email, userId: user.userId } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error });
  }
});

module.exports = router; 
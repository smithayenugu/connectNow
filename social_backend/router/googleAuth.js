const express = require("express");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Login/Signup Route
router.post("/", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email but different auth provider
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = googleId;
        existingUser.authProvider = "google";
        if (!existingUser.profilePicture && picture) {
          existingUser.profilePicture = picture;
        }
        await existingUser.save();
        user = existingUser;
      } else {
        // Create new user
        const userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        user = new User({
          name,
          email,
          googleId,
          authProvider: "google",
          profilePicture: picture,
          userId,
        });
        await user.save();
      }
    }

    res.json({
      message: "Success",
      user: {
        name: user.name,
        email: user.email,
        userId: user.userId,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
});

module.exports = router;
const express = require("express");
const User = require("../models/User"); // Adjust the path if needed
const nodemailer = require("nodemailer");

const router = express.Router();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,  // Use your Gmail
    pass: process.env.EMAIL_PASS,  // Use the App Password
  },
});


// Function to send email
const sendRegistrationEmail = async (user) => {
  console.log("Preparing to send email to:", user.email); // Debug log

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Welcome to Our Website!",
    text: `Hello ${user.name},\n\nThank you for registering!\n\nYour details:\nName: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}\n\nBest regards,\nYour Website Team`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response); // Log success
  } catch (error) {
    console.error("Error sending email:", error); // Log errors
  }
};



// Registration Route
router.post("/", async (req, res) => {
  try {
    const { name, email, password, phone, userId } = req.body;
    console.log("Received registration request for:", email); // Debugging log

    if (!userId || !userId.trim()) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingUserId = await User.findOne({ userId });
    if (existingUserId) {
      return res.status(400).json({ message: "User ID already taken" });
    }

    const newUser = new User({ name, email, password, phone, userId });
    await newUser.save();
    console.log("User saved to database:", newUser); // Debugging log

    sendRegistrationEmail(newUser); // Send email after saving

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error });
  }
});


module.exports = router;

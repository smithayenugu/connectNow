const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  userId: { type: String, unique: true, index: true, required: true }
});

// Hash password before saving
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel = mongoose.model("mycollections", UserSchema);

module.exports = UserModel;
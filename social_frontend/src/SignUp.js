import React, { useState } from "react";
import { Link } from 'react-router-dom';
import "./App.css";
import axios from "axios";

const SignUp = ({ setSelectedTab }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/register", { name, email, password, phone, userId });
      if (response.data && response.data.message === "User registered successfully!") {
        if (setSelectedTab) setSelectedTab("Login");
      } else {
        alert("Registration failed. Please try again.");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        if (error.response.data.message === "User already exists") {
          alert("You already have an account. Please login.");
          if (setSelectedTab) setSelectedTab("Login");
        } else if (error.response.data.message === "User ID already taken") {
          alert("User ID is already taken. Please choose another.");
        } else if (error.response.data.message === "User ID is required") {
          alert("User ID is required.");
        } else {
          alert("Registration failed. Please try again.");
        }
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-outer">
      <div className="login-card">
        <h2 className="login-title">Sign Up</h2>
        <form className="login-form" onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="User ID"
            className="login-input"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Name"
            className="login-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Phone"
            className="login-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">Sign Up</button>
        </form>
        <div className="login-bottom">
          <span>Already have an account?</span>
          <Link to="/login" className="login-signin-btn">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

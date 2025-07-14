import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';
import "./App.css";

const Login = ({ setIsLoggedIn, setUserName, setUserId, setSelectedTab }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/login", { email, password });
      if (response.data && response.data.message === "Success") {
        setIsLoggedIn(true);
        setUserName(response.data.user && response.data.user.name ? response.data.user.name : "");
        setUserId(response.data.user && response.data.user.userId ? response.data.user.userId : "");
        localStorage.setItem('userId', response.data.user && response.data.user.userId ? response.data.user.userId : "");
        setSelectedTab("Posts");
        navigate("/");
      } else {
        alert("Invalid login credentials");
      }
    } catch (error) {
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-outer">
      <div className="login-card">
        <h2 className="login-title">Sign In</h2>
        <form className="login-form" onSubmit={handleLogin}>
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
          <div className="login-links">
            <a href="#" className="forgot-link">Forgot Password?</a>
          </div>
          <button type="submit" className="login-btn">Sign In</button>
        </form>
        <div className="login-bottom">
          <span>Don't have an account?</span>
          <Link to="/signup" className="login-signup-btn">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

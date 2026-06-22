import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './App.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/forgot-password`, { email });
      setMessage(res.data.message || 'Password reset link has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-outer">
      <div className="login-card">
        <h2 className="login-title">Forgot Password</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
          Enter your email address to reset your password.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="E-mail"
            className="login-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        {message && <p style={{ color: '#28a745', marginTop: '16px', fontSize: '0.9rem' }}>{message}</p>}
        {error && <p style={{ color: '#dc3545', marginTop: '16px', fontSize: '0.9rem' }}>{error}</p>}
        <div className="login-bottom">
          <span>Remember your password?</span>
          <Link to="/login" className="login-signup-btn">Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;

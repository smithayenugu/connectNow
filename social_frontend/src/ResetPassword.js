import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reset-password/${token}`);
        if (res.data.valid) {
          setValid(true);
        } else {
          setValid(false);
          setError('Invalid or expired reset link.');
        }
      } catch (err) {
        setValid(false);
        setError(err.response?.data?.error || 'Invalid or expired reset link.');
      } finally {
        setChecking(false);
      }
    };
    if (token) verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`http://localhost:5000/api/reset-password/${token}`, { password });
      setMessage(res.data.message || 'Password reset successful!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-outer">
        <div className="login-card">
          <div className="loading"><div className="spinner"></div></div>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="login-outer">
        <div className="login-card">
          <h2 className="login-title">Invalid Link</h2>
          <p style={{ color: '#dc3545', marginBottom: '20px' }}>{error || 'This reset link is invalid or has expired.'}</p>
          <div className="login-bottom">
            <span>Request a new link?</span>
            <Link to="/forgot-password" className="login-signup-btn">Forgot Password</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-outer">
      <div className="login-card">
        <h2 className="login-title">Reset Password</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.95rem' }}>
          Enter your new password below.
        </p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="login-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPassword;
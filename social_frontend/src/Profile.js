import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

function Profile() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    axios.get(`http://localhost:5000/user/${userId}`)
      .then(res => {
        setUser(res.data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setError('User not found.');
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state">{error}</div>;
  if (!user) return <div className="empty-state">User not found.</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
        <h2>{user.name}'s Profile</h2>
        <p><b>User ID:</b> {user.userId}</p>
        <p><b>Email:</b> {user.email}</p>
        {user.phone && <p><b>Phone:</b> {user.phone}</p>}
        {/* Add more fields as needed */}
      </div>
    </div>
  );
}

export default Profile; 
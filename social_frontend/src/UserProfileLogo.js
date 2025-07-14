import React, { useState } from "react";
import "./App.css";
import { Link } from 'react-router-dom';

const UserProfileLogo = ({ isLoggedIn, userName, userId, onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  if (!isLoggedIn || !userName) return null;

  const handleLogoClick = () => {
    setShowMenu((prev) => !prev);
  };

  return (
    <div className="user-logo-topright">
      <span className="user-logo-circle" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        {userName.charAt(0).toUpperCase()}
      </span>
      {showMenu && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-item"><b>{userName}</b></div>
          <div className="user-dropdown-item" style={{ fontSize: '0.85rem', color: '#888' }}>userId: {userId || 'N/A'}</div>
          {userId && (
            <Link to={`/profile/${userId}`} className="user-dropdown-item">My Profile</Link>
          )}
          <div className="user-dropdown-item" onClick={onLogout}>Logout</div>
        </div>
      )}
    </div>
  );
};

export default UserProfileLogo; 
import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { useNavigate } from 'react-router-dom';

const UserProfileLogo = ({ isLoggedIn, userName, userId, onLogout }) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn || !userName) setShowMenu(false);
  }, [isLoggedIn, userName]);


  const handleLogoClick = (e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleMenuAction = () => {
    setShowMenu(false);
  };

  useEffect(() => {
    if (!showMenu) return;

    const onDocumentMouseDown = (e) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setShowMenu(false);
    };

    document.addEventListener('mousedown', onDocumentMouseDown);

    return () => {
      document.removeEventListener('mousedown', onDocumentMouseDown);
    };
  }, [showMenu, isLoggedIn, userName]);




  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    const loadAvatar = async () => {
      if (!isLoggedIn || !userId) return;
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/user/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        setProfilePicture(data?.user?.profilePicture || null);
      } catch {
        setProfilePicture(null);
      }
    };
    loadAvatar();
  }, [isLoggedIn, userId]);

  return (
    <div className="user-logo-topright" ref={wrapperRef}>
      {/* Use profile picture if available; fallback to initials */}
      <span
        className="user-logo-circle"
        onClick={handleLogoClick}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        aria-label="User menu"
        title="View Profile"
      >
        {profilePicture ? (
          <img
            src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/uploads/${profilePicture}`}
            alt="Profile"
            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                let fallback = parent.querySelector('.user-logo-initial');
                if (!fallback) {
                  fallback = document.createElement('span');
                  fallback.className = 'user-logo-initial';
                  fallback.textContent = userName ? userName.charAt(0).toUpperCase() : 'U';
                  Object.assign(fallback.style, {
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '1.2rem'
                  });
                  parent.appendChild(fallback);
                }
                fallback.style.display = 'flex';
              }
            }}
          />
        ) : (
          <span style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #4e54c8, #8f94fb)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '1.2rem'
          }}>
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </span>
        )}
      </span>

      {showMenu && (
        <div className="user-dropdown-menu">
          <div className="user-dropdown-item"><b>{userName}</b></div>
          <div className="user-dropdown-item" style={{ fontSize: '0.85rem', color: '#888' }}>userId: {userId || 'N/A'}</div>
          {userId && (
            <>
              <div className="user-dropdown-item" onClick={() => { handleMenuAction(); navigate(`/profile/${userId}`); }}>My Profile</div>
              <div className="user-dropdown-item" onClick={() => { handleMenuAction(); navigate('/connection-requests'); }}>Connection Requests</div>
            </>
          )}
          <div className="user-dropdown-item" onClick={onLogout}>Logout</div>
        </div>
      )}
    </div>
  );
};

export default UserProfileLogo;
import { FaChevronLeft, FaChevronRight, FaThList, FaRegEdit, FaComments, FaUser, FaUserFriends, FaBookmark } from 'react-icons/fa';
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem('userId');
  const userId = localStorage.getItem('userId');
  const [unreadUsersCount, setUnreadUsersCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/chat/conversations/${userId}`);
        const conversations = res.data.conversations || [];
        const count = conversations.filter(conv => (conv.unreadCount || 0) > 0).length;
        setUnreadUsersCount(count);
      } catch (err) {
        console.error('Error fetching unread count:', err);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!isLoggedIn) return null;

  const navItems = [
    { path: '/posts', icon: <FaThList />, label: 'Posts' },
    { path: '/create', icon: <FaRegEdit />, label: 'Create' },
    { path: '/connections', icon: <FaUserFriends />, label: 'Connections' },
    { path: '/chat', icon: <FaComments />, label: 'Chat' },
    { path: '/saved-posts', icon: <FaBookmark />, label: 'Saved Posts' },
    { path: `/profile/${userId}`, icon: <FaUser />, label: 'Profile' },
  ];


  return (
    <>
      {/* Single hamburger button to toggle sidebar */}
      <button
        className={`sidebar-hamburger ${isOpen ? 'sidebar-hamburger-hidden' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <FaChevronRight />
      </button>

      <div className={`side-nav-wrap ${isOpen ? 'side-nav-open' : 'side-nav-closed'}`}>
        <nav className="side-nav" aria-label="Primary">
          <div className="side-nav-header">
            <div className="side-nav-brand">
              <FaUserFriends className="side-nav-brand-icon" />
              Connect<span className="connect-now-blue-text">Now</span>

            </div>
            <button
              type="button"
              className="side-nav-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <FaChevronLeft />
            </button>
          </div>

          <div className="side-nav-theme">
            <span>Theme</span>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => {
                const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
              }}
              title="Toggle light/dark"
            >
              <span className="theme-toggle-icon">☼</span>
            </button>
          </div>

          <div className="side-nav-items">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`side-nav-item ${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? 'active' : ''}`}
              >
                <span className="side-nav-icon">
                  {item.icon}
                  {item.label === 'Chat' && unreadUsersCount > 0 && (
                    <span className="side-nav-unread-badge">{unreadUsersCount}</span>
                  )}
                </span>
                <span className="side-nav-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;

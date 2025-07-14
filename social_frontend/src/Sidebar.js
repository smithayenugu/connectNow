import { FaHome, FaThList, FaRegEdit, FaComments, FaBars } from 'react-icons/fa';
import React, { useState } from 'react';
import './App.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Open sidebar button - visible when sidebar is closed */}
      {!isOpen && (
        <button className="sidebar-open-button" onClick={toggleSidebar}>
          <FaBars className="toggle-icon" />
        </button>
      )}
      <aside className={`sidebar${isOpen ? ' open' : ' closed'}`}>
        {isOpen && (
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <FaBars className="toggle-icon" />
          </button>
        )}
        <nav className="sidebar-nav">
          <ul>
            <li className="sidebar-item">
              <a href="/" className="sidebar-link">
                <FaHome className="sidebar-icon" /> <span>Home</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a href="/posts" className="sidebar-link">
                <FaThList className="sidebar-icon" /> <span>Posts</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a href="/create" className="sidebar-link">
                <FaRegEdit className="sidebar-icon" /> <span>Create Post</span>
              </a>
            </li>
            <li className="sidebar-item">
              <a href="/chat" className="sidebar-link">
                <FaComments className="sidebar-icon" /> <span>Chat</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
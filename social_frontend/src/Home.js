import React, { useState } from "react";
import connectNowImage from "./connectNow.webp";
import friends from "./friends.avif";
import post from "./post.jpg";
import chat from "./chat.jpg";
import "./App.css";
import axios from "axios";
import { Link } from 'react-router-dom';

const Home = ({ isLoggedIn, userName }) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchLoading(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const res = await axios.get(`http://localhost:5000/search-users?username=${encodeURIComponent(searchInput)}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      setSearchError("No users found or error searching.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="home-modern">
      {!isLoggedIn && (
        <div className="auth-buttons-topright">
          <Link to="/login" className="auth-btn login">Login</Link>
          <Link to="/signup" className="auth-btn signup">Sign Up</Link>
        </div>
      )}
      <div className="hero-section">
        <div className="hero-left">
          <h1>ConnectNow</h1>
          <p>
            ConnectNow is a social and collaborative platform focused on connecting users through posts, comments, and interactions. While it enables users to share updates, engage with content, and build communities, the platform emphasizes creating meaningful connections through text-based interactions and community-driven engagement.
          </p>
        </div>
        <div className="hero-right">
          <img src={connectNowImage} alt="ConnectNow Collage" className="hero-image" />
        </div>
      </div>
      <div className="features-row">
        <div className="feature-card">
          <img src={friends} alt="Connect with Friends" />
          <h3>Connect with Friends</h3>
          <p>
            Reconnect with old friends and discover new ones on our vibrant platform. Build meaningful relationships that last a lifetime with ease.
          </p>
        </div>
        <div className="feature-card">
          <img src={post} alt="Share Your Post" />
          <h3>Share Your Post</h3>
          <p>
            Bring your moments to life by sharing your stories, photos, and updates with friends. Let your voice be heard!
          </p>
        </div>
        <div className="feature-card">
          <img src={chat} alt="Chat with Your Friends" />
          <h3>Chat with Your Friends</h3>
          <p>
            Engage in seamless and real-time conversations with your friends anytime, anywhere. Stay connected with those who matter most.
          </p>
        </div>
      </div>
      <form className="user-search-bar" onSubmit={handleSearch} autoComplete="off">
        <input
          type="text"
          placeholder="Search users by username..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="user-search-input"
        />
        <button type="submit" className="user-search-btn">Search</button>
      </form>
      {searchLoading && <div className="user-search-loading">Searching...</div>}
      {searchError && <div className="user-search-error">{searchError}</div>}
      {searchResults.length > 0 && (
        <div className="user-search-results">
          {searchResults.map(user => (
            <div key={user._id || user.userId} className="user-search-result-item">
              <span className="user-search-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              <span className="user-search-name">{user.name}</span>
              <span className="user-search-email">{user.email}</span>
              {user.userId && (
                <Link to={`/profile/${user.userId}`} className="user-search-profile-link">View Profile</Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;

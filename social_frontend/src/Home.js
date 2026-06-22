import React from "react";
import { FaUserFriends} from 'react-icons/fa';
import connectNowImage from "./connectNow.webp";
import friends from "./friends.avif";
import post from "./post.jpg";
import chat from "./chat.jpg";
import "./App.css";
import axios from "axios";
import { Link } from 'react-router-dom';

const Home = ({ isLoggedIn, userName, userId }) => {
  // ...existing code...

  return (
    <div className="home-modern">
      {!isLoggedIn ? (
        <div className="auth-buttons-topright">
          <Link to="/login" className="auth-btn login">Login</Link>
          <Link to="/signup" className="auth-btn signup">Sign Up</Link>
        </div>
      ) : (
        <div className="auth-buttons-topright">
          <Link to={`/profile/${userId}`} className="auth-btn profile">My Profile</Link>
        </div>
      )}
      <div className="hero-section">
        <div className="hero-left">
          <h1>
            <FaUserFriends className="home-page-brand-icon" />
            Connect<span className="connect-now-blue">Now</span>
          </h1>


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
      {/* Search bar removed from Home page */}
    </div>
  );
};

export default Home;

import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './Home';
import Post from './Post';
import CreatePost from './CreatePost';
import Login from './Login';
import SignUp from './SignUp';
import Profile from './Profile';

const AppRoutes = ({ isLoggedIn, userName, setIsLoggedIn, setUserName, handleLogout, setUserId }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== '/') {
      navigate('/');
    }
    // Only run on mount/refresh
    // eslint-disable-next-line
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home isLoggedIn={isLoggedIn} userName={userName} />} />
      <Route path="/home" element={<Home isLoggedIn={isLoggedIn} userName={userName} />} />
      <Route path="/posts" element={<Post />} />
      <Route path="/create" element={<CreatePost />} />
      <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserName={setUserName} setUserId={setUserId} setSelectedTab={() => {}} />} />
      <Route path="/signup" element={<SignUp setSelectedTab={() => {}} />} />
      <Route path="/profile/:userId" element={<Profile />} />
    </Routes>
  );
};

export default AppRoutes; 
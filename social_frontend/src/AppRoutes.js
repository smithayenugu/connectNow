import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Post from './Post';
import CreatePost from './CreatePost';
import Login from './Login';
import SignUp from './SignUp';
import Profile from './Profile';
import ConnectionRequests from './ConnectionRequests';
import Chat from './Chat';
import Connections from './Connections';
import SavedPosts from './SavedPosts';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';


const AppRoutes = ({ isLoggedIn, userName, setIsLoggedIn, setUserName, handleLogout, setUserId, isSidebarOpen }) => {

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/posts" replace /> : <Home isLoggedIn={isLoggedIn} userName={userName} />} />
      <Route path="/home" element={<Home isLoggedIn={isLoggedIn} userName={userName} userId={localStorage.getItem('userId')} />} />
      <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} setUserName={setUserName} setUserId={setUserId} setSelectedTab={() => {}} />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      {isLoggedIn && <Route path="/posts" element={<Post isSidebarOpen={isSidebarOpen} />} />}
      {isLoggedIn && <Route path="/create" element={<CreatePost />} />}
      {isLoggedIn && <Route path="/profile/:userId" element={<Profile />} />}
      {isLoggedIn && <Route path="/connection-requests" element={<ConnectionRequests />} />}
      {isLoggedIn && <Route path="/connections" element={<Connections />} />}
      {isLoggedIn && <Route path="/chat" element={<Chat />} />}
      {isLoggedIn && <Route path="/saved-posts" element={<SavedPosts />} />}

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
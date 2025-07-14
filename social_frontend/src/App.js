// App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { FaHome, FaPlus, FaUsers } from 'react-icons/fa';
import Home from './Home';
import CreatePost from './CreatePost';
import './App.css';
import Post from './Post';
import Sidebar from './Sidebar';
import Login from './Login';
import SignUp from './SignUp';
import UserProfileLogo from './UserProfileLogo';
import AppRoutes from './AppRoutes';

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(() => {
		return localStorage.getItem('isLoggedIn') === 'true';
	});
	const [userName, setUserName] = useState(() => {
		return localStorage.getItem('userName') || '';
	});
	const [userId, setUserId] = useState(() => {
		return localStorage.getItem('userId') || '';
	});

	useEffect(() => {
		localStorage.setItem('isLoggedIn', isLoggedIn);
		localStorage.setItem('userName', userName);
		localStorage.setItem('userId', userId);
	}, [isLoggedIn, userName, userId]);

	const handleLogout = () => {
		setIsLoggedIn(false);
		setUserName('');
		setUserId('');
		localStorage.removeItem('isLoggedIn');
		localStorage.removeItem('userName');
		localStorage.removeItem('userId');
	};

	return (
		<Router>
			<div className="app">
				<UserProfileLogo isLoggedIn={isLoggedIn} userName={userName} userId={userId} onLogout={handleLogout} />
				{/* <header className="app-header">
					<div className="header-content">
						<div className="logo">
							<FaUsers />
							<span>ConnectNow</span>
						</div>
						<p className="tagline">Share your moments with the world</p>
					</div>
				</header> */}
				
				<nav>
					<ul>
						<li>
							<Link to="/">
								<FaHome /> Home
							</Link>
						</li>
						<li>
							<Link to="/posts">
								<FaUsers /> Posts
							</Link>
						</li>
						<li>
							<Link to="/create">
								<FaPlus /> Create Post
							</Link>
						</li>
					</ul>
				</nav>
				
				<main className="main-content">
					<AppRoutes
						isLoggedIn={isLoggedIn}
						userName={userName}
						setIsLoggedIn={setIsLoggedIn}
						setUserName={setUserName}
						setUserId={setUserId}
						userId={userId}
						handleLogout={handleLogout}
					/>
				</main>
			</div>
			<Sidebar />
		</Router>
	);
}

export default App;
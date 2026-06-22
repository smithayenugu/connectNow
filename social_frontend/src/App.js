// App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import Sidebar from './Sidebar';
import Login from './Login';
import SignUp from './SignUp';
import UserProfileLogo from './UserProfileLogo';
import AppRoutes from './AppRoutes';

function App() {
	const [isLoggedIn, setIsLoggedIn] = useState(() => {
		return localStorage.getItem('isLoggedIn') === 'true';
	});
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	useEffect(() => {
		const saved = localStorage.getItem('theme');
		if (saved) document.documentElement.setAttribute('data-theme', saved);
		else if (!document.documentElement.getAttribute('data-theme')) {
			document.documentElement.setAttribute('data-theme', 'dark');
		}
	}, []);

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
	<GoogleOAuthProvider clientId="42823744638-ud598qraqg5hcqp0bi4fg41b2lvr87b7.apps.googleusercontent.com">
	<Router>
	  <div className={`app ${isLoggedIn && isSidebarOpen ? 'app-sidebar-open' : 'app-sidebar-closed'}`}>
	{isLoggedIn && <UserProfileLogo isLoggedIn={isLoggedIn} userName={userName} userId={userId} onLogout={handleLogout} />}
		<main className="main-content">
      <AppRoutes
			isLoggedIn={isLoggedIn}
			userName={userName}
			setIsLoggedIn={setIsLoggedIn}
			setUserName={setUserName}
			setUserId={setUserId}
			userId={userId}
			handleLogout={handleLogout}
			isSidebarOpen={isSidebarOpen}
		  />
		</main>
	  </div>
	  {isLoggedIn && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
	</Router>
	</GoogleOAuthProvider>
  );
}

export default App;

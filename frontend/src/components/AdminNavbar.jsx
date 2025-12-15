import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminNavbar.css';

const AdminNavbar = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-brand">
        Admin Panel
      </div>
      <div className="admin-nav-actions">
        {userInfo && (
          <div className="admin-user-info">
            <span className="admin-user-name">Welcome, {userInfo.name}</span>
            <button onClick={logoutHandler} className="btn-admin-logout">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
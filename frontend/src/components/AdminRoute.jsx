import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const AdminRoute = () => {
  const userInfoString = localStorage.getItem('userInfo');
  const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

  // 1. Check if user is logged in
  // 2. Check if the user's role is 'Admin'
  if (userInfo && userInfo.role && userInfo.role.toLowerCase() === 'admin') {
    return <Outlet />; // If authorized, show the child components (the dashboard)
  } else {
    // If not authorized, redirect them to the login page
    return <Navigate to="/" replace />;
  }
};

export default AdminRoute;

import React from 'react';
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    // This layout only contains the Outlet, which will render the AdminDashboard.
    // It intentionally omits the main Navbar and Footer.
    <Outlet />
  );
};

export default AdminLayout;
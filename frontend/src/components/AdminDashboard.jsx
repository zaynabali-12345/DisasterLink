import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import UserManagement from './UserManagement'; // Import the new component
import ResourceMonitoring from './ResourceMonitoring'; // Import the new component
import CentralWarehouse from './CentralWarehouse'; // Import the new component
import Analytics from './Analytics'; // Import the new component
import ContactQueries from './ContactQueries'; // Import the new component
import RequestList from './RequestList'; // Import the RequestList component
import ThemeToggle from './ThemeToggle'; // Import the theme toggle
import AdminNavbar from './AdminNavbar'; // Import the new Admin Navbar

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('Request List');
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [adminName, setAdminName] = useState('Admin');

  // Effect to update sync time for other components as well, for simplicity
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.name) {
      setAdminName(userInfo.name);
    }
  }, []);

  const handleDataFetched = useCallback(() => {
    setLastSyncTime(new Date());
  }, []);

  return (
    <>
      <AdminNavbar />
      <div className="admin-dashboard">
        <aside className="sidebar">
          <h2>Admin Menu</h2>
          <nav>
            <ul>
              <li onClick={() => setActiveView('Request List')} className={activeView === 'Request List' ? 'active' : ''}>🚨 Request List</li>
              <li onClick={() => setActiveView('Contact Queries')} className={activeView === 'Contact Queries' ? 'active' : ''}>📨 Contact Queries</li>
              <li onClick={() => setActiveView('User Management')} className={activeView === 'User Management' ? 'active' : ''}>👥 User Management</li>
              <li onClick={() => setActiveView('Resource Monitoring')} className={activeView === 'Resource Monitoring' ? 'active' : ''}>📦 Resource Monitoring</li>
              <li onClick={() => setActiveView('Central Warehouse')} className={activeView === 'Central Warehouse' ? 'active' : ''}>🏢 Central Warehouse</li>
              <li onClick={() => setActiveView('Analytics')} className={activeView === 'Analytics' ? 'active' : ''}>📊 Analytics</li>
            </ul>
          </nav>
          <nav className="sidebar-footer">
            <ThemeToggle />
          </nav>
        </aside>
        <main className="main-content">
          {/* Render all views but only show the active one via CSS */}
          <div className={`admin-view-wrapper ${activeView === 'Request List' ? 'visible' : ''}`}>
            <RequestList />
          </div>
          <div className={`admin-view-wrapper ${activeView === 'Contact Queries' ? 'visible' : ''}`}>
            <ContactQueries />
          </div>
          <div className={`admin-view-wrapper ${activeView === 'User Management' ? 'visible' : ''}`}>
            <UserManagement />
          </div>
          <div className={`admin-view-wrapper ${activeView === 'Resource Monitoring' ? 'visible' : ''}`}>
            <ResourceMonitoring onDataFetched={handleDataFetched} />
          </div>
          <div className={`admin-view-wrapper ${activeView === 'Central Warehouse' ? 'visible' : ''}`}>
            <CentralWarehouse />
          </div>
          <div className={`admin-view-wrapper ${activeView === 'Analytics' ? 'visible' : ''}`}>
            <Analytics />
          </div>
        </main>
        <footer className="admin-status-bar">
          <div className="status-item">👤 Admin: {adminName}</div>
          <div className="status-item">
            🔄 Last Sync: {lastSyncTime.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, 
            {lastSyncTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div className="status-item">✅ System: All Good</div>
        </footer>
      </div>
    </>
  );
};

export default AdminDashboard;

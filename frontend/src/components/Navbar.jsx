import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react'; // Import the icon
import { useModal } from '../context/ModalContext';
import './Navbar.css';
import GlowButton from './GlowButton'; // Import the new button

const Navbar = () => {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModal();

  // This effect checks for user info in localStorage whenever the route changes.
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else {
      setUserInfo(null);
    }
  }, [location]);

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            <div className="logo-container">
              <AlertTriangle color="white" size={24} />
            </div>
            DisasterLink
          </Link>

          <ul className="nav-links">
            {/* Always-Visible Links */}
            <li><NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About</NavLink></li>
            <li><GlowButton to="/predict/earthquake">Prediction</GlowButton></li>

            {/* Conditional Links */}
            {userInfo ? (
              <>
                {/* Role-based Dashboard Links */}
                {userInfo.role.toLowerCase() === 'admin' && (
                  <li><NavLink to="/admin/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Admin Dashboard</NavLink></li>
                )}
                {userInfo.role.toLowerCase() === 'emergency' && (
                  <li><NavLink to="/dashboard/emergency" className={({ isActive }) => (isActive ? 'active' : '')}>Emergency Dashboard</NavLink></li>
                )}
                {userInfo.role.toLowerCase() === 'volunteer' && (
                  <li><NavLink to="/dashboard/volunteer" className={({ isActive }) => (isActive ? 'active' : '')}>Volunteer Dashboard</NavLink></li>
                )}
                {userInfo.role.toLowerCase() === 'ngo' && (
                  <>
                    <li><NavLink to="/dashboard/emergency" className={({ isActive }) => (isActive ? 'active' : '')}>Emergency Dashboard</NavLink></li>
                    <li><NavLink to="/dashboard/volunteer" className={({ isActive }) => (isActive ? 'active' : '')}>Volunteer Dashboard</NavLink></li>
                    <li><NavLink to="/dashboard/ngo" className={({ isActive }) => (isActive ? 'active' : '')}>NGO Dashboard</NavLink></li>
                  </>
                )}
              </>
            ) : (
              // Logged-out Links
              <>
                <li><NavLink to="/victim-dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>Track Rescue</NavLink></li>
                <li><NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink></li>
              </>
            )}
          </ul>
        </div>

        <div className="nav-actions">
          {userInfo ? (
            <div className="nav-user-info">
              <span className="nav-user-name">Welcome, {userInfo.name}</span>
              <button onClick={logoutHandler} className="btn btn-logout">Logout</button>
            </div>
          ) : (
            <>
              <GlowButton to="/request-help">
                Request Help
              </GlowButton>
              <GlowButton onClick={openModal}>
                Donate
              </GlowButton>
              <div className="nav-dropdown">
                <GlowButton to="/login">Login</GlowButton>
                <div className="dropdown-content">
                  {/* These links can point to a single login page or role-specific ones */}
                  <Link to="/login">Emergency Portal</Link>
                  <Link to="/login">Volunteer</Link>
                  <Link to="/login">NGO</Link>
                  <Link to="/login">Admin</Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NgoDashboard.css';
import axios from 'axios'; // Import axios for API calls
import {
  FaTasks, FaHeartbeat, FaClock, FaUsers, FaExclamationTriangle, FaWarehouse, FaPencilAlt, FaTrash,
  FaUser, FaTimes, FaCheckCircle, FaMedkit, FaBoxOpen, FaTruck, FaUserFriends,
  FaShareAlt, FaHandshake
} from 'react-icons/fa';
import { getNgoDashboardData, acceptCoordinationTask, deployResource } from '../../services/api';
import RequestReplenishmentModal from '../../components/RequestReplenishmentModal'; // Import the new modal

// Map icon names from backend to the actual React component
const iconMap = {
  FaTasks, FaHeartbeat, FaClock, FaUsers, FaExclamationTriangle, FaWarehouse, FaPencilAlt, FaTrash,
  FaUser, FaTimes, FaCheckCircle, FaMedkit, FaBoxOpen, FaTruck, FaUserFriends,
  FaShareAlt, FaHandshake
};

const NgoDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBannerVisible, setBannerVisible] = useState(true); // For the static banner
  const [ngoId, setNgoId] = useState(null);
  const [ngoResources, setNgoResources] = useState([]); // State for the NGO's own resources
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestingResource, setRequestingResource] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // This effect runs once on mount to check auth and set the NGO ID.
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      // Make the role check case-insensitive to prevent errors.
      if (userInfo && userInfo.role.toLowerCase() === 'ngo' && userInfo._id) {
        setNgoId(userInfo._id);
      } else {
        setError('You must be logged in as an NGO to view this page.');
        setLoading(false);
      }
    } else {
      setError('You must be logged in to view this page.');
      setLoading(false);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  useEffect(() => {
    // This effect runs whenever the ngoId is set.
    const fetchAllData = async () => {
      if (!ngoId) return; // Don't fetch if there's no ID

      try {
        setLoading(true);
        // Fetch both general dashboard data and specific NGO resources in parallel
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };

        const [dashboardResponse, resourcesResponse] = await Promise.all([
          getNgoDashboardData(ngoId, userInfo.token), // Pass the token here
          axios.get('/api/ngo-resources', config), // New call for NGO's inventory
        ]);

        setDashboardData(dashboardResponse);
        setNgoResources(resourcesResponse.data);
        setError(null);
      } catch (err) {
        setError(`Failed to load dashboard data: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [ngoId]); // This effect depends on ngoId.

  const handleAcceptAndCoordinate = async (requestId) => {
    const originalData = { ...dashboardData };

    // Optimistic UI update: remove the task from the coordination list
    setDashboardData(currentData => ({
      ...currentData,
      coordinationTasks: currentData.coordinationTasks.filter(task => task.id !== requestId),
    }));

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      await acceptCoordinationTask(ngoId, requestId, userInfo.token);
      // Optionally, you can show a success notification here.
    } catch (err) {
      console.error('Failed to accept coordination task:', err);
      setError(`Failed to accept task: ${err.message}. Please try again.`);
      // On failure, revert the UI to its original state
      setDashboardData(originalData);
    }
  };

  const handleReplenishmentSubmitted = () => {
    setSuccessMessage('Your replenishment request has been sent to the admin for review.');
    // Hide the message after a few seconds
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleDeployClick = async (resourceId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { updatedResource, updatedStats } = await deployResource(resourceId, userInfo.token);

      // Update the stats card value from the backend response
      setDashboardData(prevData => {
        const newStats = prevData.stats.map(stat =>
          stat.label === 'Resources Deployed'
            ? { ...stat, value: updatedStats.resourcesDeployed }
            : stat
        );
        return { ...prevData, stats: newStats };
      });

      // Update the specific resource in the list
      setNgoResources(prevResources =>
        prevResources.map(r => (r._id === resourceId ? updatedResource : r))
      );
    } catch (err) {
      console.error('Failed to deploy resource:', err);
      setError(err.response?.data?.message || 'Could not deploy the resource.');
    }
  };

  const getUrgencyClass = (urgency) => (urgency ? urgency.toLowerCase() : '');

  const renderIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  if (loading) {
    return <div className="loading-spinner">Loading NGO Dashboard...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="error-message">No dashboard data available.</div>;
  }

  const { stats, coordinationTasks, mapMarkers } = dashboardData;

  return (
    <div className="ngo-dashboard">
      {showRequestModal && requestingResource && (
        <RequestReplenishmentModal
          resource={requestingResource}
          onClose={() => setShowRequestModal(false)}
          onSubmitted={handleReplenishmentSubmitted}
        />
      )}

      {/* Top Notification Banner */}
      {isBannerVisible && (
        <div className="ngo-notification-banner">
          <FaCheckCircle className="banner-icon" />
          <p>Medical team successfully deployed to Riverside District</p>
          <span className="banner-timestamp">5 min ago</span>
          <button onClick={() => setBannerVisible(false)} className="close-banner-btn">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Dynamic Success Banner */}
      {successMessage && (
        <div className="ngo-notification-banner success-banner">
          <FaCheckCircle className="banner-icon" />
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage('')} className="close-banner-btn">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Top Stats */}
      <div className="ngo-stats-container">
        {stats.map(stat => (
          <div key={stat.id} className={`ngo-stat-card-new color-${stat.color}`}>
            <div className="stat-icon-new">
              {renderIcon(stat.icon)}
            </div>
            <div className="stat-info-new">
              <span className="stat-value-new">{stat.value}</span>
              <span className="stat-label-new">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="ngo-main-content">

        {/* Left Panel */}
        <div className="ngo-left-panel">
          {/* Coordination Panel */}
          <div className="ngo-panel-card">
            <div className="panel-header">
              <h2>Coordination</h2>
              <p>Inter-agency communication</p>
            </div>
            <div className="coordination-list">
              {coordinationTasks.map(task => (
                <div key={task.id} className="coordination-card">
                  <div className="coordination-icon">{renderIcon(task.icon)}</div>
                  <div className="coordination-info">
                    <h4>{task.org}</h4>
                    <p>{task.task}</p>
                  </div>
                  <span className={`urgency-badge-small ${getUrgencyClass(task.urgency)}`}>{task.urgency}</span>
                  <div className="coordination-buttons">
                    <button className="btn-coordinate" onClick={() => handleAcceptAndCoordinate(task.id)}>Accept & Coordinate</button>
                    <button className="btn-message">Message</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Map */}
        <div className="ngo-center-panel">
          <div className="ngo-map-area">
            <div className="map-grid-overlay"></div>
            {/* Render new, detailed request markers */}
            {mapMarkers.filter(m => m.type === 'request').map(marker => (
              <div
                key={marker.id}
                className={`map-marker-ngo marker-${marker.priority}`}
                style={{ top: marker.top, left: marker.left }}
              >
                <div className="marker-icon-ngo">
                  <FaExclamationTriangle />
                </div>
                <div className="marker-tooltip-ngo">
                  <div className="tooltip-header-ngo">
                    <span>{marker.tooltip.people} People Affected</span>
                    <span className={`tooltip-severity-ngo severity-${marker.priority}`}>
                      {marker.tooltip.severity}
                    </span>
                  </div>
                  <p className="tooltip-description-ngo">{marker.tooltip.description}</p>
                  <div className="tooltip-footer-ngo">
                    <span>{marker.tooltip.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Render markers for coordination tasks */}
            {coordinationTasks.map((task, index) => (
              <div
                key={`coord-${task.id}`}
                className={`map-marker-ngo marker-${getUrgencyClass(task.urgency)}`}
                // Generate pseudo-random positions for demonstration
                style={{
                  top: `${20 + (index * 15) % 60}%`,
                  left: `${25 + (index * 20) % 50}%`,
                }}
              >
                <div className="marker-icon-ngo">
                  {renderIcon(task.icon)}
                </div>
                <div className="marker-tooltip-ngo">
                  <div className="tooltip-header-ngo">
                    <span>{task.org}</span>
                    <span className={`tooltip-severity-ngo severity-${getUrgencyClass(task.urgency)}`}>
                      {task.urgency}
                    </span>
                  </div>
                  <p className="tooltip-description-ngo">{task.task}</p>
                </div>
              </div>
            ))}
            <div className="map-legend">
              <h4>Legend</h4>
              <ul>
                <li><span className="legend-icon marker-critical"><FaExclamationTriangle /></span> Critical Request</li>
                <li><span className="legend-icon marker-high"><FaExclamationTriangle /></span> High Priority</li>
                <li><span className="legend-icon marker-medium"><FaExclamationTriangle /></span> Medium Priority</li>
                <li><span className="legend-icon resource"><FaWarehouse /></span> My Resources</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="ngo-right-panel">
          <div className="ngo-panel-card">
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>My Inventory</h2>
              <p>View stock and request more</p>
            </div>
            <div className="resources-list">
              {ngoResources.length > 0 ? (
                ngoResources.map(res => (
                <div key={res._id} className="resource-card">
                    <div className="resource-icon">{renderIcon(res.category === 'Medical' ? 'FaMedkit' : 'FaBoxOpen')}</div>
                  <div className="resource-info">
                    <h4>{res.name}</h4>
                    <p className={`resource-status ${getUrgencyClass(res.status)}`}>{res.status}</p>
                    <div className="resource-meta">
                      <span>Qty: {res.quantity} {res.unit}</span>
                      <span>{res.location}</span>
                    </div>
                    <p className="resource-updated">Updated: {new Date(res.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="resource-actions">
                    <button onClick={() => { setRequestingResource(res); setShowRequestModal(true); }}
                      className="btn-action btn-request-more"
                      title="Request More Stock">
                      +
                    </button>
                    <button onClick={() => handleDeployClick(res._id)}
                      className="btn-action btn-deploy"
                      disabled={res.status === 'Deployed'}
                      title={res.status === 'Deployed' ? 'Already Deployed' : 'Deploy Resource'}
                    ><FaTruck /></button>
                  </div>
                </div>
                ))
              ) : (<p style={{textAlign: 'center', color: 'var(--ngo-text-secondary)', marginTop: '1rem'}}>You have not added any resources yet.</p>)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NgoDashboard;

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import './EmergencyDashboard.css';
import { FaBullhorn, FaUserFriends, FaWarehouse, FaHeartbeat, FaAmbulance, FaUser, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { createResourceRequest, getEmergencyOverview, getVolunteers, assignTask } from '../../services/api';

const EmergencyDashboard = () => {
  // State for all dashboard data
  const [stats, setStats] = useState({ totalSOS: 0, peopleHelped: 0, activeVolunteers: 0, avgResponseTime: '0' });
  const [helpRequests, setHelpRequests] = useState([]);
  const [resources, setResources] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [bannerAlerts, setBannerAlerts] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerVisible, setBannerVisible] = useState(false);

  // State for modals
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState('');
  const [resourceRequest, setResourceRequest] = useState({
    description: '',
    location: '',
    priority: 'Medium',
    people: 1,
  });

  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentError, setAssignmentError] = useState(null);

  // Wrap fetchData in useCallback to prevent it from being re-created on every render,
  // which is important for the useEffect dependency array.
  const fetchData = useCallback(async () => {
    // We don't set loading to true here for subsequent fetches
    // to provide a seamless update experience.
    try {
      // Get user info from local storage to access the token
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      if (!userInfo || !userInfo.token) {
        setError('You must be logged in to view this page.');
        setLoading(false);
        return;
      }

      const data = await getEmergencyOverview(userInfo.token);
      setStats(data.stats);
      setHelpRequests(data.helpRequests);
      setResources(data.resources);
      setMapMarkers(data.mapMarkers);
      setBannerAlerts(data.bannerAlerts || []);
      setBannerVisible(!!data.bannerAlerts && data.bannerAlerts.length > 0);
    } catch (err) {
      setError('Failed to load dashboard data. The server might be down or you are not authorized.');
      console.error(err);
    } finally {
      // Only set initial loading to false
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up WebSocket connection
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to WebSocket server.');
    });

    // Listen for events that should trigger a data refresh
    const eventsToListen = ['new_request', 'request_updated'];
    eventsToListen.forEach(event => {
      socket.on(event, (data) => {
        console.log(`Real-time event '${event}' received:`, data.message);
        fetchData();
      });
    });

    // Disconnect the socket when the component unmounts to prevent memory leaks
    return () => {
      socket.disconnect();
    };
  }, [fetchData]);

  // This effect handles the dynamic cycling of the banner
  useEffect(() => {
    if (bannerAlerts.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentBannerIndex(prevIndex => (prevIndex + 1) % bannerAlerts.length);
      }, 4000); // Change banner every 4 seconds

      return () => {
        clearInterval(intervalId); // Cleanup on unmount or when alerts change
      };
    }
  }, [bannerAlerts]);

  // Icon mapping for map markers
  const markerIcons = {
    sos: <FaBullhorn />,
    volunteer: <FaUserFriends />,
    resource: <FaWarehouse />,
    medical: <FaHeartbeat />,
    ambulance: <FaAmbulance />,
  };

  // Helper function to render tooltip content based on marker type
  const renderTooltipContent = (marker) => {
    switch (marker.type) {
      case 'sos':
        return (
          <>
            <div className="tooltip-header">
              <FaUser />
              <span>{marker.tooltip.people} people affected</span>
            </div>
            <p className="tooltip-description">{marker.tooltip.description}</p>
            <div className="tooltip-footer">
              <span className={`tooltip-severity ${marker.tooltip.severity.toLowerCase()}`}>{marker.tooltip.severity}</span>
              <span className="tooltip-timestamp">{marker.tooltip.time}</span>
            </div>
          </>
        );
      case 'volunteer':
      case 'resource':
      case 'medical':
      case 'ambulance':
        return (
          <>
            <div className="tooltip-header">
              <span>{marker.tooltip.title}</span>
            </div>
            <p className="tooltip-description">{marker.tooltip.description}</p>
          </>
        );
      default:
        return null;
    }
  };

  const handleOpenAssignModal = async (request) => {
    setSelectedRequest(request);
    setAssignmentError(null);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo || !userInfo.token) {
        throw new Error("You must be logged in to perform this action.");
      }

      // Fetch volunteers using the authenticated API call
      const volunteerList = await getVolunteers(userInfo.token);

      setVolunteers(volunteerList);
      setIsAssignModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch volunteers", err);
      setAssignmentError("Could not load the list of available volunteers.");
    }
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedRequest(null);
    setSelectedVolunteerId('');
    setAssignmentError(null);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedRequest || !selectedVolunteerId) {
      setAssignmentError("A request and a volunteer must be selected.");
      return;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !userInfo.token) {
      setAssignmentError("You are not authorized to perform this action.");
      return;
    }

    try {
      // 1. Wait for the API call to complete successfully.
      await assignTask(selectedRequest.id, selectedVolunteerId, userInfo.token);
      
      // The UI will now be updated via the 'request_updated' WebSocket event.
      // This avoids UI "flickering" and is more robust than an optimistic update.
      alert(`Task has been successfully assigned!`);
      handleCloseAssignModal();
    } catch (err) {
      console.error("Failed to assign task:", err);
      setAssignmentError(`Assignment failed: ${err.message}. Please try again.`);
    }
  };

  const handleOpenResourceModal = () => setIsResourceModalOpen(true);

  const handleCloseResourceModal = () => {
    setIsResourceModalOpen(false);
    setResourceRequest({
      description: '',
      location: '',
      priority: 'Medium',
      people: 1,
    });
  };

  const handleRequestChange = (e) => {
    const { name, value } = e.target;
    setResourceRequest(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmitResourceRequest = async (e) => {
    e.preventDefault();
    try {
      await createResourceRequest(resourceRequest);
      alert('Resource request submitted successfully!');
      handleCloseResourceModal();
      // The new request will be pushed via WebSocket to the NGO dashboard,
      // so no need to re-fetch data here.
    } catch (err) {
      // Use the existing error state to display a message
      setError(`Failed to submit resource request: ${err.message}`);
      console.error(err);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading Real-Time Data...</div>;
  }

  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  const currentBanner = bannerAlerts && bannerAlerts.length > 0 ? bannerAlerts[currentBannerIndex] : null;

  return (
    <div className="dashboard-container">
      {/* SOS Alert Banner */}
      {isBannerVisible && currentBanner && (
        <div className={`sos-alert-banner ${currentBanner.type}-alert`}>
          <FaExclamationTriangle className={`alert-icon ${currentBanner.type}-icon`} />
          <p className="alert-text">
            <strong>{currentBanner.text}</strong>
          </p>
          <span className="alert-timestamp">{currentBanner.timestamp}</span>
          <button className="close-alert-btn" onClick={() => setBannerVisible(false)}>
            <FaTimes />
          </button>
        </div>
      )}
      
      {/* Top Stats Panel */}
      <div className="stats-panel">
        <div className="stat-box">
          <h3>Total SOS Requests</h3>
          <p className="stat-value">{stats.totalSOS.toLocaleString()}</p>
        </div>
        <div className="stat-box">
          <h3>Total People Helped</h3>
          <p className="stat-value">{stats.peopleHelped.toLocaleString()}</p>
        </div>
        <div className="stat-box">
          <h3>Active Volunteers</h3>
          <p className="stat-value">{stats.activeVolunteers.toLocaleString()}</p>
        </div>
        <div className="stat-box">
          <h3>Avg. Response Time</h3>
          <p className="stat-value">{stats.avgResponseTime}</p>
        </div>
      </div>

      {/* FIXED: Main Content with proper structure */}
      <div className="emergency-main-content">
        {/* LEFT PANEL: Help Requests */}
        <div className="left-panel">
          <h2>Help Requests</h2>
          <div className="requests-list">
            {helpRequests.map(req => (
              <div key={req.id} className={`request-card ${req.priority.toLowerCase()}`}>
                <div className="card-header">
                  <span className="priority-dot"></span>
                  <p className="location">{req.location}</p>
                </div>
                <p className="description"><strong>{req.people} people affected.</strong> {req.description}</p>
                <div className="card-footer">
                  <span className="response-time">{req.time}</span>
                  <div className="card-buttons">
                    <Link to={`/requests/${req.id}`} className="btn-details">
                      Details
                    </Link>
                    {req.status === 'Assigned' || req.status === 'InProgress' ? (
                      <button className="btn-assign assigned" disabled>
                        Assigned
                      </button>
                    ) : (
                      <button className="btn-assign" onClick={() => handleOpenAssignModal(req)}>Assign Task</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER PANEL: Map Area */}
        <div className="center-panel">
          <h2>Emergency Map</h2>
          <div className="map-area">
            {mapMarkers.map(marker => (
              <div key={marker.id} className={`map-marker ${marker.type}`} style={{ top: marker.top, left: marker.left }}>
                {markerIcons[marker.type]}
                {marker.counter && <span className="marker-counter">{marker.counter}</span>}
                {marker.tooltip && (
                  <div className="map-tooltip">{renderTooltipContent(marker)}</div>
                )}
              </div>
            ))}
          </div>
          <div className="map-legend">
            <h3>Legend</h3>
            <ul>
              <li><span className="legend-icon sos"><FaBullhorn /></span> SOS Signal</li>
              <li><span className="legend-icon volunteer"><FaUserFriends /></span> Volunteer</li>
              <li><span className="legend-icon resource"><FaWarehouse /></span> Resource Center</li>
              <li><span className="legend-icon medical"><FaHeartbeat /></span> Medical Center</li>
              <li><span className="legend-icon ambulance"><FaAmbulance /></span> Active Dispatch</li>
            </ul>
          </div>
        </div>

        {/* RIGHT PANEL: Available Resources */}
        <div className="right-panel">
          <h2>Available Resources</h2>
          <div className="resources-list">
            {resources.map(res => (
              <div key={res.name} className="resource-card">
                <div className="resource-header">
                  <h4>{res.name}</h4>
                  <span className={`status-label ${res.color}`}>{res.status}</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${res.level}%`, background: `var(--gradient-${res.color})` }}></div>
                </div>
                <div className="source-locations">
                  <p><strong>Sources:</strong> {res.sources.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-request-resources" onClick={handleOpenResourceModal}>Request Resources</button>
        </div>
      </div>

      {/* Resource Request Modal */}
      {isResourceModalOpen && (
        <div className="resource-request-modal-overlay">
          <div className="resource-request-modal">
            <div className="modal-header">
              <h3>Request New Resources</h3>
              <button onClick={handleCloseResourceModal} className="close-modal-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleSubmitResourceRequest} className="modal-form">
              <div className="form-group">
                <label htmlFor="description">Resource Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={resourceRequest.description}
                  onChange={handleRequestChange}
                  placeholder="e.g., 500 bottles of water, 100 medical kits"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Delivery Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={resourceRequest.location}
                  onChange={handleRequestChange}
                  placeholder="e.g., City Center Shelter"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="people">People to Support</label>
                  <input
                    type="number"
                    id="people"
                    name="people"
                    value={resourceRequest.people}
                    onChange={handleRequestChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select
                    id="priority"
                    name="priority"
                    value={resourceRequest.priority}
                    onChange={handleRequestChange}
                    required
                  >
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseResourceModal}>Cancel</button>
                <button type="submit" className="btn-submit-request">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <div className="resource-request-modal-overlay">
          <div className="resource-request-modal">
            <div className="modal-header">
              <h3>Assign Task to Volunteer</h3>
              <button onClick={handleCloseAssignModal} className="close-modal-btn"><FaTimes /></button>
            </div>
            <div className="modal-form">
              <p><strong>Task:</strong> {selectedRequest?.description}</p>
              <p><strong>Location:</strong> {selectedRequest?.location}</p>
              <div className="form-group">
                <label htmlFor="volunteer">Select Volunteer</label>
                <select
                  id="volunteer"
                  name="volunteer"
                  value={selectedVolunteerId}
                  onChange={(e) => setSelectedVolunteerId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a volunteer --</option>
                  {volunteers.map(v => (
                    <option key={v._id} value={v._id}>{v.name} {v.skills && v.skills.length > 0 ? `(${v.skills.join(', ')})` : ''}</option>
                  ))}
                </select>
              </div>
              {assignmentError && <div className="dashboard-error" style={{padding: '10px', margin: '10px 0'}}>{assignmentError}</div>}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseAssignModal}>Cancel</button>
                <button type="button" className="btn-submit-request" onClick={handleConfirmAssignment}>Confirm Assignment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyDashboard;
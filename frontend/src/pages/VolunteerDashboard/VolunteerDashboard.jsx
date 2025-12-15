import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  CheckCircle,
  Clock,
  Heart,
  AlertTriangle,
  MapPin,
  X,
  Truck,
  PlusSquare,
  UserCheck,
} from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';
import Loader from "../../components/Loader"; // Assuming you have a Loader component
import Message from "../../components/Message"; // Assuming you have a Message component
import Modal from "../../components/Modal/Modal";
import "./VolunteerDashboard.css";

// Map icon names from the backend to the actual Lucide React components
const metricIconComponents = {
  FaTasks: CheckCircle,
  FaHeart: Heart,
  FaClock: Clock,
  FaUser: Users,
  FaUserMd: UserCheck,
  FaPlusSquare: PlusSquare,
};

// New component for rendering specific map markers as requested
const MapMarker = ({ type, status, count, tooltip }) => {
  const isSos = ['critical', 'high', 'medium'].includes(type);

  if (isSos) {
    // SOS/Emergency Marker
    const colorClass = `sos-${type}`; // sos-critical, sos-high, sos-medium
    return (
      <div className={`map-marker-wrapper ${colorClass}`}>
        <div className="map-marker-icon">
          <AlertTriangle size={24} />
        </div>
        {count > 0 && <div className="map-marker-badge">{count}</div>}
        {tooltip && (
          <div className="map-tooltip-volunteer">
            <div className="tooltip-title">{tooltip.title}</div>
            <div className="tooltip-subtitle">
              <Users size={14} /> <span>{tooltip.subtitle}</span>
            </div>
            <div className="tooltip-footer">
              <span className={`tooltip-severity-tag severity-${type}`}>{type}</span>
              <span className="tooltip-time">{tooltip.time}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Volunteer Marker
  const volunteerColorClass = `volunteer-${status}`; // volunteer-available, volunteer-moving, volunteer-busy
  let IconComponent;
  let volunteerTitle = "Volunteer Team";

  if (type === 'medical') {
    IconComponent = Heart;
    volunteerTitle = "Medical Team";
  } else if (type === 'rescue') {
    IconComponent = Users;
    volunteerTitle = "Rescue Team";
  } else if (type === 'supplies') {
    IconComponent = Truck;
    volunteerTitle = "Supplies Team";
  } else {
    IconComponent = Users; // Default
  }

  return (
    <div className={`map-marker-wrapper volunteer-marker ${volunteerColorClass}`}>
      <div className="map-marker-icon">
        <IconComponent size={22} />
      </div>
      <div className="map-tooltip-volunteer">
        <div className="tooltip-title">{volunteerTitle}</div>
        <div className="tooltip-subtitle">
          Status: <span className={`volunteer-status-tag status-${status}`}>{status}</span>
        </div>
      </div>
    </div>
  );
};


export default function VolunteerDashboard() {
  const [bannerVisible, setBannerVisible] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bannerAlerts, setBannerAlerts] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [completionNotes, setCompletionNotes] = useState('');
  const [assistanceNotes, setAssistanceNotes] = useState('');

  const openModal = (type, data) => {
    setModalState({ isOpen: true, type, data });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setCompletionNotes(''); // Reset notes on close
    setAssistanceNotes(''); // Reset notes on close
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard/volunteer/stats");
      if (!res.ok) throw new Error('Failed to refresh stats');
      const statsResponse = await res.json();
      setMetrics(statsResponse.metrics);
    } catch (err) {
      console.error("Could not refresh stats:", err);
    }
  };

  const confirmCompleteTask = async () => {
    const taskId = modalState.data?.id;
    if (!taskId) return;

    const originalAssignedTasks = [...assignedTasks];
    setAssignedTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    closeModal();

    try {
      const res = await fetch(`http://localhost:5000/api/requests/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', notes: completionNotes }),
      });

      if (!res.ok) throw new Error('Failed to complete task');
      await fetchStats();
    } catch (err) {
      console.error("Error completing task:", err);
      setError(err.message);
      setAssignedTasks(originalAssignedTasks);
    }
  };

  const handleRequestAssistance = async () => {
    const task = modalState.data;
    if (!task) return;

    closeModal();

    try {
      const res = await fetch(`http://localhost:5000/api/requests/${task.id}/assistance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: assistanceNotes }),
      });

      if (!res.ok) throw new Error('Failed to send assistance request.');
      alert('Assistance request sent successfully! An admin has been notified.');
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      const userInfo = localStorage.getItem('userInfo')
        ? JSON.parse(localStorage.getItem('userInfo'))
        : null;

      const userRole = userInfo?.role?.toLowerCase();
      const isAuthorized = userRole === 'volunteer' || userRole === 'ngo';

      if (!userInfo || !userInfo.token || !isAuthorized) {
        setError('Access Denied: You do not have permission to view this page.');
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const API_BASE_URL = "http://localhost:5000/api/dashboard/volunteer";

      const [statsRes, markersRes, assignedTasksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/stats`, config),
        fetch(`${API_BASE_URL}/map-markers`, config),
        fetch(`${API_BASE_URL}/assigned-tasks`, config),
      ]);

      if (!statsRes.ok || !markersRes.ok || !assignedTasksRes.ok) {
        throw new Error('Failed to fetch one or more dashboard data endpoints.');
      }

      const statsData = await statsRes.json();
      const markersData = await markersRes.json();
      const assignedTasksData = await assignedTasksRes.json();

      setMetrics(statsData.metrics);
      setBannerAlerts(statsData.bannerAlerts || []);
      setAssignedTasks(assignedTasksData);
      setMapMarkers(markersData);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. The server might be down or you are not authorized.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (bannerAlerts.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentBannerIndex(prevIndex => (prevIndex + 1) % bannerAlerts.length);
      }, 4000);
      return () => clearInterval(intervalId);
    }
  }, [bannerAlerts]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('connect', () => console.log('Connected to Volunteer Dashboard WebSocket.'));
    const eventsToListen = ['new_request', 'request_updated', 'assistance_requested'];
    eventsToListen.forEach(event => {
      socket.on(event, (data) => {
        console.log(`Real-time event '${event}' received:`, data.message);
        fetchDashboardData();
      });
    });
    return () => socket.disconnect();
  }, [fetchDashboardData]);

  // --- NEW: Volunteer Location Tracking ---
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (!userInfo || userInfo.role !== 'Volunteer') {
      return; // Don't track if not a volunteer
    }

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
              await axios.patch(`/api/users/${userInfo._id}/location`, {
                lat: latitude,
                lng: longitude,
              }, config);
              console.log('Volunteer location updated:', { latitude, longitude });
            } catch (error) {
              console.error('Failed to update volunteer location:', error);
            }
          },
          (error) => console.error('Error getting geolocation:', error),
          { enableHighAccuracy: true }
        );
      }
    };

    updateLocation(); // Initial update
    const intervalId = setInterval(updateLocation, 10000); // Update every 10 seconds
    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, []);

  if (loading) {
    return <div className="volunteer-dashboard"><Loader /></div>;
  }

  if (error) {
    return <div className="volunteer-dashboard"><Message variant="danger">{error}</Message></div>;
  }

  const currentBanner = bannerAlerts && bannerAlerts.length > 0 ? bannerAlerts[currentBannerIndex] : null;

  return (
    <div className="volunteer-dashboard">
      {currentBanner && bannerVisible && (
        <div className={`emergency-alert-banner severity-${currentBanner.type || 'info'}`}>
          <span className="alert-icon"><AlertTriangle size={22} /></span>
          <div className="alert-content">
            <div className="alert-title">{currentBanner.text}</div>
            {currentBanner.location && <div className="alert-description">Location: {currentBanner.location}</div>}
          </div>
          <span className="alert-timestamp">{currentBanner.time || currentBanner.timestamp}</span>
          <button className="close-banner-btn" onClick={() => setBannerVisible(false)} aria-label="Close">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="volunteer-stats-grid">
        {metrics.map((m, index) => {
          const IconComponent = metricIconComponents[m.icon];
          const iconBgClass = `icon-bg-${index + 1}`;
          return (
            <div className="volunteer-stat-card" key={m.id} title={m.tooltip}>
              <span className={`stat-icon ${iconBgClass}`} style={{ color: m.color }}>
                {IconComponent && <IconComponent size={28} />}
              </span>
              <div className="metric-value">{m.value}</div>
              <div className="metric-label">{m.label}</div>
            </div>
          );
        })}
      </div>

      <div className="main-content-volunteer">
        <div className="map-card-volunteer" title="Live Activity Map">
          {/* 
            This is a placeholder map. For a real implementation, you would use
            a library like 'react-leaflet' and pass the mapMarkers state to it
            to render the markers dynamically.
          */}
          <div className="map-container-volunteer">
            {/* DEMO MARKERS using the new component */}
            <div style={{ position: 'absolute', top: '20%', left: '25%' }}>
              <MapMarker type="critical" count={5} tooltip={{ title: "Building Collapse", subtitle: "5 people affected", time: "2m ago" }} />
            </div>
            <div style={{ position: 'absolute', top: '40%', left: '60%' }}>
              <MapMarker type="high" count={2} tooltip={{ title: "Flooding Reported", subtitle: "2 people affected", time: "10m ago" }} />
            </div>
            <div style={{ position: 'absolute', top: '75%', left: '30%' }}>
              <MapMarker type="medical" status="available" />
            </div>
            <div style={{ position: 'absolute', top: '60%', left: '80%' }}>
              <MapMarker type="rescue" status="moving" />
            </div>
            <div style={{ position: 'absolute', top: '85%', left: '70%' }}>
              <MapMarker type="supplies" status="busy" />
            </div>

            {mapMarkers.map((marker) => (
              <div key={marker.id} style={{ position: 'absolute', top: marker.top, left: marker.left }}>
                <MapMarker type={marker.type} count={marker.count} tooltip={marker.tooltip} status={marker.status} />
              </div>
            ))}
          </div>
        </div>

        <aside className="sidebar-volunteer">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h2>My Active Tasks
                {assignedTasks.length > 0 && <span className="task-count-badge">{assignedTasks.length}</span>}
              </h2>
              <p>Tasks you have accepted.</p>
            </div>
            <div className="tasks-list-volunteer">
              {assignedTasks.length > 0 ? (
                assignedTasks.map((task) => (
                  <div className="task-card-volunteer assigned" key={task.id}>
                    <div className="task-header-volunteer">
                      <div className="task-title-group">
                        <h4>{task.title}</h4>
                        <div className="task-meta-volunteer">
                          <span><MapPin size={14} /> {task.location}</span>
                        </div>
                      </div>
                      <span className={`severity-tag ${task.severity}`}>{task.severity}</span>
                    </div>
                    
                    <div className="task-footer-volunteer">
                      <span className={`task-status-tag status-${task.status.toLowerCase()}`}>{task.status}</span>
                      <div className="task-buttons-volunteer">
                        <button className="btn btn-outline-danger btn-sm" onClick={() => openModal('requestHelp', task)}>Assistance</button>
                        <Link to={`/task/${task.id}`} className="btn btn-outline-dark btn-sm">Details</Link>
                        <button className="btn btn-success" onClick={() => openModal('complete', task)}>Mark as Complete</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-tasks-message">You have no active tasks.</div>
              )}
            </div>
          </div>
        </aside>
      </div>
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={
          modalState.type === 'complete' ? 'Confirm Task Completion'
          : modalState.type === 'requestHelp' ? 'Request Assistance'
          : 'Confirm'
        }
      >
        {modalState.type === 'complete' && modalState.data && (
          <div>
            <p>You are about to mark this task as complete. Please add any relevant notes below.</p>
            <div className="modal-task-details"><p><strong>Task:</strong> {modalState.data.title}</p></div>
            <textarea
              className="modal-textarea"
              placeholder="Any comments or issues you faced? (Optional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            ></textarea>
            <div className="modal-footer">
              <button className="btn btn-outline-dark" onClick={closeModal}>Cancel</button>
              <button className="btn btn-success" onClick={confirmCompleteTask}>Mark as Complete</button>
            </div>
          </div>
        )}
        {modalState.type === 'requestHelp' && modalState.data && (
          <div>
            <p>Request assistance for task: <strong>{modalState.data.title}</strong></p>
            <p className="modal-subtext">Explain why you need assistance. This will be sent to an administrator.</p>
            <textarea
              className="modal-textarea"
              placeholder="e.g., 'Encountered more victims than expected, require medical backup.' or 'Road is blocked, need alternative route or heavy equipment.'"
              value={assistanceNotes}
              onChange={(e) => setAssistanceNotes(e.target.value)}
            ></textarea>
            <div className="modal-footer">
              <button className="btn btn-outline-dark" onClick={closeModal}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRequestAssistance}>Send Assistance Request</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

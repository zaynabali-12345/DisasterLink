// VictimDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Shield, User, Clock } from 'lucide-react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './VictimDashboard.css';

// Helper component to recenter the map when data changes
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

// --- Custom Icons ---
const victimIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const volunteerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// --- Custom Hook for Marker Animation ---
const useAnimatedMarker = (markerRef, startPos, endPos, duration) => {
  useEffect(() => {
    if (!markerRef.current || !startPos || !endPos) return;

    const marker = markerRef.current;
    let startTime = null;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        const newLat = startPos[0] + (endPos[0] - startPos[0]) * progress;
        const newLng = startPos[1] + (endPos[1] - startPos[1]) * progress;
        marker.setLatLng([newLat, newLng]);
        requestAnimationFrame(animate);
      } else {
        marker.setLatLng(endPos);
      }
    };

    requestAnimationFrame(animate);

  }, [markerRef, startPos, endPos, duration]);
};

// --- ROBUST FIX: Parse and validate location coordinates ---
const getValidCoordinates = (locationData) => {
  if (!locationData || typeof locationData !== 'string') return null;

  // This regex is more robust for parsing "lat, lng" or just "lat,lng"
  const match = locationData.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  
  // Fallback for older format if needed, though the regex should cover it.
  const parts = locationData.split(',').map(coord => parseFloat(coord.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts; // Returns [lat, lng]
  }
  
  return null; // Return null if data is invalid
};


const VictimDashboard = () => {
  const [requestId, setRequestId] = useState('');
  const [victimData, setVictimData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [volunteerPosition, setVolunteerPosition] = useState(null);
  const [previousVolunteerPosition, setPreviousVolunteerPosition] = useState(null);
  const volunteerMarkerRef = useRef(null);

  // Animate marker from previous to current position over 5 seconds
  useAnimatedMarker(
    volunteerMarkerRef,
    previousVolunteerPosition,
    volunteerPosition,
    5000 // Duration in ms
  );

  // --- Status Steps for the Tracker ---
  const statusSteps = ['Pending', 'Assigned', 'On the way', 'Completed'];

  const handleRequestIdChange = (e) => {
    setRequestId(e.target.value);
  };

  // This function is now only for the initial fetch
  const fetchVictimData = async () => {
    // If the input is empty, always show an error and stop.
    if (!requestId.trim()) {
        setError('Please enter a valid Request ID.');
        return;
    }

    // --- FIX: Add client-side validation for the ObjectId format ---
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(requestId.trim())) {
      setError('Invalid Request ID format. Please check the ID and try again.');
      setVictimData(null); // Clear any previous data
      return;
    }

    // --- DEFINITIVE FIX: Reset state directly and sequentially ---
    setError('');
    setVictimData(null);
    setVolunteerPosition(null);
    setPreviousVolunteerPosition(null);
    setLoading(true);

    try {
      const response = await axios.get(`/api/requests/${requestId.trim()}`);
      setVictimData(response.data); // This will trigger re-renders
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch victim data.');
      setVictimData(null); // Ensure data is null on error
    } finally {
      setLoading(false);
    }
  };

  // --- SIMULATION LOGIC ---
  useEffect(() => {
    if (victimData && victimData.assignedVolunteer) {
      // Calculate victimLocation INSIDE the effect
      const victimLocation = getValidCoordinates(victimData.location);
      if (!victimLocation) return; // Stop if location is invalid

      // Set initial volunteer position if not already set
      if (!volunteerPosition) {
        const startLat = victimLocation[0] + 0.05;
        const startLng = victimLocation[1] + 0.05;
        setPreviousVolunteerPosition([startLat, startLng]);
        setVolunteerPosition([startLat, startLng]);
        return; // Return early to allow state to update
      }
      
      const simulationInterval = setInterval(() => {
        setVolunteerPosition(prevPosition => {
          if (!prevPosition) return null;

          const [lat, lng] = prevPosition;
          const [victimLat, victimLng] = victimLocation;

          const distance = Math.sqrt(Math.pow(victimLat - lat, 2) + Math.pow(victimLng - lng, 2));
          if (distance < 0.001) {
            clearInterval(simulationInterval);
            return prevPosition;
          }

          const newLat = lat + (victimLat - lat) * 0.1;
          const newLng = lng + (victimLng - lng) * 0.1;

          setPreviousVolunteerPosition(prevPosition);
          return [newLat, newLng];
        });
      }, 5000);

      return () => clearInterval(simulationInterval);
    }
  }, [victimData, volunteerPosition]); // Dependency array is now simpler and more robust

  const getStatusIndex = (currentStatus) => {
      const index = statusSteps.indexOf(currentStatus);
      if (currentStatus === 'Assigned' || currentStatus === 'InProgress') {
        if (volunteerPosition) {
          return 2;
        }
        return 1;
      }
      return index > -1 ? index : 0;
  };

  // Calculate victimLocation for rendering, it's safe here.
  const victimLocationForRender = victimData ? getValidCoordinates(victimData.location) : null;

  return (
    <div className="victim-dashboard-split-view">
      {/* --- Left Panel --- */}
      <div className="victim-left-panel glass-card">
        <h2>Track Your Request</h2>
        <div className="input-group">
          <label htmlFor="requestId">Enter Request ID</label>
          <input
            type="text"
            id="requestId"
            value={requestId}
            onChange={handleRequestIdChange}
            placeholder="e.g., 68ce..."
          />
          <button onClick={fetchVictimData} disabled={loading}>
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {victimData && victimLocationForRender && (
          <>
            <div className="details-section">
              <div className="request-details-header">
                <div className="detail-card">
                  <Shield size={20} className="detail-icon" />
                  <div>
                    <h4>Request ID</h4>
                    <p>{victimData._id}</p>
                  </div>
                </div>
                {victimData.assignedVolunteer && (
                  <div className="detail-card">
                    <User size={20} className="detail-icon" />
                    <div>
                      <h4>Assigned Volunteer</h4>
                      <p>{victimData.assignedVolunteer.name}</p>
                    </div>
                  </div>
                )}
                {victimData.assignedVolunteer?.currentLocation?.lastUpdated && (
                   <div className="detail-card">
                    <Clock size={20} className="detail-icon" />
                    <div>
                      <h4>Last Updated</h4>
                      <p>{new Date(victimData.assignedVolunteer.currentLocation.lastUpdated).toLocaleTimeString()}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="status-tracker">
                {statusSteps.map((step, index) => (
                  <div key={step} className={`status-step ${getStatusIndex(victimData.status) >= index ? 'active' : ''}`}>
                    <div className="status-dot"></div>
                    <div className="status-label">{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="map-legend">
              <div className="legend-item">
                <span className="legend-icon victim"></span> Your Location
              </div>
              <div className="legend-item">
                <span className="legend-icon volunteer"></span> Volunteer
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Right Panel (Map) --- */}
      <div className="victim-right-panel">
        {loading ? (
          <div className="map-placeholder">Loading Map...</div>
        ) : victimLocationForRender ? (
          <MapContainer
            center={victimLocationForRender}
            zoom={13}
            className="tracking-map"
          >
            <MapRecenter center={victimLocationForRender} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <Marker position={victimLocationForRender} icon={victimIcon}>
                <Popup>Your Location</Popup>
            </Marker>
            {volunteerPosition && (
              <Marker
                ref={volunteerMarkerRef}
                position={volunteerPosition}
                icon={volunteerIcon}
              >
                <Popup>Volunteer Location</Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="map-placeholder">
            {error ? error : 'Enter a Request ID to see the map'}
          </div>
        )}
      </div>
    </div>
  );
};
export default VictimDashboard;

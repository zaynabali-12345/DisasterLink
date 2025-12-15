import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// A helper component to programmatically update the map view
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const RiskMap = ({ latitude, longitude, magnitude, risk }) => {
  const position = [latitude, longitude];

  // Helper function to get color based on risk
  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return '#2ecc71'; // Green
      case 'moderate':
        return '#f1c40f'; // Yellow
      case 'high':
        return '#e67e22'; // Orange
      case 'severe':
        return '#e74c3c'; // Red
      default:
        return '#3388ff'; // Default blue
    }
  };

  const circleOptions = {
    radius: 10,
    fillColor: getRiskColor(risk),
    color: '#fff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8,
  };

  return (
    <div className="risk-map-container" style={{ height: '400px', width: '100%', marginTop: '2rem', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer 
        center={position} 
        zoom={7} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
        key={`${latitude}-${longitude}`} // Re-mounts the map on new prediction to avoid stale state
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {/* This component handles map view changes when props update */}
        <MapUpdater center={position} zoom={7} />

        <CircleMarker center={position} pathOptions={circleOptions}>
          <Popup>
            <div>
              <h4>Prediction Details</h4>
              <p>
                <strong>Magnitude:</strong> {magnitude.toFixed(2)}
              </p>
              <p>
                <strong>Risk Level:</strong> {risk}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
};

export default RiskMap;


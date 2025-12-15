import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayersControl, Tooltip } from 'react-leaflet';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaArrowDown, FaChartLine, FaWaveSquare } from 'react-icons/fa';
import Message from '../../components/Message';
import './PredictionPage.css';
import 'leaflet/dist/leaflet.css';

// --- Helper Component to Update Map View ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) { 
      // Use flyTo for a smooth animation
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// --- Custom Marker Icon ---
const markerIcon = new L.Icon({
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// --- Custom Icon for Nearby Cities ---
const nearbyCityIcon = new L.DivIcon({
  html: `<div class="nearby-city-pin"></div>`,
  className: 'nearby-city-icon',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

const getMagnitudeColor = (magnitude) => {
  if (magnitude < 4) return '#4CAF50'; // Low
  if (magnitude < 6) return '#FFC107'; // Moderate
  if (magnitude < 7) return '#FF9800'; // High
  return '#F44336'; // Severe
};

const getDepthClassification = (depth) => {
    if (depth <= 70) return 'Shallow (more destructive)';
    if (depth <= 300) return 'Intermediate';
    return 'Deep';
};

const PredictionPage = () => {
  const [city, setCity] = useState('');
  const [depth, setDepth] = useState(10);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([
    { city: 'Tokyo, Japan', predicted_magnitude: 6.8 },
    { city: 'Los Angeles, USA', predicted_magnitude: 5.2 },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recentQuakes, setRecentQuakes] = useState([]);
  const [loadingQuakes, setLoadingQuakes] = useState(false);
  const [affectedPopulation, setAffectedPopulation] = useState(null);
  const [nearbyCities, setNearbyCities] = useState([]);

  const handleCityChange = async (e) => {
    const query = e.target.value;
    setCity(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?city=${query}&format=json&limit=5`);
      const data = await response.json();
      setSuggestions(data.filter(item => item.address).map(item => ({
          name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          country: item.address.country || '',
        })
      ));
    } catch (error) {
      console.error("Failed to fetch city suggestions:", error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion.name);
    setSelectedCity({ latitude: suggestion.lat, longitude: suggestion.lon });
    setSuggestions([]);
  };

  useEffect(() => {
    const fetchImpactData = async () => {
      if (!predictionResult) return;

      const { latitude, longitude } = predictionResult;

      // 1. Fetch Nearby Cities & Population from GeoNames
      try {
        const geoNamesUrl = `https://secure.geonames.org/findNearbyJSON?lat=${latitude}&lng=${longitude}&radius=250&cities=cities15000&maxRows=20&username=disasterlink`; // Replace with your GeoNames username
        const response = await axios.get(geoNamesUrl);
        const places = response.data.geonames || []; 
        
        let totalPopulation = 0;
        places.forEach(place => {
          if (place.population) {
            totalPopulation += place.population;
          }
        }); 
        setAffectedPopulation(totalPopulation);

      } catch (err) {
        console.error("Failed to fetch GeoNames data:", err);
        setAffectedPopulation(null); // Set to null on error
      }

      // 2. Fetch major nearby cities from Overpass API
      try {
        const overpassQuery = `[out:json];(nodeplace~"^(city|town)$";);out;`;
        const response = await axios.get(`https://overpass-api.de/api/interpreter?data=[out:json];node(around:250000,${latitude},${longitude})[place~"^(city|town)$"];out;`);
        const cities = response.data.elements.map(el => ({
          name: el.tags.name,
          lat: el.lat,
          lon: el.lon,
        })).filter(c => c.name).slice(0, 5); // Get top 5
        setNearbyCities(cities);
      } catch (err) {
        console.error("Failed to fetch Overpass data:", err); // Keep this log for debugging
        setNearbyCities([]); // Set to empty array on error
      }
    };

    fetchImpactData();
  }, [predictionResult]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // If user presses enter without clicking a suggestion, use the first one if available.
    if (!selectedCity && suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
      // The state update is async, so we can't proceed immediately.
      // A more robust solution might involve using the suggestion directly here.
      // For now, we'll let the user submit again after the field is populated.
      setError('City selected. Please click "Predict Risk" again.');
      return;
    }
    setLoading(true);
    setError('');
    setPredictionResult(null);

    try {
      const response = await axios.post('/api/predict/earthquake', {
        city: city.split(',')[0],
        depth: parseInt(depth),
      });

      const result = response.data;
      // The backend now returns the full prediction object including coordinates.
      // We can directly use this result.
      setPredictionResult(result);

      // Update history with the result from the backend
      const updatedHistory = [result, ...predictionHistory].slice(0, 5);
      setPredictionHistory(updatedHistory);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowRecentQuakes = async () => {
    if (!predictionResult) return;
    setIsModalOpen(true);
    setLoadingQuakes(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startTime = thirtyDaysAgo.toISOString();

      const response = await axios.get('https://earthquake.usgs.gov/fdsnws/event/1/query', {
        params: {
          format: 'geojson',
          starttime: startTime,
          latitude: predictionResult.latitude,
          longitude: predictionResult.longitude,
          maxradiuskm: 250,
          minmagnitude: 2.5,
        },
      });

      setRecentQuakes(response.data.features.map(quake => ({
        ...quake.properties,
        id: quake.id,
      })));
    } catch (error) {
      setError('Could not fetch recent earthquakes from USGS.');
    } finally {
      setLoadingQuakes(false);
    }
  };

  return (
    <div className={`prediction-page-new ${predictionResult && (predictionResult.predicted_risk === 'High' || predictionResult.predicted_risk === 'Severe') ? 'pulse-bg' : ''}`}>
      {/* --- Left Panel (Info & Input) --- */}
      <div className="prediction-panel left-panel">
        <motion.div className="form-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h3 className="panel-title">Earthquake Predictor</h3>
          <form onSubmit={handleSubmit}>
            <div className="input-group-new">
              <label htmlFor="city"><FaMapMarkerAlt /> City or Location</label>
              <div className="search-wrapper">
                <input type="text" id="city" value={city} onChange={handleCityChange} placeholder="e.g., San Francisco" autoComplete="off" required />
                {suggestions.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((s, index) => (
                      <li key={index} onClick={() => handleSuggestionClick(s)}>{s.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="input-group-new">
              <label htmlFor="depth"><FaArrowDown /> Depth (km) <span className="depth-tooltip">{depth} km</span></label>
              <div className="slider-wrapper">
                <input type="range" id="depth" min="0" max="700" value={depth} onChange={(e) => setDepth(e.target.value)} className="depth-slider" />
              </div>
            </div>
            <button type="submit" className="predict-button" disabled={loading}>{loading ? <span className="loader-button"></span> : 'Predict Risk'}</button>
          </form>
        </motion.div>

        <motion.div className="history-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h3 className="panel-title">Past Predictions</h3>
          <div className="history-list">
            {predictionHistory.map((p, index) => (
              <div key={index} className="history-item">
                <div className="history-city">{p.city}</div>
                <div className="history-magnitude">M {p.predicted_magnitude.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {predictionResult && (
          <motion.div className={`precautions-card risk-${predictionResult.predicted_risk.toLowerCase()}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <h3 className="panel-title">Precautionary Measures</h3>
            <ul className="precautions-list">
              {predictionResult.predicted_risk === 'High' || predictionResult.predicted_risk === 'Severe' ? (
                <>
                  <li>Drop, Cover, and Hold On.</li>
                  <li>If outdoors, stay away from buildings and power lines.</li>
                  <li>Prepare an emergency kit.</li>
                </>
              ) : (
                <>
                  <li>Secure heavy furniture to walls.</li>
                  <li>Identify safe spots in each room.</li>
                </>
              )}
            </ul>
          </motion.div>
        )}
      </div>

      {/* --- Center Panel (Map) --- */}
      <div className="center-panel">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} className="prediction-map" scrollWheelZoom={true}>
          <ChangeView center={predictionResult ? [predictionResult.latitude, predictionResult.longitude] : null} zoom={7} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>' />
          {predictionResult && (
            <>
              <Marker position={[predictionResult.latitude, predictionResult.longitude]} icon={markerIcon}>
                <Popup>{predictionResult.city}</Popup>
              </Marker>
              <Circle center={[predictionResult.latitude, predictionResult.longitude]} radius={250000} pathOptions={{ color: '#F44336', fillColor: '#F44336', fillOpacity: 0.15 }} />
            </>
          )}
        </MapContainer>
        {predictionResult && (
          <motion.div className="quick-stats-overlay" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            {affectedPopulation !== null && (
              <div><strong>Population (250km):</strong> ~{(affectedPopulation / 1000000).toFixed(1)}M</div>
            )}
            {nearbyCities.length > 0 && (
              <div><strong>Nearby Cities:</strong> {nearbyCities.join(', ')}</div>
            )}
            <div className="contextual-summary">
              <p>⚠️ A magnitude {predictionResult.predicted_magnitude.toFixed(1)} earthquake at {depth} km depth near {predictionResult.city} has a {predictionResult.predicted_risk} risk. Preparedness recommended.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* --- Right Panel (Details) --- */}
      <div className="right-panel">
        <div className="right-panel-content">
          {loading && (
            <div className="result-placeholder"><div className="loader-large" /><p>Analyzing seismic data...</p></div>
          )}
          {error && <div className="result-placeholder"><Message variant="danger">{error}</Message></div>}
          {!loading && !predictionResult && !error && (
            <div className="result-placeholder"><FaChartLine className="placeholder-icon" /><h3>Awaiting Prediction</h3><p>Results will be displayed here.</p></div>
          )}
          {predictionResult && (
            <motion.div className="results-container" initial="hidden" animate="visible" variants={{ visible: { opacity: 1, transition: { staggerChildren: 0.2 } }, hidden: { opacity: 0 } }}>
              <motion.div className="result-card" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
                <h3 className="panel-title">Magnitude</h3>
                <div className="chart-container-new">
                  <CircularProgressbar value={predictionResult.predicted_magnitude} maxValue={10} text={`${predictionResult.predicted_magnitude.toFixed(2)}`}
                    styles={buildStyles({
                      rotation: 0.75, strokeLinecap: 'round', textSize: '18px', pathTransitionDuration: 0.8,
                      pathColor: getMagnitudeColor(predictionResult.predicted_magnitude),
                      textColor: getMagnitudeColor(predictionResult.predicted_magnitude),
                      trailColor: '#e0e4e8',
                    })}
                  />
                </div>
              </motion.div>

              <motion.div className="result-card" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
                <h3 className="panel-title">Impact Analysis</h3>
                <div className="impact-list">
                  <div className="impact-item">
                    <span className="impact-label">Risk Level</span>
                    <span className={`impact-value risk-badge ${predictionResult.predicted_risk.toLowerCase()}`}>{predictionResult.predicted_risk}</span>
                  </div>
                  <div className="impact-item">
                    <span className="impact-label">Depth Classification</span>
                    <span className="impact-value">{getDepthClassification(depth)}</span>
                  </div>
                </div>
              </motion.div>

              <motion.div className="result-card" variants={{ visible: { opacity: 1, y: 0 }, hidden: { opacity: 0, y: 20 } }}>
                <h3 className="panel-title">Recent Earthquake Alerts</h3>
                <button className="recent-quakes-btn" onClick={handleShowRecentQuakes}><FaWaveSquare /> Show Recent Earthquakes</button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-container" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Recent Earthquakes (Last 30 Days)</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {loadingQuakes ? <div className="loader-large"></div> : (
                <table className="quakes-table">
                  <thead><tr><th>Location</th><th>Magnitude</th><th>Time</th></tr></thead>
                  <tbody>
                    {recentQuakes.length > 0 ? recentQuakes.map((quake) => (
                      <tr key={quake.id}><td>{quake.place}</td><td>{quake.mag.toFixed(1)}</td><td>{new Date(quake.time).toLocaleString()}</td></tr>
                    )) : <tr><td colSpan="3">No significant earthquakes found in this area recently.</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionPage;
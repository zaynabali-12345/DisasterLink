import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReCAPTCHA from 'react-google-recaptcha';
import Loader from '../components/Loader.jsx';
import Message from '../components/Message.jsx';
import './RequestHelpPage.css';

const RequestHelpPage = () => {
  // --- Existing State ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Add state for email
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [description, setDescription] = useState('');
  const [people, setPeople] = useState(1);
  const [priority, setPriority] = useState('Medium');
  const [aadhaarFile, setAadhaarFile] = useState(null); // Renamed for clarity
  const [currentPhoto, setCurrentPhoto] = useState(null);

  // --- New state for Aadhaar validation ---
  const [isAadhaarValidating, setIsAadhaarValidating] = useState(false);
  const [aadhaarValidationError, setAadhaarValidationError] = useState('');
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  // --- New State for reCAPTCHA ---
  const [captchaToken, setCaptchaToken] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // --- New Ref for reCAPTCHA ---
  // This allows us to reset the CAPTCHA programmatically
  const recaptchaRef = useRef(null);

  const submitHandler = async (e) => {
    e.preventDefault();

    // --- Step 1: Check if CAPTCHA is completed ---
    if (!captchaToken) {
      setError('Please complete the CAPTCHA before submitting.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email); // Append email to form data
    formData.append('contact', contact);
    formData.append('description', description);
    formData.append('people', people);
    formData.append('priority', priority);
    // --- FIX: Send coordinates and text location ---
    formData.append('location', location); // Keep the text for display/fallback
    formData.append('latitude', coords.latitude);
    formData.append('longitude', coords.longitude);

    // --- Step 2: Append the CAPTCHA token to the form data ---
    formData.append('captchaToken', captchaToken);

    if (currentPhoto) {
      formData.append('currentPhoto', currentPhoto);
    }

    try {
      const { data } = await axios.post('/api/requests', formData);

      setMessage(
        `Your request (ID: ${data.requestId}) has been submitted successfully! A confirmation email has been sent. Please save your ID to track your status.`
      );
      setLoading(false);

      // The form will be hidden due to the `!message` condition below.
      // We don't need to clear the fields as the component will unmount.
    } catch (err) {
      let errorMessage = 'An unexpected error occurred.';
      if (err.response) {
        console.error('Error Response Data:', err.response.data);
        errorMessage = err.response.data.message || 'Server responded with an error.';
      } else {
        console.error('Error Message:', err.message);
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);

      // --- Reset CAPTCHA on error so the user can try again ---
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setCaptchaToken(null);
      }
    }
  };

  const handleAadhaarFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAadhaarFile(file);
    setIsAadhaarValidating(true);
    setAadhaarValidationError('');
    setIsAadhaarVerified(false);

    const validationFormData = new FormData();
    validationFormData.append('aadhaarPhoto', file);

    try {
      // Call the new validation endpoint
      await axios.post('/api/validate/aadhaar', validationFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsAadhaarVerified(true);
    } catch (err) {
      const message =
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Failed to validate Aadhaar card.';
      setAadhaarValidationError(message);
      setAadhaarFile(null); // Clear the invalid file
    } finally {
      setIsAadhaarValidating(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError('');
      navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ latitude, longitude });
          
          // --- NEW: Reverse geocode the coordinates to get an address ---
          try {
            const { data } = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            // Format the location string as requested
            const locationName = data.display_name || 'Address not found';
            setLocation(
              `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (${locationName})`
            );
          } catch (geoError) {
            console.error('Reverse geocoding failed:', geoError);
            // Fallback to just coordinates if geocoding fails
            setLocation(`Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError(`Could not get location: ${err.message}`);
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="request-help-page">
      <div className="container">
        <header className="request-header">
          <h1>Request Immediate Help</h1>
          <p>
            Fill out the form below. Your request will be sent to the nearest
            available NGO.
          </p>
        </header>

        {loading && <Loader />}
        {error && <Message variant="danger">{error}</Message>}
        {message && <Message variant="success">{message}</Message>}

        {!message && ( // Only show form if there's no success message
          <div className="request-form-container">
            <form onSubmit={submitHandler} className="request-form">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address (for confirmation)</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="contact">Contact Number</label>
                <input type="text" id="contact" value={contact} onChange={(e) => setContact(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="location">Your Location (e.g., "City, Landmark")</label>
                <button type="button" className="btn-get-location" onClick={handleGetLocation}>
                  Get My Current Location
                </button>
                <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="description">Describe the Situation</label>
                <textarea id="description" rows="5" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="people">Number of People Affected</label>
                <input type="number" id="people" value={people} onChange={(e) => setPeople(e.target.value)} min="1" required />
              </div>
              <div className="form-group">
                <label htmlFor="priority">Urgency Level</label>
                <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} required>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="citizenshipPhoto">
                  Upload Aadhaar Card (Optional)
                </label>
                <input
                  type="file"
                  id="citizenshipPhoto"
                  onChange={handleAadhaarFileChange}
                />
                {isAadhaarValidating && <Loader />}
                {aadhaarValidationError && (
                  <Message variant="danger">{aadhaarValidationError}</Message>
                )}
                {isAadhaarVerified && (
                  <Message variant="success">Aadhaar Verified!</Message>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="currentPhoto">Upload Photo of the Situation (Optional)</label>
                <input type="file" id="currentPhoto" onChange={(e) => setCurrentPhoto(e.target.files[0])} />
              </div>

              {/* --- Step 3: Add the ReCAPTCHA component to the form --- */}
              <div className="form-group">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>

              {/* --- Step 4: Disable button until CAPTCHA is solved --- */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !captchaToken || isAadhaarValidating}
              >
                {loading ? 'Submitting...' : 'Send Help Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestHelpPage;

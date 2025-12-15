import React, { useState } from 'react';
import axios from 'axios';
import Loader from '../components/Loader'; // Import the Loader
import './ContactPage.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '', // Optional field
    queryType: 'General Inquiry', // Default value for the dropdown
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState(''); // '', 'sending', 'sent', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      await axios.post('/api/contact/send', formData);
      setStatus('sent');
      setFormData({ // Reset form to initial state
        name: '',
        email: '',
        phoneNumber: '', 
        queryType: 'General Inquiry',
        subject: '',
        message: ''
      });
      setTimeout(() => setStatus(''), 5000); // Clear status message after 5 seconds
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'An unexpected error occurred. Please try again.');
      setTimeout(() => setStatus(''), 5000); // Clear status message
    }
  };

  const getButtonText = () => {
    if (status === 'sending') return 'Sending...';
    return 'Send Message';
  };

  return (
    <div className="contact-page">
      {status === 'sending' && <Loader />}
      <div className="container">
        <header className="contact-header">
          <h1>Contact Us</h1>
          <p>We're here to help. Reach out with questions, concerns, or partnership opportunities.</p>
        </header>

        <div className="contact-content">
          <div className="contact-form-container">
            <form onSubmit={handleSubmit} className="contact-form no-validate">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number (Optional)</label>
                <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="queryType">Query Type</label>
                <select id="queryType" name="queryType" value={formData.queryType} onChange={handleChange} required>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                  <option value="NGO Registration Question">NGO Registration Question</option>
                  <option value="Volunteer Registration Issue">Volunteer Registration Issue</option>
                  <option value="Technical Support (Login, Dashboard, etc.)">Technical Support (Login, Dashboard, etc.)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="6" value={formData.message} onChange={handleChange} required></textarea>
              </div>
              <button type="submit" className="btn btn-primary" disabled={status === 'sending'}>
                {getButtonText()}
              </button>
              {status === 'sent' && (
                <p className="form-status success">Thank you for your message! We will get back to you soon.</p>
              )}
              {status === 'error' && (
                <p className="form-status error">{errorMessage}</p>
              )}
            </form>
          </div>

          <div className="contact-info">
            <h3>Direct Contact</h3>
            <p><strong>Email:</strong> <a href="mailto:disasterlinkhelp@gmail.com">disasterlinkhelp@gmail.com</a></p>
            <p><strong>Emergency Hotline:</strong> +91-XXXXXXXXXX</p>
            <p><strong>Website:</strong> <a href="http://www.disasterlink.in">www.disasterlink.in</a></p>
            <p><strong>Office:</strong> 4th Floor, Disaster Response Unit, Bengaluru, India</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
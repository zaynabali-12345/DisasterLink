import React, { useState } from 'react';
import axios from 'axios';
import './AddUserForm.css';

const AddUserForm = ({ onFormSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [role, setRole] = useState('Volunteer');
  const [password, setPassword] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const userData = { name, email, password, role, sendEmail, personalEmail };

      // The backend will handle user creation and potentially sending an email
      const { data } = await axios.post('/api/users', userData, config);
      
      onFormSubmit(data); // Pass the new user data back to the parent
      setLoading(false);
      onClose(); // Close the modal on success
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to create user. Please try again.');
    }
  };

  return (
    <div className="add-user-modal-overlay">
      <div className="add-user-form-container">
        <form onSubmit={submitHandler} className="add-user-form">
          <div className="modal-header">
            <h2>Add New User</h2>
            <button type="button" className="close-modal-btn" onClick={onClose}>&times;</button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" required />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" required />
          </div>

          <div className="form-group">
            <label>Personal Email (for credentials)</label>
            <input type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="personal@example.com" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required>
                <option value="Volunteer">Volunteer</option>
                <option value="NGO">NGO</option>
                <option value="Emergency">Emergency</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to auto-generate" />
            </div>
          </div>

          <div className="form-group-checkbox">
            <input 
              type="checkbox" 
              id="sendEmail" 
              checked={sendEmail} 
              onChange={(e) => setSendEmail(e.target.checked)} 
            />
            <label htmlFor="sendEmail">Send credentials to user via email</label>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserForm;
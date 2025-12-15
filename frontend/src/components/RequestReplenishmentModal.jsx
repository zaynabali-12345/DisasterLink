import React, { useState } from 'react';
import axios from 'axios';
import './RequestReplenishmentModal.css'; // We'll create this CSS file next

const RequestReplenishmentModal = ({ resource, onClose, onSubmitted }) => {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      setError('Please enter a valid quantity.');
      return;
    }
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

      const requestData = {
        resourceId: resource._id,
        resourceName: resource.name,
        ngoId: userInfo._id,
        ngoName: userInfo.name,
        quantity: Number(quantity),
      };

      // This new endpoint will handle creating the replenishment request
      await axios.post('/api/resources/request-replenishment', requestData, config);

      setLoading(false);
      onSubmitted(); // Notify parent component to show a success message
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to submit request.');
    }
  };

  return (
    <div className="replenish-modal-overlay">
      <div className="replenish-modal-container">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Request More: {resource.name}</h3>
            <button type="button" className="close-modal-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {error && <p className="error-message">{error}</p>}
            <p>Current Stock: {resource.quantity} {resource.unit}</p>
            <div className="form-group">
              <label htmlFor="quantity">Required Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100"
                min="1"
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestReplenishmentModal;

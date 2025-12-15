import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RequestReplenishmentModal.css'; // Re-using styles

const AssignResourceModal = ({ resource, onClose, onAssigned }) => {
  const [ngos, setNgos] = useState([]);
  const [selectedNgo, setSelectedNgo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNgos = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/users/all', config);
        // Filter for users who are NGOs
        setNgos(data.filter(user => user.role.toLowerCase() === 'ngo'));
      } catch (err) {
        setError('Failed to load list of NGOs.');
      } finally {
        setLoading(false);
      }
    };
    fetchNgos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNgo || !quantity || quantity <= 0) {
      if (quantity <= 0) {
        setError('Please enter a quantity greater than zero.');
        return;
      }
      setError('Please select an NGO.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post(
        '/api/ngo-resources/assign',
        { centralResourceId: resource._id, ngoId: selectedNgo, quantity: Number(quantity) },
        config
      );
      // FIX: Call onAssigned with a clear success message for the admin.
      onAssigned(
        `${quantity} units of '${resource.resourceName}' have been assigned to the NGO.`
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign resource.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="replenish-modal-overlay">
      <div className="replenish-modal-container">
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h3>Assign: {resource.resourceName}</h3>
            <button type="button" className="close-modal-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="modal-body">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="quantity">Quantity to Assign</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`Max: ${resource.totalQuantity}`}
                max={resource.totalQuantity}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ngo">Assign to NGO</label>
              <select id="ngo" value={selectedNgo} onChange={(e) => setSelectedNgo(e.target.value)} required>
                <option value="">-- Select an NGO --</option>
                {ngos.map(ngo => (
                  <option key={ngo._id} value={ngo._id}>{ngo.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !selectedNgo || !quantity}>
              {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignResourceModal;

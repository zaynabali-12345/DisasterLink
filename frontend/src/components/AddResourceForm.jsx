import React, { useState } from 'react';
import axios from 'axios';
import './AddResourceForm.css';

const AddResourceForm = ({ resourceToEdit, onFormSubmit, onClose }) => {
  // State is initialized with data from `resourceToEdit` if it exists, otherwise with defaults.
  const [name, setName] = useState(resourceToEdit?.name || '');
  const [category, setCategory] = useState(resourceToEdit?.category || 'Food');
  const [quantity, setQuantity] = useState(resourceToEdit?.quantity ?? '');
  const [unit, setUnit] = useState(resourceToEdit?.unit || 'items');
  const [location, setLocation] = useState(resourceToEdit?.location || '');
  const [contact, setContact] = useState(resourceToEdit?.contact || '');
  const [status, setStatus] = useState(resourceToEdit?.status || 'Available');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditMode = Boolean(resourceToEdit);

  // This effect pre-fills the form when it's opened in edit mode.
  React.useEffect(() => {
    if (isEditMode) {
      setName(resourceToEdit.name);
      setCategory(resourceToEdit.category);
      setQuantity(resourceToEdit.quantity);
      setUnit(resourceToEdit.unit);
      setLocation(resourceToEdit.location);
      setContact(resourceToEdit.contact);
      setStatus(resourceToEdit.status);
    }
  }, [isEditMode, resourceToEdit]);

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

      const resourceData = { name, category, quantity, unit, location, contact, status };

      if (isEditMode) {
        // If editing, send a PUT request to the specific resource's URL
        const { data } = await axios.put(`/api/ngo-resources/${resourceToEdit._id}`, resourceData, config);
        onFormSubmit(data, true); // Pass true to indicate it was an edit
      } else {
        // If creating, send a POST request
        const { data } = await axios.post('/api/ngo-resources', resourceData, config);
        onFormSubmit(data, false); // Pass false to indicate it was a create
      }

      setLoading(false);
      onClose(); // Close the form/modal on success
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to save resource. Please try again.');
    }
  };

  return (
    <div className="add-resource-modal-overlay">
      <div className="add-resource-form-container">
        <form onSubmit={submitHandler} className="add-resource-form">
          {/* The title changes based on whether we are editing or adding */}
          <h2>{isEditMode ? 'Edit Resource' : 'Add a New Resource'}</h2>
          {error && <div className="error-message" style={{color: '#e74c3c', marginBottom: '1rem', textAlign: 'center'}}>{error}</div>}
          
          <div className="form-group">
            <label>Resource Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Water Bottles, Blankets" required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="Food">Food</option>
              <option value="Water">Water</option>
              <option value="Medical">Medical</option>
              <option value="Shelter">Shelter</option>
              <option value="Clothing">Clothing</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" required />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g., items, kg, kits" />
            </div>
          </div>

          <div className="form-group">
            <label>Location of Resource</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Warehouse A, City Center" required />
          </div>

          <div className="form-group">
            <label>Contact Info for Coordination</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="e.g., 555-1234 or manager@ngo.org" required />
          </div>

          {/* This status dropdown only appears when editing a resource */}
          {isEditMode && (
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Available">Available</option>
                <option value="Partially Used">Partially Used</option>
                <option value="Depleted">Depleted</option>
              </select>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            {/* The button text also changes based on the mode */}
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Add Resource')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceForm;

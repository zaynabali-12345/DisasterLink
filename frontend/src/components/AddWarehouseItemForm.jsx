import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddUserForm.css'; // Re-using styles for consistency

const AddWarehouseItemForm = ({ itemToEdit, onFormSubmit, onClose }) => {
  const [resourceName, setResourceName] = useState('');
  const [category, setCategory] = useState('Other');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [unit, setUnit] = useState('items');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = Boolean(itemToEdit);

  useEffect(() => {
    if (isEditMode) {
      setResourceName(itemToEdit.resourceName);
      setCategory(itemToEdit.category);
      setTotalQuantity(itemToEdit.totalQuantity);
      setUnit(itemToEdit.unit);
      setLocation(itemToEdit.location);
    }
  }, [itemToEdit, isEditMode]);

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

      const itemData = { resourceName, category, totalQuantity, unit, location };

      let response;
      if (isEditMode) {
        response = await axios.put(`/api/resources/warehouse/${itemToEdit._id}`, itemData, config);
      } else {
        response = await axios.post('/api/resources/warehouse', itemData, config);
      }
      
      onFormSubmit(response.data, isEditMode);
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  return (
    <div className="add-user-modal-overlay">
      <div className="add-user-form-container">
        <form onSubmit={submitHandler} className="add-user-form">
          <div className="modal-header">
            <h2>{isEditMode ? 'Edit Warehouse Item' : 'Add New Warehouse Item'}</h2>
            <button type="button" className="close-modal-btn" onClick={onClose}>&times;</button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Resource Name</label>
            <input type="text" value={resourceName} onChange={(e) => setResourceName(e.target.value)} required />
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
              <label>Total Quantity</label>
              <input type="number" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} required min="0" />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label>Warehouse Location</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : (isEditMode ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehouseItemForm;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './CentralWarehouse.css'; // Use its own dedicated CSS file
import AddWarehouseItemForm from './AddWarehouseItemForm';
import AssignResourceModal from './AssignResourceModal'; // Import the new modal

const CentralWarehouse = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [itemToAssign, setItemToAssign] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchInventory = async () => {
    try {
      setLoading(true); // Show loader during re-fetch
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.get('/api/resources/warehouse', config);
      setInventory(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch warehouse inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleFormSubmit = (item, isEdit) => {
    if (isEdit) {
      setInventory(inventory.map(i => (i._id === item._id ? item : i)));
    } else {
      setInventory([item, ...inventory]);
    }
  };

  const handleAssignmentSuccess = (message) => {
    setSuccessMessage(message);
    // Hide the message after a few seconds
    setTimeout(() => setSuccessMessage(''), 5000);
    // **FIX**: Re-fetch the inventory to show the updated quantity.
    fetchInventory();
  };

  const handleAssignClick = (item) => {
    setItemToAssign(item);
    setIsAssignModalOpen(true);
  };

  const handleEditClick = (item) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item from the warehouse? This action cannot be undone.')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        await axios.delete(`/api/resources/warehouse/${itemId}`, config);
        setInventory(inventory.filter(i => i._id !== itemId));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete item.');
      }
    }
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="central-warehouse-view">
      {successMessage && <Message variant="success">{successMessage}</Message>}
      {isModalOpen && (
        <AddWarehouseItemForm
          itemToEdit={itemToEdit}
          onFormSubmit={handleFormSubmit}
          onClose={() => {
            setIsModalOpen(false);
            setItemToEdit(null);
          }}
        />
      )}
      {isAssignModalOpen && itemToAssign && (
        <AssignResourceModal
          resource={itemToAssign}
          onClose={() => setIsAssignModalOpen(false)}
          onAssigned={handleAssignmentSuccess}
        />
      )}
      <div className="view-header">
        <h1>Central Warehouse Inventory</h1>
        <button className="btn btn-primary" onClick={() => {
          setItemToEdit(null);
          setIsModalOpen(true);
        }}>
          + Add New Item
        </button>
      </div>

      <div className="warehouse-table-container">
        <table className="warehouse-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Category</th>
              <th>Total Quantity</th>
              <th>Unit</th>
              <th>Location</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => (
              <tr key={item._id}>
                <td>{item.resourceName}</td>
                <td>{item.category}</td>
                <td>
                  <span className="stock-quantity">{item.totalQuantity.toLocaleString()}</span>
                </td>
                <td>{item.unit}</td>
                <td>{item.location}</td>
                <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                <td className="actions-cell">
                  <button className="btn-approve" onClick={() => handleAssignClick(item)}>Assign</button>
                  <button className="btn-edit-table" onClick={() => handleEditClick(item)}>Edit</button>
                  <button className="btn-reject" onClick={() => handleDeleteClick(item._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CentralWarehouse;

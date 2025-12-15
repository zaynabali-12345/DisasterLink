import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './ResourceMonitoring.css'; // We will create this CSS file next

const ResourceMonitoring = ({ onDataFetched }) => {
  const [resources, setResources] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  // Encapsulated data fetching logic into a reusable function
  const fetchData = useCallback(async () => {
    try {
      // Reset loading state for re-fetches
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Fetch both resources and replenishment requests in parallel
      const [resourcesResponse, requestsResponse] = await Promise.all([
        axios.get('/api/resources/all', config),
        axios.get('/api/resources/replenishment-requests', config),
      ]);

      setResources(resourcesResponse.data);
      setRequests(requestsResponse.data);
      if (onDataFetched) {
        onDataFetched(); // Notify parent that data has been fetched
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, [onDataFetched]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestUpdate = async (requestId, status) => {
    // Clear previous messages
    setError('');
    setSuccess('');
    setLoading(true); // Show loader when action starts
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };

      await axios.put(
        `/api/resources/replenishment-requests/${requestId}`,
        { status },
        config
      );

      // Give immediate feedback to the admin
      setSuccess(`Request has been successfully ${status.toLowerCase()}.`);
      setTimeout(() => setSuccess(''), 4000);

      // **FIX**: Re-fetch all data to ensure the UI reflects the latest state.
      // This is crucial for updating the stock count in the top table after an approval.
      fetchData();

    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${status.toLowerCase()} request.`);
    } finally {
      setLoading(false); // Hide loader when action is complete
    }
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  const totalStockValue = resources.reduce((acc, resource) => acc + (resource.quantity || 0), 0);
  const lowStockItems = resources.filter(r => r.quantity < 20).length; // Example threshold

  return (
    <div className="resource-monitoring-view">
      {success && <Message variant="success">{success}</Message>}
      <h1>Resource Monitoring</h1>
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Resource Items</h3>
          <p>{totalStockValue.toLocaleString()}</p>
        </div>
        <div className="stat-card low-stock-card">
          <h3>Low Stock Alerts</h3>
          <p>{lowStockItems}</p>
        </div>
        <div className="stat-card">
          <h3>NGOs with Resources</h3>
          {/* This calculates unique NGOs who own resources */}
          <p>{[...new Set(resources.map(r => r.managedBy?.name).filter(Boolean))].length}</p>
        </div>
      </div>
      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th>Resource Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Location</th>
              <th>Managed By (NGO)</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource._id} className={resource.quantity < 20 ? 'low-stock-row' : ''}>
                <td>{resource.name}</td>
                <td>{resource.category}</td>
                <td>
                  <span className="stock-quantity">{resource.quantity}</span>
                </td>
                <td>{resource.unit}</td>
                <td>{resource.location || 'N/A'}</td>
                <td>{resource.managedBy?.name || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Section for Replenishment Requests */}
      <div className="replenishment-requests-section">
        <h2>Pending Replenishment Requests</h2>
        <div className="requests-table-container">
          <table className="resources-table">
            <thead>
              <tr>
                <th>Requesting NGO</th>
                <th>Resource</th>
                <th>Quantity Requested</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req._id}>
                    <td>{req.ngoName}</td>
                    <td>{req.resourceName}</td>
                    <td>{req.quantity}</td>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="actions-cell">
                      <button className="btn-approve" onClick={() => handleRequestUpdate(req._id, 'Approved')}>Approve</button>
                      <button className="btn-reject" onClick={() => handleRequestUpdate(req._id, 'Rejected')}>Reject</button>
                    </td>
                  </tr>
                ))
              ) : (<tr><td colSpan="5" style={{textAlign: 'center'}}>No pending requests.</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResourceMonitoring;

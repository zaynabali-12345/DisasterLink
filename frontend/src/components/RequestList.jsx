import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './AdminDashboard.css'; // Re-using styles for consistency

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          setError('You must be logged in to view this data.');
          setLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/requests', config);
        setRequests(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    if (statusFilter === 'All') return true;
    // Assuming 'In Progress' is the same as 'Approved' for now
    if (statusFilter === 'In Progress') return request.status.toLowerCase() === 'approved';
    if (statusFilter === 'Resolved') return request.status.toLowerCase() === 'completed';
    return request.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleAssignClick = (request) => {
    // We will implement the modal logic for assignment here
    alert(`Assigning request: ${request.description}`);
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="request-tracking-view">
      <h1>Request Tracking</h1>
      <div className="filter-controls">
        <span>Filter by status:</span>
        <button onClick={() => setStatusFilter('All')} className={statusFilter === 'All' ? 'active' : ''}>All</button>
        <button onClick={() => setStatusFilter('Pending')} className={statusFilter === 'Pending' ? 'active' : ''}>Pending</button>
        <button onClick={() => setStatusFilter('In Progress')} className={statusFilter === 'In Progress' ? 'active' : ''}>In Progress</button>
        <button onClick={() => setStatusFilter('Resolved')} className={statusFilter === 'Resolved' ? 'active' : ''}>Resolved</button>
      </div>
      <div className="requests-table-container">
        <table className="requests-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Location</th>
              <th>Status</th>
              <th className="description-header">Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr key={req._id}>
                <td data-label="Name">{req.name || 'Not Provided'}</td>
                <td data-label="Contact">{req.contact || 'Not Provided'}</td>
                <td data-label="Location">{req.location}</td>
                <td data-label="Status"><span className={`status-badge status-${req.status.toLowerCase()}`}>{req.status}</span></td>
                <td data-label="Description" className="description-cell">{req.description}</td>
                <td data-label="Actions" className="actions-cell">
                  {req.status.toLowerCase() === 'pending' && (
                    <button className="btn-assign" onClick={() => handleAssignClick(req)}>
                      Assign
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No requests found for the selected criteria.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestList;
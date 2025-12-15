import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './ContactQueries.css'; // We will create this CSS file

const ContactQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'All',
    queryType: 'All',
  });
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get('/api/contact/queries', config);
        setQueries(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch queries.');
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleStatusChange = async (queryId, newStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.put(
        `/api/contact/queries/${queryId}`,
        { status: newStatus },
        config
      );
      // Update both the main list and the selected query if it's the one being changed
      const updatedQueries = queries.map((q) => (q._id === queryId ? data : q));
      setQueries(updatedQueries);
      if (selectedQuery?._id === queryId) {
        setSelectedQuery(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    setIsReplying(true);
    setError(null);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      };
      const { data } = await axios.post(
        `/api/contact/queries/${selectedQuery._id}/reply`,
        { replyMessage },
        config
      );
      // Update query in the list and close modal
      setQueries(queries.map((q) => (q._id === selectedQuery._id ? data : q)));
      setSelectedQuery(data); // Also update the detailed view
      setShowReplyModal(false);
      setReplyMessage('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setIsReplying(false);
    }
  };

  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      const statusMatch = filters.status === 'All' || query.status === filters.status;
      const typeMatch = filters.queryType === 'All' || query.queryType === filters.queryType;
      return statusMatch && typeMatch;
    });
  }, [queries, filters]);

  const queryTypes = useMemo(() => ['All', ...new Set(queries.map(q => q.queryType))], [queries]);

  // When a query is selected from the list, also reset any lingering error messages
  const handleSelectQuery = (query) => {
    setSelectedQuery(query);
    setError(null);
    setShowReplyModal(false); // Close reply modal if it was open for another query
  };

  if (loading) return <Loader />;

  return (
    <div className="contact-queries-view">
      <div className="view-header">
        <h1>Contact Form Queries</h1>
      </div>
      {error && <Message variant="danger">{error}</Message>}

      <div className="query-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status</label>
          <select id="status-filter" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="type-filter">Filter by Query Type</label>
          <select id="type-filter" name="queryType" value={filters.queryType} onChange={handleFilterChange}>
            {queryTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
      </div>

      <div className="queries-layout">
        <div className="queries-list-container">
          {filteredQueries.length > 0 ? (
            filteredQueries.map((query) => (
              <div
                key={query._id}
                className={`query-item ${selectedQuery?._id === query._id ? 'selected' : ''}`}
                onClick={() => handleSelectQuery(query)}
              >
                <div className="query-item-header">
                  <span className={`status-badge status-${query.status.toLowerCase()}`}>{query.status}</span>
                  <span className="query-item-name">{query.name}</span>
                </div>
                <p className="query-item-subject">{query.subject}</p>
                <span className="query-item-date">{new Date(query.createdAt).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p>No queries match the current filters.</p>
          )}
        </div>

        <div className="query-details-container">
          {selectedQuery ? (
            <div className="query-details">
              <h3>{selectedQuery.subject}</h3>
              <div className="details-grid">
                <p><strong>From:</strong> {selectedQuery.name}</p>
                <p><strong>Email:</strong> <a href={`mailto:${selectedQuery.email}`}>{selectedQuery.email}</a></p>
                <p><strong>Phone:</strong> {selectedQuery.phoneNumber || 'N/A'}</p>
                <p><strong>Received:</strong> {new Date(selectedQuery.createdAt).toLocaleString()}</p>
                <p><strong>Type:</strong> {selectedQuery.queryType}</p>
                <p><strong>Status:</strong> {selectedQuery.status}</p>
              </div>
              <div className="query-message">
                <h4>Message:</h4>
                <p>{selectedQuery.message}</p>
              </div>
              <div className="query-actions">
                <p>Mark as:</p>
                <button
                  className="btn-resolve"
                  onClick={() => handleStatusChange(selectedQuery._id, 'Resolved')}
                  disabled={selectedQuery.status === 'Resolved'}
                >
                  Resolved
                </button>
                <button
                  className="btn-pending"
                  onClick={() => handleStatusChange(selectedQuery._id, 'Pending')}
                  disabled={selectedQuery.status === 'Pending'}
                >
                  Pending
                </button>
                <button onClick={() => setShowReplyModal(true)} className="btn-reply">Reply</button>
              </div>
            </div>
          ) : (
            <div className="no-query-selected">
              <p>Select a query from the list to view details.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedQuery && (
        <div className="reply-modal-overlay">
          <div className="reply-modal">
            <div className="reply-modal-header">
              <h3>Reply to {selectedQuery.name}</h3>
              <button onClick={() => setShowReplyModal(false)} className="close-modal-btn">&times;</button>
            </div>
            <form onSubmit={handleReplySubmit}>
              <p><strong>To:</strong> {selectedQuery.email}</p>
              <p><strong>Subject:</strong> Re: {selectedQuery.subject}</p>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                required
              ></textarea>
              <button type="submit" className="btn-reply" disabled={isReplying}>{isReplying ? 'Sending...' : 'Send Reply'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactQueries;
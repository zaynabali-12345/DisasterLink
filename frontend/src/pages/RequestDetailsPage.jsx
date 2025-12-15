import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import Message from '../components/Message';
import './RequestDetailsPage.css';

const RequestDetailsPage = () => {
  const { id: requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/requests/${requestId}`);
        setRequest(data);
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err.response && err.response.data.message
            ? err.response.data.message
            : err.message;
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId]);

  return (
    <div className="request-details-page">
      <div className="container">
        {loading ? (
          <Loader />
        ) : error ? (
          <Message variant="danger">{error}</Message>
        ) : request ? (
          <>
            <header className="details-header">
              <h1>Request Details</h1>
              <span className={`status-badge ${request.status.toLowerCase()}`}>{request.status}</span>
            </header>
            <div className="details-grid">
              <div className="detail-item">
                <h4>Location</h4>
                <p>{request.location}</p>
              </div>
              <div className="detail-item">
                <h4>Contact Name</h4>
                <p>{request.name}</p>
              </div>
              <div className="detail-item">
                <h4>Contact Number</h4>
                <p>{request.contact}</p>
              </div>
              <div className="detail-item">
                <h4>People Affected</h4>
                <p>{request.people}</p>
              </div>
              <div className="detail-item full-width">
                <h4>Description</h4>
                <p>{request.description}</p>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default RequestDetailsPage;


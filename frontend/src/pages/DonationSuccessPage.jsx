import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './DonationSuccessPage.css';

const DonationSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Thank You for Your Donation!</h1>
        <p>Your generosity is helping us make a real difference. A confirmation receipt will be sent to your email shortly.</p>
        {paymentId && (
          <p className="transaction-id">
            Transaction ID: <strong>{paymentId}</strong>
          </p>
        )}
        <Link to="/" className="btn-home">Go to Homepage</Link>
      </div>
    </div>
  );
};

export default DonationSuccessPage;


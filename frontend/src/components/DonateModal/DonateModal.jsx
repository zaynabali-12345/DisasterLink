import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DonateModal.css';

const DonateModal = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState(500);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Get user info from local storage to pre-fill the form
  useEffect(() => {
    if (isOpen) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        setName(userInfo.name);
        setEmail(userInfo.email);
      }
    }
  }, [isOpen]);

  const handleDonate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      setError('Please enter a valid amount (minimum ₹10).');
      setLoading(false);
      return;
    }

    try {
      // 1. Create an order on your server
      const { data: order } = await axios.post('/api/donate/order', { amount: numericAmount });

      if (!order || !order.id || !order.amount) {
        setError('Failed to create a valid donation order. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Store your key_id in .env
        amount: order.amount,
        currency: 'INR',
        name: 'DisasterLink',
        description: 'Donation for Emergency Relief',
        order_id: order.id,
        handler: async function (response) {
          // This runs on successful payment
          const verificationData = { ...response, amount: order.amount, donorName: name, donorEmail: email, };
          try {
            const { data: result } = await axios.post('/api/donate/verify', verificationData);
            if (result.success) {
              onClose();
              navigate(`/donation-success?payment_id=${result.paymentId}`);
            } else {
              setError('Payment verification failed. Please contact support.');
            }
          } catch (verifyError) {
            setError('An error occurred during payment verification.');
          } finally {
            setLoading(false);
          }
        },
        prefill: { name, email },
        theme: { color: '#e63946' },
        modal: {
          ondismiss: function () {
            // This runs when user closes the modal without paying
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response);
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false); // Reset loading state on failure
      });
      rzp.open();
    } catch (err) {
      console.error('Donation process error:', err.response || err);
      setError(err.response?.data?.message || 'An error occurred while preparing the donation.');
      setLoading(false); // Reset loading state on initial error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Support Our Cause</h2>
        <p>Your contribution helps us respond swiftly to disasters.</p>
        <form onSubmit={handleDonate}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="amount">Donation Amount (INR)</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} min="10" required />
            <div className="preset-amounts">
              <button type="button" onClick={() => setAmount(250)}>₹250</button>
              <button type="button" onClick={() => setAmount(500)}>₹500</button>
              <button type="button" onClick={() => setAmount(1000)}>₹1000</button>
              <button type="button" onClick={() => setAmount(2500)}>₹2500</button>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : `Donate ₹${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DonateModal;

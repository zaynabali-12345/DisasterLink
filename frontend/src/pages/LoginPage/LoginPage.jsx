import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      // If user is already logged in, redirect them to their dashboard
      switch (userInfo.role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Emergency':
          navigate('/dashboard/emergency');
          break;
        case 'NGO':
          navigate('/dashboard/ngo');
          break;
        case 'Volunteer':
          navigate('/dashboard/volunteer');
          break;
        default:
          navigate('/'); // Fallback to home if role is unknown
      }
    }
  }, [navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);

      // Redirect based on user role
      switch (data.role) {
        case 'Admin':
          navigate('/admin/dashboard');
          break;
        case 'Emergency':
          navigate('/dashboard/emergency');
          break;
        case 'NGO':
          navigate('/dashboard/ngo');
          break;
        case 'Volunteer':
          navigate('/dashboard/volunteer');
          break;
        default:
          navigate('/'); // Fallback to home
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An unknown error occurred.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Portal Access</h1>
        <p>Enter your credentials to access your dashboard.</p>
        {error && <div className="login-error-message">{error}</div>}
        <form onSubmit={submitHandler}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

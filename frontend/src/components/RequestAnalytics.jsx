import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import './RequestAnalytics.css'; // We will create this CSS file next
import Loader from './Loader';
import Message from './Message';

// Hardcoded data for the line chart as requested
const lineChartData = [
  { name: 'Jan', requests: 30, status: 20 },
  { name: 'Feb', requests: 40, status: 25 },
  { name: 'Mar', requests: 50, status: 40 },
  { name: 'Apr', requests: 45, status: 35 },
  { name: 'May', requests: 60, status: 55 },
  { name: 'Jun', requests: 70, status: 60 },
];

const RequestAnalytics = () => {
  const [barChartData, setBarChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch7DayStats = async () => {
      try {
        setLoading(true);
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('/api/requests/stats/last7days', config);
        
        // Format date for display (e.g., "Mon", "Tue")
        const formattedData = data.map(item => ({
          ...item,
          day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
        }));

        setBarChartData(formattedData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetch7DayStats();
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}`}</p>
          <p className="intro">{`Requests: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div className="analytics-grid">
      <div className="chart-container">
        <h3>Requests & Status Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="requests" stroke="#8884d8" fillOpacity={1} fill="url(#colorRequests)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3>Last 7 Days Requests</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e879f9" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#c026d3" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <Bar dataKey="requests" fill="url(#colorBar)" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RequestAnalytics;
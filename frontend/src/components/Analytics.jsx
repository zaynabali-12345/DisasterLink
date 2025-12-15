import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';
import Loader from './Loader';
import Message from './Message';
import './Analytics.css';
import ReportsTab from './ReportsTab'; // Import the new component

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to create glowing gradient for line charts
  const createGlowGradient = (ctx, area, color) => {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, `${color}33`); // 20% opacity
    gradient.addColorStop(1, `${color}B3`); // 70% opacity
    return gradient;
  };

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
          setError('Authentication required to view analytics.');
          setLoading(false);
          return;
        }
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

        // Fetch real data from the backend
        const { data: fetchedData } = await axios.get('/api/analytics/all', config);

        // Set the data directly. The render function will handle missing pieces.
        setAnalyticsData(fetchedData);

      } catch (err) {
        const message =
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : 'Failed to load some analytics data.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  // Hardcoded data for the bar chart as requested
  const barChartData = [
    { day: 'Mon', requests: 12 },
    { day: 'Tue', requests: 19 },
    { day: 'Wed', requests: 3 },
    { day: 'Thu', requests: 5 },
    { day: 'Fri', requests: 2 },
    { day: 'Sat', requests: 3 },
    { day: 'Sun', requests: 9 },
  ];
  // --- START: Data and Options for the 3D Line Chart ---
  const trendsChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Requests',
        data: [65, 59, 80, 81, 56, 55, 40, 62, 68, 75, 90, 95],
        borderColor: '#00D2FF',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null;
          return createGlowGradient(ctx, chartArea, '#00D2FF');
        },
        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointBorderColor: 'transparent', pointBackgroundColor: '#00D2FF',
      },
      {
        label: 'Solved',
        data: [45, 40, 60, 65, 42, 48, 30, 50, 55, 60, 75, 80],
        borderColor: '#22C55E',
        backgroundColor: (context) => {
          const {ctx, chartArea} = context.chart;
          if (!chartArea) return null;
          return createGlowGradient(ctx, chartArea, '#22C55E');
        },
        fill: true, tension: 0.4, pointRadius: 0, pointHoverRadius: 6, pointBorderColor: 'transparent', pointBackgroundColor: '#22C55E',
      },
    ],
  };

  // Calculate average solved percentage
  const totalRequests = trendsChartData.datasets[0].data.reduce((a, b) => a + b, 0);
  const totalSolved = trendsChartData.datasets[1].data.reduce((a, b) => a + b, 0);
  const averageSolvedPercentage = totalRequests > 0 ? ((totalSolved / totalRequests) * 100).toFixed(1) : 0;

  const trendsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#aaa', font: { size: 12 } } },
      tooltip: {
        enabled: true, mode: 'index', intersect: false, backgroundColor: 'rgba(10, 10, 20, 0.85)',
        titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 8,
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#aaa' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#aaa' }, beginAtZero: true },
    },
  };
  // --- END: Data and Options for the 3D Line Chart ---

  // --- START: Data and Options for the NEW Bar Chart ---
  const barChartDataConfig = {
    labels: barChartData.map(d => d.day),
    datasets: [{
      label: 'Daily Requests',
      data: barChartData.map(d => d.requests),
      backgroundColor: (context) => {
        const {ctx, chartArea} = context.chart;
        if (!chartArea) return null;
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, '#ff4fa0');   // Pink at the bottom
        gradient.addColorStop(1, '#4deeea');   // Teal at the top
        return gradient;
      },
      borderWidth: 0,
      borderRadius: 8, // For smooth top edges
      barThickness: 25,
    }],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutCubic',
    },
    plugins: {
      legend: { display: false }, // Hide the legend
      tooltip: { enabled: false }, // Hide the tooltip
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#fff', font: { size: 14, weight: '600' } },
        border: { display: false },
      },
      y: {
        display: false, // Hide the Y-axis
        beginAtZero: true,
      },
    },
  };
  // --- END: Data and Options for the NEW Bar Chart ---

  // --- START: Data and Options for NGO Insights Tab ---
  const ngoBarData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Total Resources Requested',
      data: [120, 190, 300, 500, 250, 420],
      backgroundColor: 'rgba(0, 210, 255, 0.6)',
      borderColor: '#00D2FF',
      borderWidth: 1,
      borderRadius: 5,
    }]
  };

  const ngoBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutCubic',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(10, 10, 20, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#aaa' } },
      x: { grid: { display: false }, ticks: { color: '#aaa' } }
    }
  };

  const ngoDonutData = {
    labels: ['Food', 'Medical', 'Shelter', 'Water', 'Clothing'],
    datasets: [{
      label: 'Resource Distribution',
      data: [300, 50, 100, 180, 90],
      backgroundColor: ['#00D2FF', '#22C55E', '#F9A825', '#673AB7', '#E91E63'],
      borderColor: 'var(--bg-primary)',
      borderWidth: 3,
    }]
  };

  const ngoDonutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    animation: { animateRotate: true, duration: 2000 },
    plugins: { legend: { position: 'right', labels: { color: '#aaa' } } }
  };
  // --- END: Data and Options for NGO Insights Tab ---

  // --- START: Data and Options for Volunteer Insights Tab ---
  const volunteerBarData = {
    labels: ['Alex R.', 'Maria S.', 'John D.', 'Chloe M.', 'Sam K.'],
    datasets: [{
      label: 'Tasks Completed',
      data: [45, 38, 32, 25, 18],
      backgroundColor: (context) => {
        const {ctx, chartArea, dataIndex} = context.chart;
        if (!chartArea) return null;
        // Golden glow for the top volunteer
        if (dataIndex === 0) {
          const glowGradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          glowGradient.addColorStop(0, '#FFD700');
          glowGradient.addColorStop(1, '#FFA500');
          return glowGradient;
        }
        // Standard gradient for others
        const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(0, '#673AB7'); // Purple
        gradient.addColorStop(0.5, '#E91E63'); // Pink
        gradient.addColorStop(1, '#00D2FF'); // Blue
        return gradient;
      },
      borderRadius: 6,
    }]
  };

  const volunteerBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // Makes it a horizontal bar chart
    animation: { duration: 1500, easing: 'easeOutCubic' },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true, backgroundColor: 'rgba(10, 10, 20, 0.85)' },
    },
    scales: {
      x: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#aaa' } },
      y: { grid: { display: false }, ticks: { color: '#aaa' } }
    },
    // Placeholder for future interactivity
    onClick: (evt, elements) => {
      if (elements.length > 0) {
        const clickedIndex = elements[0].index;
        const volunteerName = volunteerBarData.labels[clickedIndex];
        console.log(`Clicked on ${volunteerName}. Future enhancement: show detailed stats.`);
        // alert(`Showing details for ${volunteerName}`);
      }
    }
  };

  const volunteerDonutData = {
    labels: ['Completed', 'In Progress', 'Assistance Needed'],
    datasets: [{
      data: [250, 75, 25],
      backgroundColor: ['#22C55E', '#3B82F6', '#F9A825'],
      borderColor: 'var(--bg-primary)',
      borderWidth: 4,
    }]
  };

  const volunteerDonutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '70%',
    animation: { animateRotate: true, duration: 2500 },
    plugins: { legend: { position: 'bottom', labels: { color: '#aaa' } } }
  };
  // --- END: Data and Options for Volunteer Insights Tab ---

  // --- START: Data and Options for ML Predictions Tab ---
  const getMlPredictionsData = () => {
    const defaultData = { 'High': 0, 'Moderate': 0, 'Low': 0 };
    const mlData = analyticsData?.mlPredictions || {};

    // Ensure all categories are present by merging fetched data with defaults
    const mergedData = { ...defaultData, ...mlData };

    return {
      labels: Object.keys(mergedData),
      datasets: [{
        label: 'Predicted Request Priority',
        data: Object.values(mergedData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',  // High - Red
          'rgba(255, 206, 86, 0.6)', // Moderate - Yellow
          'rgba(75, 192, 192, 0.6)',  // Low - Green
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
        borderRadius: 5,
      }]
    };
  };

  const mlChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // The colors are self-explanatory
      title: { display: true, text: 'Predicted Priority of Incoming Requests', color: '#fff', font: { size: 16 } }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#aaa' } }
    }
  };
  // --- END: Data and Options for ML Predictions Tab ---

  const renderContent = () => {
    // Single, robust check at the top
    if (loading) return <Loader />;
    if (error) return <Message variant="danger">{error}</Message>;
    if (!analyticsData) return <Message>No analytics data available.</Message>;

    switch (activeTab) {
      case 'requests':
        return (
          <div className="requests-insights-grid">
            <div className="chart-container">
              <div className="chart-header">
                <h3>Requests & Status Trends</h3>
                <div className="chart-metric">Solved Avg: <span>{averageSolvedPercentage}%</span></div>
              </div>
              <div className="chart-wrapper">
                <Line options={trendsChartOptions} data={trendsChartData} />
              </div>
            </div>
            <div className="chart-container bar-chart-container-special">
              <div className="bar-chart-header-text">
                <p>Requests over the last 7 days, showing recent activity trends.</p>
              </div>
              <div className="chart-wrapper">
                <Bar options={barChartOptions} data={barChartDataConfig} />
              </div>
            </div>
          </div>
        );
      case 'ml':
        // Guard clause for ML Predictions
        if (!analyticsData) return <Message>No ML prediction data available.</Message>;
        return (
          <div className="chart-grid">
            <div className="chart-container">
              <h3>ML Predictions on Request Priority</h3>
              <div className="chart-wrapper" style={{ height: '400px' }}><Bar options={mlChartOptions} data={getMlPredictionsData()} /></div>
            </div>
          </div>
        );
      case 'ngo':
        // Guard clause for NGO Insights
        if (!analyticsData.ngoInsights) return <Message>No NGO insights data available.</Message>;
        return (
          <div className="chart-grid">
            <div className="chart-container">
              <h3>Resource Request Trends</h3>
              <div className="chart-wrapper" style={{ height: '350px' }}>
                <Bar options={ngoBarOptions} data={ngoBarData} />
              </div>
            </div>
            <div className="chart-container">
              <h3>Resource Type Distribution</h3>
              <div className="chart-wrapper" style={{ height: '350px' }}>
                <Pie data={ngoDonutData} options={ngoDonutOptions} />
              </div>
            </div>
          </div>
        );
      case 'volunteer':
        // Guard clause for Volunteer Insights
        if (!analyticsData.volunteerInsights) return <Message>No volunteer insights data available.</Message>;
        return (
          <div className="chart-grid">
            <div className="chart-container">
              <h3>Top Contributors</h3>
              <div className="chart-wrapper" style={{ height: '350px' }}>
                <Bar options={volunteerBarOptions} data={volunteerBarData} />
              </div>
            </div>
            <div className="chart-container donut-container-with-text">
              <h3>Task Status Distribution</h3>
              <div className="chart-wrapper" style={{ height: '350px' }}>
                <Pie data={volunteerDonutData} options={volunteerDonutOptions} />
                <div className="donut-center-text">
                  <p className="donut-center-value">
                    {volunteerDonutData.datasets[0].data.reduce((a, b) => a + b, 0)}
                  </p>
                  <p className="donut-center-label">Total Tasks</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <ReportsTab />
        );
      default:
        return null;
    }
  };

  return (
    <div className="analytics-view">
      <h1>Analytics & Reports</h1>
      <div className="analytics-tabs">
        <button onClick={() => setActiveTab('requests')} className={activeTab === 'requests' ? 'active' : ''}>📈 Requests Insights</button>
        <button onClick={() => setActiveTab('ml')} className={activeTab === 'ml' ? 'active' : ''}>🤖 ML Predictions</button>
        <button onClick={() => setActiveTab('ngo')} className={activeTab === 'ngo' ? 'active' : ''}>🏢 NGO Insights</button>
        <button onClick={() => setActiveTab('volunteer')} className={activeTab === 'volunteer' ? 'active' : ''}>🙋 Volunteer Insights</button>
        <button onClick={() => setActiveTab('reports')} className={activeTab === 'reports' ? 'active' : ''}>📂 Reports</button>
      </div>
      <div className="analytics-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default Analytics;

import React from 'react';

const StatCard = ({ icon, value, label }) => {
  return (
    <div className="ngo-stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-info">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );
};

export default StatCard;
import React from 'react';
import './Loader.css';

/**
 * A futuristic, animated loader component.
 * @param {object} props
 * @param {boolean} [props.loading=true] - Controls the visibility of the loader.
 */
const Loader = ({ loading = true }) => {
  return (
    <div className={`loader-overlay ${!loading ? 'hidden' : ''}`}>
      <div className="loader-container">
        <div className="loader-circle"></div>
        <span className="loader-text">Loading</span>
      </div>
    </div>
  );
};

export default Loader;
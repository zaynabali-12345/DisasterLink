import React from 'react';
import { Link } from 'react-router-dom';
import './GlowButton.css';

const GlowButton = ({ children, onClick, className = '', to, ...props }) => {
  const buttonClassName = `glow-button ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonClassName} {...props}>
        <span>{children}</span>
      </Link>
    );
  } else {
    return (
      <button
        className={buttonClassName}
        onClick={onClick}
        {...props}
      >
        <span>{children}</span>
      </button>
    );
  }
};

export default GlowButton;
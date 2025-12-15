import React from 'react';
import './Message.css';

const Message = ({ variant = 'info', children }) => {
  return <div className={`message ${variant}`}>{children}</div>;
};

export default Message;
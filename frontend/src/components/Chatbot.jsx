import React, { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'regenerator-runtime/runtime'; // Polyfill for the speech recognition library
import './chatbot.css';

// A simple chat icon for the bubble. You can replace this with a more advanced icon or image.
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="32px" height="32px">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
  </svg>
);

// A microphone icon for the voice input button.
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="28px" height="28px">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.7z" />
  </svg>
);

// A send icon for the button.
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="24px" height="24px">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'ai', text: 'Hello! I am the DisasterLink AI Assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Sync transcript with the input field
  useEffect(() => {
    setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    // Automatically scroll to the latest message
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    try {
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error('Failed to get response from server.');

      const data = await res.json();
      const aiMessage = { from: 'ai', text: data.response };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = { from: 'ai', text: 'Sorry, I am having trouble connecting. Please try again later.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicToggle = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      setInput('');
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  return (
    <>
      {!isOpen && (
        <div className="chatbot-bubble" onClick={toggleChat} title="Chat with Assistant">
          <ChatIcon />
        </div>
      )}

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>DisasterLink Assistant</h3>
            <button onClick={toggleChat} className="chatbot-close-btn">&times;</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.from}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="message ai">
                <p className="typing-indicator">...</p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="chatbot-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Listening...' : 'Type your message...'}
              disabled={isLoading}
              autoFocus
            />
            {browserSupportsSpeechRecognition && (
              <button
                type="button"
                onClick={handleMicToggle}
                className={`mic-button ${listening ? 'listening' : ''}`}
                disabled={isLoading}
                title={listening ? 'Stop listening' : 'Start listening'}
              >
                <MicIcon />
              </button>
            )}
            <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Chatbot;

import React from 'react';
import { Link } from 'react-router-dom';
import { Send, Heart, Map } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import './Hero.css';

const Hero = () => {
  const { openModal } = useModal();

  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-line hero-line--top"></div>
        <h1 className="hero-headline">Disaster Link-Human mobility rescue</h1>
        <div className="hero-line hero-line--bottom"></div>
        <div className="hero-buttons">
          <Link to="/request-help" className="btn hero-btn">
            <Send className="mr-2 h-4 w-4" />
            Request Help
          </Link>
          <Link to="/victim-dashboard" className="btn hero-btn">
            <Map className="mr-2 h-4 w-4" />
            Track Rescue
          </Link>
          <button className="btn hero-btn" onClick={openModal}>
            <Heart className="mr-2 h-4 w-4" />
            Donate Now
          </button>
        </div>
      </div>
      <div className="hero-half-circle"></div>
    </section>
  );
};

export default Hero;

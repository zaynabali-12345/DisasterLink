import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Hero from '../components/Hero'; // Assuming Hero component will be updated separately
import {
  TrendingUp,
  Users,
  Send,
  Newspaper,
  BrainCircuit,
  UploadCloud,
  ShieldCheck,
  Globe, // Using Globe as a placeholder for the central icon
  MessageSquareQuote,
  PhoneOff, // Icon for the end call button
} from 'lucide-react';
import './HomePage.css';

const HomePage = () => {
  // Hook for programmatic navigation
  const navigate = useNavigate();

  // --- MODIFIED: State and Ref for the call simulation modal ---
  const [isCalling, setIsCalling] = useState(false);
  const audioRef = useRef(null);
  const callNumber = '+91 99999 12345';


  // Data for sections
  const features = [
    {
      icon: <TrendingUp />,
      title: 'Disaster Prediction',
      description:
        'Real-time earthquake and cyclone risk analysis using machine learning models.',
    },
    {
      icon: <Users />,
      title: 'Human Mobility Tracking',
      description:
        'Visualize population movement patterns during emergencies to prioritize rescue zones.',
    },
    {
      icon: <Send />,
      title: 'Request Help Portal',
      description:
        'Victims can send SOS requests with location and status in just a few clicks.',
    },
    {
      icon: <Newspaper />,
      title: 'AI-Powered News Analyzer',
      description:
        'NLP module monitors breaking news and social media to detect disaster events early.',
    },
    {
      icon: <BrainCircuit />,
      title: 'GenAI Insights',
      description:
        'Receive strategic suggestions for evacuation, rescue deployment, and resource planning.',
    },
    {
      icon: <UploadCloud />,
      title: 'Upload Your Data',
      description:
        'Admins can upload CSV datasets for custom disaster trend analysis.',
    },
  ];

  const stats = [
    // Updated stats for the new design
    { number: '+214', label: 'Global Partnerships' },
    { number: '+5M', label: 'Lives Impacted Annually' },
    { number: '+20M', label: 'Data Points Processed Daily' },
    { number: '95%', label: 'Prediction Accuracy' },
    { number: '12K+', label: 'SOS Requests Handled' },
    { number: '45 min', label: 'Avg. Response Time Reduction' },
  ];

  const whyData = [
    {
      text: "We ensure faster response during disasters.",
    },
    {
      text: "We provide AI-powered insights for better decision making.",
    },
    {
      text: "We enable seamless coordination across organizations.",
    },
    {
      text: "We centralize communication for efficient team deployment.",
    },
    {
      text: "We build resilient communities through data-driven planning.",
    }
  ];

  const scrollerData = [
    { title: 'Real-Time Alerts', text: 'Instant notifications on seismic activity.' },
    { title: 'AI Prediction', text: 'ML models forecast potential disaster zones.' },
    { title: 'Mobility Tracking', text: 'Analyze population movement for safe evacuations.' },
    { title: 'Resource AI', text: 'Optimize deployment of rescue teams & supplies.' },
    { title: 'News Analysis', text: 'NLP engine scans news for early event detection.' },
    { title: 'Secure Portals', text: 'Role-based access for responders and admins.' },
  ];

  // Split the data for two rows
  const scrollerDataTop = scrollerData.slice(0, 3);
  const scrollerDataBottom = scrollerData.slice(3, 6);


  // Effect for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  // Effect for glowing card mouse-follow
  useEffect(() => {
    const handleMouseMove = (e) => {
      const cards = document.querySelectorAll('.glowing-card');
      for (const card of cards) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // --- MODIFIED: Functions to handle call simulation and sound ---
  const startCall = () => {
    setIsCalling(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to start
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };

  const endCall = () => {
    setIsCalling(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Cleanup effect to stop the sound if the component unmounts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => endCall(), []);

  return (
    <>
      <Hero />
      <main>
        {/* Features Section */}
        <section id="features" className="section">
          <div className="container reveal-on-scroll">
            <div className="features-section" style={{ display: 'flex', alignItems: 'center', gap: '6rem', flexWrap: 'wrap' }}>
              <div className="features-globe-container">
                <div className="features-globe">
                  {/* Inner elements for globe details if needed */}
                </div>
                {/* Particle orbits - now with multiple streaks */}
                <div className="particle-orbit">
                  <div className="particle-streak"></div>
                  <div className="particle-streak"></div>
                </div>
                <div className="particle-orbit">
                  <div className="particle-streak"></div>
                </div>
                <div className="particle-orbit">
                  <div className="particle-streak"></div>
                </div>
              </div>
              <div className="features-content">
                <h2>The Future of Disaster Response is Here</h2>
                <p className="section-subtitle">
                  DisasterLink integrates cutting-edge AI with real-time data to create a unified command center for disaster management. Proactively save lives, optimize resource allocation, and build resilient communities.
                </p>
                <button className="btn" onClick={() => navigate('/admin/login')}>Explore Dashboard</button> {/* Added button for clarity */}
              </div>
            </div>
          </div>
        </section>

        {/* Core Platform / Updates Section */}
        <section id="platform" className="section">
          <div className="container">
            <h2 className="reveal-on-scroll" style={{ textAlign: 'center' }}>Our Core Platform</h2>
            <p className="section-subtitle reveal-on-scroll" style={{ textAlign: 'center' }}>
              A suite of powerful tools designed for precision and speed when it matters most.
            </p> {/* Removed redundant style prop */}
            <div className="updates-grid">
              {features.map((feature, index) => (
                <div key={index} className="glowing-card reveal-on-scroll" style={{ transitionDelay: `${index * 100}ms` }}>
                  {React.cloneElement(feature.icon, { size: 32, className: "mb-4 text-blue-400" })}
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats" className="stats-section reveal-on-scroll">
          <div className="stats-content-wrapper">
            {/* Left Section */}
            <div className="stats-left-text">
              <h2 className="stats-title">A New Era of Coordinated Rescue</h2>
              <p className="stats-subtitle">Harnessing the power of AI and real-time data.</p>
              <p className="stats-description">
                DisasterLink provides a unified platform for emergency responders, enabling faster, smarter, and more effective life-saving operations.
              </p>
            </div>

            {/* Center Icon */}
            <div className="stats-center-icon">
              <Globe size={80} />
            </div>

            {/* Right Section - 2x2 Grid */}
            <div className="stats-right-grid">
              {stats.slice(0, 4).map((stat, index) => ( // Display only the first 4 stats for this layout
                <div key={index} className="stat-card-new">
                  <div className="number">{stat.number}</div>
                  <div className="caption">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Auto-Scroller Section */}
        {/* The scroller has its own fade-in/out via the mask, so reveal-on-scroll isn't needed here */}
        <section className="scroller-section">
          <div className="container">
            <h2 style={{ textAlign: 'center' }}>Core Capabilities</h2>
            <p className="section-subtitle" style={{ textAlign: 'center' }}>
              An overview of the key technologies powering the DisasterLink platform.
            </p>
          </div>
          {/* First Row */}
          <div className="scroller" style={{'--_card-count': scrollerDataTop.length}}>
            <div className="scroller__track">
              {/* Duplicate the data for a seamless loop */}
              {[...scrollerDataTop, ...scrollerDataTop].map((item, index) => (
                <div className="scroller__card" key={index}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Second Row (Reversed) */}
          <div className="scroller scroller--reverse" style={{'--_card-count': scrollerDataBottom.length}}>
            <div className="scroller__track">
              {/* Duplicate the data for a seamless loop */}
              {[...scrollerDataBottom, ...scrollerDataBottom].map((item, index) => (
                <div className="scroller__card" key={index}>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why DisasterLink Section - Cylinder Carousel */}
        <section id="why-disasterlink" className="cylinder-section section">
          <div className="container">
            <h2 className="section-title reveal-on-scroll" style={{ textShadow: '0 0 10px var(--glow-blue), 0 0 20px var(--glow-purple), 0 0 30px rgba(255, 255, 255, 0.2)' }}>
              Why DisasterLink
            </h2>
            <div className="cylinder-container reveal-on-scroll">
              <div className="cylinder">
                {whyData.map((reason, index) => (
                  <div className="cylinder-panel" key={index} style={{ '--i': index }}>
                    <p>{reason.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Particle Contact Section */}
        <section id="contact" className="particle-contact-section section">
          <div className="container">
            <div className="particle-hologram">
              {/* Generate 100 particles for a dense, beautiful effect */}
              {Array.from({ length: 100 }).map((_, i) => (
                <div className="particle" key={i} style={{ '--i': i }}></div>
              ))}
            </div>
            <div className="particle-contact-content reveal-on-scroll">
              <h2>Contact Us Today</h2>
              {/* --- MODIFIED: Changed from a link to a button to trigger the modal --- */}
              <button onClick={startCall} className="contact-random-number">
                {callNumber}
              </button>
              <Link to="/contact" className="btn contact-glow-btn">
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* --- NEW: Call Simulation Modal --- */}
      {isCalling && (
        <div className="call-modal-overlay">
          <div className="call-modal">
            <div className="caller-info">
              <div className="caller-avatar">DL</div>
              <div className="caller-name">DisasterLink HQ</div>
            </div>
            <div className="call-status">
              Calling<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span>
            </div>
            <div className="call-number">{callNumber}</div>
            <button onClick={endCall} className="end-call-btn">
              <PhoneOff size={28} />
            </button>
          </div>
        </div>
      )}

      {/* --- MODIFIED: Audio element is now always in the DOM but hidden --- */}
      <audio
        ref={audioRef}
        src="/Ringtone.mp3"
        loop
        style={{ display: 'none' }}
      />
    </>
  );
};

export default HomePage;

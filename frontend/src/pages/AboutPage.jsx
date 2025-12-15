import React, { useEffect } from 'react';
import { Server, Database, Globe, Cloud, MessageSquare, Code } from 'lucide-react';
// --- NEW: Import local team member images ---
import zaynabImg from '../assets/zaynab.jpg';
import misbhaImg from '../assets/misbha3.jpg';
import prernaImg from '../assets/prerna.jpg';
import './AboutPage.css';

const AboutPage = () => {
  const technologies = [
    { icon: <Server size={40} />, name: 'Node.js & Express.js', description: 'Fast and scalable backend' },
    { icon: <Code size={40} />, name: 'React.js', description: 'Interactive and responsive UI' },
    { icon: <Database size={40} />, name: 'MongoDB', description: 'Secure and reliable database' },
    { icon: <MessageSquare size={40} />, name: 'WebSockets', description: 'Real-time updates and alerts' },
    { icon: <Globe size={40} />, name: 'Geo-Location Mapping', description: 'Visual disaster tracking' },
    { icon: <Cloud size={40} />, name: 'Cloud Storage', description: 'Safe and quick data access' },
  ];

  const teamMembers = [
    {
      name: 'Zaynab Ali',
      role: 'UI/UX Designer',
      description: 'Crafting intuitive and beautiful user experiences that guide users in critical moments.',
      imgSrc: zaynabImg,
    },
    {
      name: 'Misbha Khanpagadi',
      role: 'Backend Developer',
      description: 'Building the robust and scalable architecture that powers our real-time data processing.',
      imgSrc: misbhaImg,
    },
    {
      name: 'Prerna Suthar',
      role: 'Frontend Developer',
      description: 'Bringing the platform to life with responsive and interactive interfaces for all devices.',
      imgSrc: prernaImg,
    },
  ];

  // Scroll-reveal animation effect
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

  return (
    <div className="about-page">
      {/* About Us Section */}
      <section className="about-section about-hero-section reveal-on-scroll">
        <div className="container">
          <h1 className="about-title">About DisasterLink</h1>
          <p className="about-description">
            DisasterLink is a next-generation platform designed to connect communities, responders, and resources during disasters and emergencies. Our mission is to make disaster management faster, smarter, and more collaborative by leveraging cutting-edge technologies.
          </p>
          <p className="about-description">
            We use AI, real-time data analytics, geolocation mapping, and cloud infrastructure to ensure that critical information reaches the right people at the right time. Whether it’s natural calamities, medical emergencies, or crisis alerts, DisasterLink empowers individuals and organizations to act with confidence.
          </p>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="about-section tech-section">
        <div className="container">
          <h2 className="section-heading reveal-on-scroll">Technologies We Use</h2>
          <div className="tech-grid">
            {technologies.map((tech, index) => (
              <div key={index} className="tech-item reveal-on-scroll" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="tech-icon">{tech.icon}</div>
                <h3 className="tech-name">{tech.name}</h3>
                <p className="tech-description">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="about-section team-section">
        <div className="container">
          <h2 className="section-heading reveal-on-scroll">Our Team</h2>
          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="team-card reveal-on-scroll" style={{ transitionDelay: `${index * 150}ms` }}>
                <div className="team-card-image-container">
                  <img src={member.imgSrc} alt={member.name} />
                </div>
                <div className="team-card-content">
                  <h3 className="team-member-name">{member.name}</h3>
                  <p className="team-member-role">{member.role}</p>
                  <p className="team-member-description">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;

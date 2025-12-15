import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import './Footer.css';

const Footer = () => {
  const { openModal } = useModal();

  const socialLinks = [
    { icon: <Facebook />, href: 'https://www.facebook.com/share/1CK16qNTbA/' },
    { icon: <Twitter />, href: '#!' },
    { icon: <Linkedin />, href: '#!' },
    { icon: <Instagram />, href: 'https://www.instagram.com/disasterlink2025/' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-container">
          {/* Section 1 - About */}
          <div className="footer-column footer-brand-info">
            <h3 className="footer-brand">DisasterLink</h3>
            <p className="footer-mission">
              An AI-powered disaster prediction and management platform designed to provide real-time insights, support communities, and save lives.
            </p>
          </div>

          {/* Section 2 - Quick Links */}
          <div className="footer-column">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link">Home</Link></li>
              <li><Link to="/about" className="footer-link">About Us</Link></li>
              <li><Link to="/predictions" className="footer-link">Predictions</Link></li>
              <li><Link to="/news" className="footer-link">News & Insights</Link></li>
              <li><Link to="/request-help" className="footer-link">Request Help</Link></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          {/* Section 3 - Resources */}
          <div className="footer-column">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><Link to="/faq" className="footer-link">FAQs</Link></li>
              <li><a href="#!" className="footer-link" onClick={(e) => { e.preventDefault(); openModal(); }}>Support Us / Donate</a></li>
              <li><Link to="/volunteer" className="footer-link">Volunteer With Us</Link></li>
              <li><Link to="/safety" className="footer-link">Safety Guidelines</Link></li>
              <li><Link to="/emergency-contacts" className="footer-link">Emergency Contacts</Link></li>
            </ul>
          </div>

          {/* Section 4 - Social Media */}
          <div className="footer-column">
            <h4 className="footer-heading">Follow Us</h4>
            <div className="footer-socials">
              {socialLinks.map((social, index) => (
                <a href={social.href} key={index} className="social-icon-link" target="_blank" rel="noopener noreferrer">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} DisasterLink. All Rights Reserved.</p>
          <div className="footer-legal-links">
            <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

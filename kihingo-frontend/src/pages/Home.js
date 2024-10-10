import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';
import '../styles/Home.css';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const indexRef = useRef(0);

  const navItems = [
    { name: 'Home', icon: FaHome, path: '/' },
    { name: 'Live Stream', icon: FaVideo, path: '/livestream' },
    { name: 'Feed', icon: FaNewspaper, path: '/feed' },
    { name: 'Events', icon: FaCalendar, path: '/events' },
    { name: 'Book an Appointment', icon: FaBookOpen, path: '/appointments' },
    { name: 'Make a Donation', icon: FaDonate, path: '/donations' },
    { name: 'Testimonials', icon: FaComments, path: '/testimonials' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const text = "Welcome to ACK St. Philip's KIHINGO Church";
    const textLength = 43;

    const intervalId = setInterval(() => {
      if (indexRef.current < textLength) {
        setDisplayText(prev => text.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  const DropdownButton = ({ item }) => {
    const requiresAuth = ['/feed', '/appointments'].includes(item.path);

    if (requiresAuth && !user) {
      return (
        <Link to="/login" state={{ from: item.path }} className="dropdown-button">
          <item.icon className="icon" />
          {item.name}
        </Link>
      );
    }
    return (
      <Link to={item.path} className="dropdown-button">
        <item.icon className="icon" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="home-container">
      <div className="header">
        <div className="greeting">
          Hello, {user ? user.name : 'Guest'}
        </div>
        <div className="user-menu">
          {user ? (
            <div className="dropdown">
              <button onClick={toggleMenu} className="user-button">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}
              </button>
              {isMenuOpen && (
                <div className="dropdown-menu">
                  {navItems.map((item) => (
                    <DropdownButton key={item.name} item={item} />
                  ))}
                  <button onClick={handleLogout} className="dropdown-button">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">Login</Link>
              <Link to="/register" className="signup-button">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="nav-bar">
        <ul>
          {navItems.map(item => (
            <li key={item.name}>
              <Link to={item.path} className="nav-link">
                <item.icon className="nav-icon" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="main-content">
        <section className="hero-section">
          <h1 className="animated-heading">{displayText}</h1>
          <p className="subtitle">Join us in worship and community</p>
          <div className="cta-buttons">
            <Link to="/about" className="cta-button primary">Join Us Today</Link>
            <Link to="/donations" className="cta-button secondary">Make a Donation</Link>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <h2>Our Church</h2>
            <img src="/path/to/church-image.jpg" alt="Our Church" />
            <Link to="/about" className="learn-more">Learn More</Link>
          </div>
          <div className="info-card">
            <h2>Testimonials</h2>
            <p>Read inspiring stories from our community members.</p>
            <Link to="/testimonials" className="learn-more">View All Testimonials</Link>
          </div>
          <div className="info-card">
            <h2>Upcoming Events</h2>
            <p>Stay updated with our latest events and activities.</p>
            <Link to="/events" className="learn-more">View All Events</Link>
          </div>
        </section>

        <section className="join-story-section">
          <div className="our-youth-card">
            <h2>OUR YOUTH</h2>
            <p>Our youth are the heart of our community! They inspire us with their energy, creativity, and dedication. Join us in supporting their initiatives and celebrating their achievements.</p>
            <Link to="/youth" className="learn-more">Get Involved</Link>
          </div>
          <div className="our-story-card">
            <h2>Our Story</h2>
            <p>Learn about how our church was born and the values that guide us every day.</p>
            <Link to="/story" className="learn-more">Read Our Full Story</Link>
          </div>
        </section>

        <section className="donation-section">
          <h2>Make a Donation</h2>
          <p>Support our ongoing projects and help us make a difference in our community.</p>
          <div className="donation-projects">
            <div className="donation-card">
              <h3>Project 1</h3>
              <p>Description of Project 1</p>
              <button className="donate-button">Donate</button>
            </div>
            <div className="donation-card">
              <h3>Project 2</h3>
              <p>Description of Project 2</p>
              <button className="donate-button">Donate</button>
            </div>
            <div className="donation-card">
              <h3>Project 3</h3>
              <p>Description of Project 3</p>
              <button className="donate-button">Donate</button>
            </div>
          </div>
        </section>

        <section className="live-broadcast-section">
          <h2>Live Broadcasts</h2>
          <div className="broadcast-grid">
            <div className="broadcast-card">
              <h3>Sunday Service</h3>
              <p>Every Sunday at 10:00 AM</p>
              <Link to="/livestream" className="watch-live">Watch Live</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;

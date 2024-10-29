import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ref to check if click is inside the dropdown
  const dropdownRef = useRef(null);

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

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsMenuOpen(false);
    }
  };

  // Add event listener to detect clicks outside dropdown
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    <header className="header">
      <Link to="/" className="logo-link">
        <img src="/ACKlogo.jpg" alt="Church Logo" className="church-logo" />
      </Link>
      <div className="right-section">
        {user && (
          <div className="user-greeting">
            Hello, {user.name.split(' ')[0]}
          </div>
        )}
        <div className="user-menu">
          {user ? (
            <div className="dropdown" ref={dropdownRef}>
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
    </header>
  );
};

export default Header;

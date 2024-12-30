// kihingo-frontend/styles/Header.css;
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 80px; /* Fixed height for consistency */
}

.right-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
}

.main-content {
  padding-top: 140px; /* Add padding to account for fixed nav bar */
}

.home-container {
  padding-top: 80px; /* Should match header height */
}
  
.logo-link {
  flex: 0 0 auto; /* Don't grow or shrink */
}
  
  .church-logo {
    height: 50px;
    width: auto;
  }

  .user-greeting {
    position: absolute; /* Position greeting relative to the header */
    left: 50%; /* Horizontally center based on the header */
    transform: translateX(-50%); /* Correct centering by shifting half of its width */
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(45deg, #ff6b6b, #feca57, #1dd1a1, #5f27cd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }



  .nav-bar {
    position: fixed;
    top: 80px; /* Position right below header */
    left: 0;
    right: 0;
    background-color: #fff;
    padding: 0.5rem 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 999;
  }

  
  @keyframes colorShift {
    0% {
      filter: saturate(100%);
    }
    50% {
      filter: saturate(150%);
    }
    100% {
      filter: saturate(100%);
    }
  }
  
  .user-menu {
    position: relative;
    margin-left: auto;
  }
  
  .user-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%; /* Start right below the button */
    right: 0; /* Align to the right edge of the user button */
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1002;
    min-width: 200px;
  }
  
  .dropdown-button {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: #333;
  }
  
  .dropdown-button:hover {
    background-color: #f8f9fa;
  }
  
  .auth-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .login-button,
  .signup-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    text-decoration: none;
  }
  
  .login-button {
    background-color: #007bff;
    color: white;
  }
  
  .signup-button {
    background-color: #28a745;
    color: white;
  }


  /* Ensure the header layout works on smaller screens */
  @media screen and (max-width: 768px) {
    .header {
      padding: 1rem;
    }
    
    .right-section {
      gap: 1rem;
    }
  
    .user-greeting {
      font-size: 1.2rem;
    }
  }


  // kihingo-frontend/src/components/Header.js;
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


// kihingo-frontend/tailwind.config.js;
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('autoprefixer'),
  ],
}

// kihingo-frontend/postcss.config.js;
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

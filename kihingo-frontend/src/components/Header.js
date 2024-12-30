import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
        <Link to="/login" state={{ from: item.path }} className="flex items-center p-4 text-gray-700 hover:bg-gray-100">
          <item.icon className="mr-2" />
          {item.name}
        </Link>
      );
    }
    return (
      <Link to={item.path} className="flex items-center p-4 text-gray-700 hover:bg-gray-100">
        <item.icon className="mr-2" />
        {item.name}
      </Link>
    );
  };

  return (
    <header className="flex justify-between items-center p-4 bg-gray-100 shadow-md fixed top-0 left-0 right-0 z-10 h-20">
      <Link to="/" className="flex-none">
        <img src="/ACKlogo.jpg" alt="Church Logo" className="h-12 w-auto" />
      </Link>
      <div className="flex items-center gap-8">
        {user && (
          <div className="text-center font-bold text-transparent bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 bg-clip-text">
            Hello, {user.name.split(' ')[0]}
          </div>
        )}
        <div className="relative">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={toggleMenu} className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'UN'}
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 bg-white border border-gray-300 rounded-lg shadow-lg min-w-[200px] z-20 mt-2">
                  {navItems.map((item) => (
                    <DropdownButton key={item.name} item={item} />
                  ))}
                  <button onClick={handleLogout} className="flex items-center p-4 text-gray-700 hover:bg-gray-100">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="bg-blue-500 text-white p-2 rounded">Login</Link>
              <Link to="/register" className="bg-green-500 text-white p-2 rounded">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
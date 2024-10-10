// src/components/Header.js;
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">ACK St Philips KIHINGO</Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
            {user ? (
              <>
                <li><Link to="/feed" className="hover:text-gray-300">Feed</Link></li>
                <li><Link to="/testimonials" className="hover:text-gray-300">Testimonials</Link></li>
                <li><Link to="/appointments" className="hover:text-gray-300">Appointments</Link></li>
                <li><Link to="/donations" className="hover:text-gray-300">Donations</Link></li>
                <li><Link to="/events" className="hover:text-gray-300">Events</Link></li>
                <li><Link to="/livestream" className="hover:text-gray-300">Livestream</Link></li>
                <li><button onClick={logout} className="hover:text-gray-300">Logout</button></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:text-gray-300">Login</Link></li>
                <li><Link to="/register" className="hover:text-gray-300">Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
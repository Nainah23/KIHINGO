import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-8">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-between">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">ACK St Philips KIHINGO</h3>
            <p>Serving our community with faith and love.</p>
          </div>
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">Quick Links</h3>
            <ul>
              <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
              <li><Link to="/events" className="hover:text-gray-300">Events</Link></li>
              <li><Link to="/donations" className="hover:text-gray-300">Donate</Link></li>
              <li><Link to="/livestream" className="hover:text-gray-300">Livestream</Link></li>
            </ul>
          </div>
          <div className="w-full md:w-1/3">
            <h3 className="text-xl font-bold mb-2">Contact Us</h3>
            <p>123 Church Street, Nairobi, Kenya</p>
            <p>Phone: +254 123 456 789</p>
            <p>Email: info@ackstphilipskihingo.com</p>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p>&copy; {new Date().getFullYear()} ACK St Philips KIHINGO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaChevronLeft, FaChevronRight, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [displaySubtitle, setDisplaySubtitle] = useState('');
  const headingIndexRef = useRef(0);
  const subtitleIndexRef = useRef(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [randomVerse, setRandomVerse] = useState('');
  const scrollCount = useRef(0);
  const verseRef = useRef(null);
  const progressBarRef = useRef(null);

  const slides = [
    { title: "Our Church Groups", description: "Discover the diverse communities within our church", image: "/CHURCH.jpg" },
    { title: "Youth Group", description: "Empowering the next generation of faithful leaders", image: "/YOUTH.jpg" },
    { title: "ACK KAMA", description: "Kenya Anglican Men Association - Building strong Christian men", image: "/KAMA.jpg" },
    { title: "Sunday School", description: "Nurturing faith in our youngest members", image: "/KIDS.jpg" },
    { title: "Mother's Union", description: "Uniting women in prayer, worship, and service", image: "/mothers-union.jpg" },
  ];

  const navItems = [
    { name: 'Home', icon: FaHome, path: '/' },
    { name: 'Live Stream', icon: FaVideo, path: '/livestream' },
    { name: 'Feed', icon: FaNewspaper, path: '/feed' },
    { name: 'Events', icon: FaCalendar, path: '/events' },
    { 
      name: user?.role === 'reverend' ? 'Appointments' : 'Book an Appointment', 
      icon: FaBookOpen, 
      path: '/appointments' 
    },
    { name: 'Make a Donation', icon: FaDonate, path: '/donations' },
    { name: 'Testimonials', icon: FaComments, path: '/testimonials' },
  ];

  // ... (keep all the existing functions like nextSlide, prevSlide, fetchRandomBibleVerse, etc.)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* Keep the existing Navigation, Progress Bar, Bible Verse Scroll, and Hero Section code */}
      
      {/* Info Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* Feed Card */}
        <div className="relative rounded-lg overflow-hidden shadow-lg group hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
          <img src="/Events3.jpg" alt="Church Community" className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-black/60 group-hover:bg-black/50 transition-colors duration-300"></div>
          <div className="relative z-10 p-6 text-white">
            <h2 className="text-2xl font-bold mb-4 group-hover:text-yellow-300 transition-colors duration-300">Church Feed</h2>
            <p className="mb-6">Stay connected with our vibrant church community! Join conversations, share your faith journey, and get inspired by fellow believers' stories.</p>
            <Link 
              to="/feed" 
              className="inline-block px-6 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-transparent hover:border-2 hover:border-white transition-all duration-300"
            >
              Join the Conversation
            </Link>
          </div>
        </div>

        {/* Testimonials Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">Testimonials</h2>
          <p className="text-gray-600 mb-6">Explore powerful testimonies from fellow worshippers about how God is working in their lives!</p>
          <Link to="/testimonials" className="text-blue-500 font-bold hover:text-blue-700 transition-colors duration-300">
            View All Testimonials
          </Link>
        </div>

        {/* Events Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">Upcoming Events</h2>
          <p className="text-gray-600 mb-6">Stay updated with our latest events and activities.</p>
          <Link to="/events" className="text-blue-500 font-bold hover:text-blue-700 transition-colors duration-300">
            View All Events
          </Link>
        </div>
      </section>

      {/* Church Groups Section */}
      <section className="flex flex-col md:flex-row gap-8 mb-16">
        <div className="flex-1">
          <div className="relative h-96 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
            <button 
              onClick={prevSlide} 
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 p-2 rounded-full transition-colors duration-300"
            >
              <FaChevronLeft className="w-6 h-6" />
            </button>
            <div 
              className="h-full w-full bg-cover bg-center relative transition-transform duration-500 hover:scale-105"
              style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
            >
              <div className="absolute inset-0 bg-black/50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white p-6 bg-black/50 rounded-lg backdrop-blur-sm">
                  <h3 className="text-3xl font-bold mb-2">{slides[currentSlide].title}</h3>
                  <p className="text-lg">{slides[currentSlide].description}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={nextSlide} 
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/50 hover:bg-white/80 p-2 rounded-full transition-colors duration-300"
            >
              <FaChevronRight className="w-6 h-6" />
            </button>
          </div>
          <Link to="/church_groups" className="inline-block mt-4 text-blue-500 font-bold hover:text-blue-700 transition-colors duration-300">
            Learn More About Our Groups
          </Link>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
          <div className="relative h-full">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-300"
              style={{ backgroundImage: "url('kihi.jpg')" }}
            ></div>
            <div className="relative z-10 p-8 h-full backdrop-blur-sm">
              <div className="bg-white/80 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <h2 className="text-3xl font-bold mb-4 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">Report Background</h2>
                <p className="text-gray-600 mb-6 group-hover:text-gray-800 transition-colors duration-300">Receive Christian greetings and New Year 2024 goodwill tidings. It is with great joy that we are compiling the report of the previous year 2023...</p>
                <Link to="/report" className="text-blue-500 font-bold hover:text-blue-700 transition-colors duration-300">
                  Read Full Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keep the existing Donation Section and Live Broadcast Section code */}

      {/* Mobile Menu Modal */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-gray-800 bg-opacity-75 z-50">
          <div className="bg-white p-4 max-w-sm mx-auto mt-20 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Menu</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              {navItems.map(item => (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5 text-orange-700" />
                  <span className="text-gray-700">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
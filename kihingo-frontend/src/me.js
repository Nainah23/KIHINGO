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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const fetchRandomBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      if (!isScrolling) {
        setRandomVerse(data.verse);
        scrollCount.current = 0;
        startScrollAnimation();
      }
    } catch (error) {
      console.error('Error fetching Bible verse:', error);
    }
  }, [isScrolling]);

  const startScrollAnimation = () => {
    setIsScrolling(true);
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scroll 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      startScrollAnimation();
    } else {
      setIsScrolling(false);
      fetchRandomBibleVerse();
    }
  };

  useEffect(() => {
    fetchRandomBibleVerse();
    const heading = "Welcome to ACK St. Philip's KIHINGO Church";
    const subtitle = "Join us in worship and community";
    const headingLength = heading.length;
    const subtitleLength = subtitle.length;
  
    const headingIntervalId = setInterval(() => {
      if (headingIndexRef.current < headingLength) {
        setDisplayText(prev => heading.slice(0, headingIndexRef.current + 1));
        headingIndexRef.current += 1;
      } else {
        clearInterval(headingIntervalId);
      }
    }, 100);
  
    const headingAnimationDuration = headingLength * 100;
  
    const subtitleTimeoutId = setTimeout(() => {
      const subtitleIntervalId = setInterval(() => {
        if (subtitleIndexRef.current < subtitleLength) {
          setDisplaySubtitle(prev => subtitle.slice(0, subtitleIndexRef.current + 1));
          subtitleIndexRef.current += 1;
        } else {
          clearInterval(subtitleIntervalId);
        }
      }, 100);
    }, headingAnimationDuration);
  
    return () => {
      clearInterval(headingIntervalId);
      clearTimeout(subtitleTimeoutId);
    };
  }, [fetchRandomBibleVerse]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex justify-around items-center h-16">
            {navItems.map(item => (
              <li key={item.name}>
                <Link 
                  to={item.path} 
                  className="flex items-center gap-2 px-4 py-2 text-orange-700 hover:text-emerald-600 transition-colors duration-300 font-medium"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {/* Bible Verse Scroll */}
        <div className="relative h-12 mb-8 overflow-hidden">
          <p 
            ref={verseRef}
            className="absolute whitespace-nowrap text-orange-600 font-bold animate-scroll"
            onAnimationEnd={handleScrollEnd}
          >
            {randomVerse}
          </p>
        </div>

        {/* Hero Section */}
        <section className="relative max-w-6xl mx-auto mb-16">
          <div className="relative h-[60vh] rounded-lg overflow-hidden bg-[url('/public/kihi.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-400 via-teal-400 to-blue-400 text-transparent bg-clip-text font-georgia">
                {displayText}
              </h1>
              <p className="text-2xl mb-8 bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-500 text-transparent bg-clip-text font-bold">
                {displaySubtitle}
              </p>
              <div className="flex gap-4">
                <Link 
                  to="/about" 
                  className="px-6 py-3 rounded-full bg-blue-500 text-white font-bold hover:-translate-y-0.5 transition-transform duration-300 hover:shadow-lg"
                >
                  Join Us Today
                </Link>
                <Link 
                  to="/donations" 
                  className="px-6 py-3 rounded-full bg-yellow-400 text-gray-800 font-bold hover:-translate-y-0.5 transition-transform duration-300 hover:shadow-lg"
                >
                  Make a Donation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Info Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Feed Card */}
          <div className="relative rounded-lg overflow-hidden shadow-lg group hover:-translate-y-1 transition-transform duration-300">
            <img src="/Events3.jpg" alt="Church Community" className="w-full h-full object-cover absolute inset-0" />
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 p-6 text-white">
              <h2 className="text-2xl font-bold mb-4">Church Feed</h2>
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
          <div className="bg-white rounded-lg shadow-lg p-6 hover:-translate-y-1 transition-transform duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Testimonials</h2>
            <p className="text-gray-600 mb-4">Explore powerful testimonies from fellow worshippers about how God is working in their lives!</p>
            <Link 
              to="/testimonials" 
              className="text-orange-600 hover:underline font-medium"
            >
              Read Our Stories
            </Link>
          </div>

          {/* Services Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:-translate-y-1 transition-transform duration-300">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Services</h2>
            <p className="text-gray-600 mb-4">Join us for weekly services, uplifting worship, and impactful teachings. All are welcome!</p>
            <Link 
              to="/services" 
              className="text-orange-600 hover:underline font-medium"
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Slide Show */}
        <section className="relative">
          <div className="relative w-full h-96 overflow-hidden">
            <div className="absolute inset-0 flex justify-between items-center z-10">
              <button onClick={prevSlide} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                <FaChevronLeft size={30} />
              </button>
              <button onClick={nextSlide} className="bg-gray-700 text-white p-2 rounded-full hover:bg-gray-800">
                <FaChevronRight size={30} />
              </button>
            </div>
            <div className="relative w-full h-full bg-cover bg-center rounded-lg" style={{ backgroundImage: `url(${slides[currentSlide].image})` }}>
              <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
              <div className="relative z-10 flex justify-center items-center text-center h-full text-white">
                <div>
                  <h2 className="text-3xl font-bold">{slides[currentSlide].title}</h2>
                  <p className="mt-4">{slides[currentSlide].description}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;

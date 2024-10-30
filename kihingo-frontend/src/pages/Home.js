// src/pages/Home.js;
import React, { useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { FaHome, FaVideo, FaNewspaper, FaChevronLeft, FaChevronRight, FaCalendar, FaBookOpen, FaDonate, FaComments } from 'react-icons/fa';
import '../styles/Home.css';

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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };


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

  const fetchRandomBibleVerse = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8000/api/bible-verse');
      if (!res.ok) throw new Error('Failed to fetch Bible verse');
      const data = await res.json();
      // Only update verse if not currently scrolling
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
      // Properly trigger reflow
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scrollVerse 15s linear';
    }
  };

  const handleScrollEnd = () => {
    scrollCount.current += 1;
    if (scrollCount.current < 2) {
      // Start another scroll cycle
      startScrollAnimation();
    } else {
      // After two complete scrolls, fetch new verse
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
  
    // Animate the heading
    const headingIntervalId = setInterval(() => {
      if (headingIndexRef.current < headingLength) {
        setDisplayText(prev => heading.slice(0, headingIndexRef.current + 1));
        headingIndexRef.current += 1;
      } else {
        clearInterval(headingIntervalId);
      }
    }, 100);
  
    // Calculate delay for subtitle animation
    const headingAnimationDuration = headingLength * 100; // Total time for heading animation
  
    // Start subtitle animation after heading finishes
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
  
    // Cleanup intervals and timeout
    return () => {
      clearInterval(headingIntervalId);
      clearTimeout(subtitleTimeoutId);
    };
  }, [fetchRandomBibleVerse]);
  


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
      <div className="bible-verse-scroll">
        <p 
          ref={verseRef}
          className="scrolling-verse"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>   
      <section className="hero-section">
          <div className="hero-background">
            <h1 className="animated-heading">{displayText}</h1>
            <p className="animated-subtitle">{displaySubtitle}</p>
            <div className="cta-buttons">
              <Link to="/about" className="cta-button primary">Join Us Today</Link>
              <Link to="/donations" className="cta-button secondary">Make a Donation</Link>
            </div>
          </div>
        </section>

        <section className="info-grid">
          <div className="info-card">
            <h2>Our Church</h2>
            <img src="/kihi.jpg" alt="Our Church" />
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
          <div className="church-groups-section">
            <h2>Our Church Groups</h2>
            <div className="church-groups-slider">
              <button className="slider-button prev" onClick={prevSlide}>
                <FaChevronLeft />
              </button>
              <div
                className="slide"
                style={{
                  backgroundImage: `url(${slides[currentSlide].image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  height: "100%",
                  width: "100%",
                }}
              >
                <div className="slide-content">
                  <h3>{slides[currentSlide].title}</h3>
                  <p>{slides[currentSlide].description}</p>
                </div>
              </div>
              <button className="slider-button next" onClick={nextSlide}>
                <FaChevronRight />
              </button>
            </div>
            <Link to="/church_groups" className="learn-more">
              Learn More About Our Groups
            </Link>
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
              <Link to="/donations" className="donate-button">Donate</Link>
            </div>
            <div className="donation-card">
              <h3>Project 2</h3>
              <p>Description of Project 2</p>
              <Link to="/donations" className="donate-button">Donate</Link>
            </div>
            <div className="donation-card">
              <h3>Project 3</h3>
              <p>Description of Project 3</p>
              <Link to="/donations" className="donate-button">Donate</Link>
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

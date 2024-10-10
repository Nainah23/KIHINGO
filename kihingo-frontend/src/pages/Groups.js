import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaArrowUp, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/Groups.css';

const Groups = () => {
  const [activeGroup, setActiveGroup] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const groups = [
    {
      name: "Introduction",
      description: "Our church is blessed with various groups that cater to different demographics and interests within our congregation. These groups provide opportunities for fellowship, spiritual growth, and service. Each group plays a vital role in strengthening our community and extending our mission.",
      images: ["/CHURCH.jpg"] // Not a slider anymore, only one image
    },
    {
      name: "Youth Group",
      description: "Our Youth Group is a vibrant community of young believers aged 13-25. The group is dynamic, offering members a platform to express their faith through weekly Bible studies, contemporary worship, and various social activities. From hiking adventures to community outreach projects, the Youth Group is focused on developing young leaders grounded in faith, integrity, and purpose. The friendships formed in this group last a lifetime, making it a safe and fun environment for the youth to grow spiritually and socially.",
      images: ["/YOUTH.jpg", "/YOUTH2.jpg", "/YOUTH3.jpg"]
    },
    {
      name: "ACK KAMA",
      description: "The Kenya Anglican Men Association (KAMA) is a brotherhood that aims to inspire Christian values among men. Whether through retreats, Bible studies, mentorship programs, or hands-on community service projects, KAMA empowers men to be role models in both their families and the community. It's more than just meetings; KAMA fosters lifelong bonds, encouraging spiritual growth, accountability, and service. Members are dedicated to making a meaningful impact while supporting each other in their journey of faith.",
      images: ["/KAMA.jpg", "/KAMA2.jpg"]
    },
    {
      name: "Sunday School",
      description: "Our Sunday School is a lively space filled with the joyful sounds of children learning about God’s love. Tailored for kids aged 3-12, the program combines Bible lessons, engaging activities, and creative crafts to make learning fun. Through storytelling, singing, and group games, children are encouraged to explore their faith in a nurturing environment. Our dedicated teachers aim to build a solid spiritual foundation for every child, ensuring they leave Sunday School with a strong sense of belonging, faith, and love for God and others.",
      images: ["/KIDS.jpg", "/KIDS2.jpg"]
    },
    {
      name: "Mother's Union",
      description: "The Mother's Union is a diverse group of women who are passionate about building and supporting strong Christian families. Through regular Bible studies, prayer sessions, and charitable outreach, the Mother's Union plays a crucial role in nurturing both spiritual and physical well-being in the community. Whether offering support to new mothers, organizing church events, or participating in local charity work, these women are pillars of faith and love. Their commitment to family values and community welfare shines through in everything they do.",
      images: ["/mothers-union-1.jpg", "/mothers-union-2.jpg", "/mothers-union-3.jpg"]
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % groups[activeGroup].images.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + groups[activeGroup].images.length) % groups[activeGroup].images.length);
  };

  return (
    <div className="groups-container">
      <Link to="/" className="back-button">
        <FaArrowLeft /> Back to Home
      </Link>
      <h1>Our Church Groups</h1>
      
      <div className="groups-nav">
        {groups.map((group, index) => (
          <button
            key={index}
            className={`group-nav-button ${activeGroup === index ? 'active' : ''}`}
            onClick={() => {
              setActiveGroup(index);
              setActiveSlide(0);
            }}
          >
            {group.name}
          </button>
        ))}
      </div>

      <div className="group-content">
        <h2>{groups[activeGroup].name}</h2>
        <p>{groups[activeGroup].description}</p>
        
        <div className="image-slider">
          <button className="slider-button prev" onClick={prevSlide}>
            <FaChevronLeft />
          </button>
          {/* Only show slider if there are multiple images */}
          {groups[activeGroup].images.length > 1 ? (
            <img src={groups[activeGroup].images[activeSlide]} alt={`${groups[activeGroup].name} - Image ${activeSlide + 1}`} />
          ) : (
            <img src={groups[activeGroup].images[0]} alt={`${groups[activeGroup].name}`} />
          )}
          <button className="slider-button next" onClick={nextSlide}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {showScrollTop && (
        <button className="scroll-top-button" onClick={scrollToTop}>
          <FaArrowUp />
        </button>
      )}
    </div>
  );
};

export default Groups;

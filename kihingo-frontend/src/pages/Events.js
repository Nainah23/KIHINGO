import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import '../styles/Events.css';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

const backgroundImages = [
  '/Events1.jpg',
  '/Events2.jpg',
  '/Events3.jpg',
  '/Event.jpg'
];

export default function Events() {
  const [events, setEvents] = useState([]);
  const [randomVerse, setRandomVerse] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '', image: null });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const scrollCount = useRef(0);
  const verseRef = useRef(null);

  const getImageUrl = (image) => {
    if (!image) return '/default-event.png';
    if (typeof image === 'string' && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image;
    }
    if (typeof image === 'string' && image.startsWith('uploads/')) {
      const cleanPath = image.replace(/^uploads\//, '');
      return `http://localhost:8000/uploads/${cleanPath}`;
    }
    return image.imageUrl || image;
  };

  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/events');
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchRandomBibleVerse = async () => {
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
  };

  const startScrollAnimation = () => {
    setIsScrolling(true);
    if (verseRef.current) {
      verseRef.current.style.animation = 'none';
      void verseRef.current.offsetHeight;
      verseRef.current.style.animation = 'scrollVerse 15s linear';
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

  const handleEdit = async (eventId, updatedEventData = {}) => {
    try {
      const formData = new FormData();
      Object.entries(updatedEventData).forEach(([key, value]) => {
        if (key === 'date') {
          formData.append(key, value); // Date is already in YYYY-MM-DD format
        } else {
          formData.append(key, value);
        }
      });

      const response = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        },
        body: formData,
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map(event => (event._id === eventId ? updatedEvent : event)));
        setActiveDropdown(null);
      } else {
        console.error('Error updating event:', response.statusText);
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      if (response.ok) {
        setEvents(events.filter(event => event._id !== eventId));
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prevState => ({ ...prevState, [name]: value }));
  };

  const handleImageChange = (e) => {
    setNewEvent(prevState => ({ ...prevState, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    Object.entries(newEvent).forEach(([key, value]) => {
      if (value !== null) {
        formData.append(key, value);
      }
    });

    try {
      const res = await fetch('http://localhost:8000/api/events', {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        },
        body: formData,
      });

      if (res.ok) {
        const createdEvent = await res.json();
        setEvents(prevEvents => [...prevEvents, createdEvent]);
        setNewEvent({ title: '', description: '', date: '', location: '', image: null });
        setShowEventForm(false);
      } else {
        console.error('Error creating event:', res.statusText);
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === backgroundImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? backgroundImages.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  useEffect(() => {
    fetchRandomBibleVerse();
    fetchEvents();

    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  return (
    <div className="events-page min-h-screen">
      {/* Bible Verse Scroll */}
      <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 p-4 verse-scroll">
        <p 
          ref={verseRef}
          className="text-white text-lg font-serif text-center"
          onAnimationEnd={handleScrollEnd}
        >
          {randomVerse}
        </p>
      </div>

      {/* Welcome Section with Sliding Background */}
      <div className="relative h-96 overflow-hidden welcome-section">
        {backgroundImages.map((img, index) => (
          <div
            key={index}
            className={`absolute w-full h-full transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              width: '100%',
              height: '100%'
            }}
          />
        ))}
        
        <div className="absolute inset-0 bg-black bg-opacity-50 welcome-message">
          <h1 className="text-6xl font-bold text-center mt-20">
            Welcome to Our Church Events!
          </h1>
        </div>

        {/* Slider Controls */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/30 p-2 rounded-full"
        >
          <ChevronLeft className="text-white" />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/30 p-2 rounded-full"
        >
          <ChevronRight className="text-white" />
        </button>

        {/* Slider Dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${currentSlide === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 py-8 grid grid-cols-4 gap-8">
        {/* Profile Section */}
        <div className="col-span-1 bg-white rounded-lg shadow-lg p-6 profile-section">
          <div className="flex flex-col items-center">
            <img
              src={getImageUrl(user?.profileImage)}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-500"
            />
            <h3 className="mt-4 text-xl font-semibold text-gray-800">
              {user?.name || 'Guest'}
            </h3>
            <p>{user?.username}</p>
          </div>
        </div>

        {/* Events Section */}
        <div className="col-span-3 events-list">
          {user?.role && (
            <button
              className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowEventForm(!showEventForm)}
            >
              {showEventForm ? 'Cancel' : 'Create Event'}
            </button>
          )}
          
          {showEventForm && (
            <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded shadow-lg">
              <h2 className="text-2xl font-semibold mb-2">Create New Event</h2>
              <input
                type="text"
                name="title"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={handleChange}
                className="mb-2 w-full p-2 border border-gray-300 rounded"
                required
              />
              <textarea
                name="description"
                placeholder="Event Description"
                value={newEvent.description}
                onChange={handleChange}
                className="mb-2 w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="date"
                name="date"
                value={newEvent.date}
                onChange={handleChange}
                className="mb-2 w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="text"
                name="location"
                placeholder="Event Location"
                value={newEvent.location}
                onChange={handleChange}
                className="mb-2 w-full p-2 border border-gray-300 rounded"
                required
              />
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="mb-2 w-full border border-gray-300 rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded px-4 py-2"
              >
                Create Event
              </button>
            </form>
          )}

          <h2 className="gradient-heading">Upcoming Events</h2>
          {events.length === 0 ? (
            <p>No events found.</p>
          ) : (
            events.map((event) => (
              <div key={event._id} className="mb-4 p-4 bg-white rounded shadow-md">
                <h3 className="text-xl font-bold">{event.title}</h3>
                <p>{event.description}</p>
                <p>{formatDateForDisplay(event.date)}</p>
                <p>Location: {event.location}</p>
                {(event.image || event.imageUrl) && (
                  <div className="w-32 h-32 object-cover border-4 border-purple-500">
                    <img 
                      src={getImageUrl(event.imageUrl || event.image)} 
                      alt={event.title} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-event.png';
                      }}
                    />
                  </div>
                )}
                {user?.role && (
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => handleEdit(event._id, { /* updated data */ })}
                      className="text-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event._id)}
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
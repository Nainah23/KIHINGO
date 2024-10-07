// src/pages/Testimonials.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get('/api/testimonials');
        setTestimonials(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <div>
      <h2>Testimonials</h2>
      {testimonials.map(testimonial => (
        <div key={testimonial._id}>
          <p>{testimonial.content}</p>
          <p>Posted by: {testimonial.user.name}</p>
          {/* Add reaction and comment functionality */}
        </div>
      ))}
    </div>
  );
};

export default Testimonials;

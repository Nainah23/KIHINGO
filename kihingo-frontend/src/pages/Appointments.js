// src/pages/Appointments.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axios.get('/api/appointments');
        setAppointments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div>
      <h2>Appointments</h2>
      {appointments.map(appointment => (
        <div key={appointment._id}>
          <p>With: {appointment.appointmentWith}</p>
          <p>Reason: {appointment.reason}</p>
          <p>Date: {new Date(appointment.date).toLocaleString()}</p>
          <p>Status: {appointment.status}</p>
        </div>
      ))}
      {/* Add appointment booking form */}
    </div>
  );
};

export default Appointments;

const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/authMiddleware');

// Book an appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { appointmentWith, reason, date } = req.body;
    const newAppointment = new Appointment({
      user: req.user.id,
      appointmentWith,
      reason,
      date
    });

    const appointment = await newAppointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all appointments for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update appointment status (for admin, reverend, or evangelist)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Check if user has permission to update
    if (!['admin', '
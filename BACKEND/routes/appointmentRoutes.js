// BACKEND/routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

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

// Get all appointments for the reverend
router.get('/reverend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    const appointments = await Appointment.find({ appointmentWith: req.user.id }).sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update appointment status (for reverend only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name');

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized to update appointment status' });
    }

    appointment.status = status;
    await appointment.save();

    // Create notification for the user
    const notification = new Notification({
      user: appointment.user._id,
      type: 'appointment',
      post: appointment._id,
      postModel: 'Appointment',
      creator: req.user.id,
      content: `Your appointment has been ${status} by the reverend.`
    });

    await notification.save();

    res.json(appointment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a new route to check and update past-due appointments
router.post('/update-status', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const pastDueAppointments = await Appointment.find({
      date: { $lt: now },
      status: { $in: ['pending', 'approved'] }
    });

    for (const appointment of pastDueAppointments) {
      appointment.status = 'completed';
      await appointment.save();
    }

    res.json({ msg: 'Appointment statuses updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Check if user owns the appointment or is the reverend
    if (appointment.user.toString() !== req.user.id && req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized to delete this appointment' });
    }

    await appointment.deleteOne();
    res.json({ msg: 'Appointment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Book an appointment 
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { reason, date } = req.body;

    // Find the reverend
    const reverend = await User.findOne({ role: 'reverend' });
    if (!reverend) {
      return res.status(404).json({ msg: 'No reverend found in the system' });
    }

    // Create a new appointment
    const newAppointment = new Appointment({
      user: req.user.id,
      appointmentWith: reverend._id,
      reason,
      date
    });

    const appointment = await newAppointment.save();

    // Create a notification for the reverend
    const notification = new Notification({
      user: reverend._id,
      type: 'appointment',
      post: appointment._id, // Use `appointment._id` here
      postModel: 'Appointment',
      creator: req.user.id
    });

    await notification.save();

    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        reason: appointment.reason,
        date: appointment.date,
        status: 'Pending'
      }
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).send('Server Error');
  }
});


module.exports = router;
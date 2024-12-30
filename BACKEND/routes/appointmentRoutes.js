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
    res.status(500).send('Server Error');
  }
});

// Get all appointments for reverends
router.get('/reverend', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    // Find all appointments made to reverend role
    const appointments = await Appointment.find({ appointmentToRole: 'reverend' })
      .sort({ date: 1 })
      .populate('user', 'name email');
    res.json(appointments);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Update appointment status
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'reverend') {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('user', 'name');

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    appointment.status = status;
    appointment.handledBy = req.user.id; // Track which reverend handled it
    await appointment.save();

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

    const newAppointment = new Appointment({
      user: req.user.id,
      appointmentToRole: 'reverend', // Store role instead of specific user
      reason,
      date,
      status: 'pending'
    });

    const appointment = await newAppointment.save();

    // Notify all reverends
    const reverends = await User.find({ role: 'reverend' });
    await Promise.all(reverends.map(reverend => 
      new Notification({
        user: reverend._id,
        type: 'appointment',
        post: appointment._id,
        postModel: 'Appointment',
        creator: req.user.id
      }).save()
    ));

    res.json({
      success: true,
      appointment: {
        id: appointment._id,
        reason: appointment.reason,
        date: appointment.date,
        status: 'pending'
      }
    });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


module.exports = router;
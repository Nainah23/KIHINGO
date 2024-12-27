// BACKEND/routes/appointmentRoutes.js
// Update the PUT route for appointment status changes
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
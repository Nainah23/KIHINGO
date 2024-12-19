// In your appointment creation route:
if (appointment) {
  // Find reverend user
  const reverend = await User.findOne({ role: 'reverend' });
  
  if (reverend) {
    await Notification.create({
      user: reverend._id,
      type: 'appointment',
      post: appointment._id,
      postModel: 'Appointment',
      creator: req.user.id
    });
  }
}
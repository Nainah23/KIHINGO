// BACKEND/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');
const authRoutes = require('./routes/authRoutes');
const feedRoutes = require('./routes/feedRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const donationRoutes = require('./routes/donationRoutes');
const eventRoutes = require('./routes/eventRoutes');
const livestreamRoutes = require('./routes/livestreamRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
.then(() => console.log('Umegongewa MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/livestream', livestreamRoutes);
app.use('/api/notifications', notificationRoutes);

app.listen(config.PORT, () => console.log(`Server running on port ${config.PORT}`));

module.exports = app;

// BACKEND/package.json
{
    "name": "backend",
    "version": "1.0.0",
    "main": "index.js",
    "scripts": {
      "dev": "nodemon server.js",
      "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "description": "",
    "dependencies": {
      "aws-sdk": "^2.1691.0",
      "axios": "^1.7.7",
      "bcryptjs": "^2.4.3",
      "cloudinary": "^2.5.0",
      "cors": "^2.8.5",
      "dotenv": "^16.4.5",
      "express": "^4.21.0",
      "jsonwebtoken": "^9.0.2",
      "mongoose": "^8.7.0",
      "multer": "^1.4.5-lts.1"
    },
    "devDependencies": {
      "nodemon": "^3.1.7"
    }
  }
  

  // BACKEND/routes/testimonialRoutes.js
const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const authMiddleware = require('../middleware/authMiddleware');

// Create a testimonial
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newTestimonial = new Testimonial({
      user: req.user.id,
      content: req.body.content
    });

    const testimonial = await newTestimonial.save();
    res.json(testimonial);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(testimonials);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a reaction to a testimonial
router.post('/:id/react', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const newReaction = {
      user: req.user.id,
      type: req.body.type
    };

    testimonial.reactions.push(newReaction);
    await testimonial.save();

    res.json(testimonial.reactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a comment to a testimonial
router.post('/:id/comment', authMiddleware, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ msg: 'Testimonial not found' });
    }

    const newComment = {
      user: req.user.id,
      content: req.body.content
    };

    testimonial.comments.push(newComment);
    await testimonial.save();

    res.json(testimonial.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// BACKEND/routes/eventRoutes.js;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;  // Cloudinary SDK
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config/config');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // limit file size to 5MB
  }
});

// Create an event
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    let imageUrl = '';

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: 'event-images' },
        (error, result) => {
          if (error) throw new Error('Image upload failed');
          imageUrl = result.secure_url;
        }
      ).end(req.file.buffer);
    }

    const newEvent = new Event({
      title,
      description,
      date,
      location,
      imageUrl,
      createdBy: req.user.id
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate('createdBy', 'name');
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name');
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update an event
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user authorization
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    let imageUrl = event.imageUrl;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload_stream(
        { folder: 'event-images' },
        (error, result) => {
          if (error) throw new Error('Image upload failed');
          imageUrl = result.secure_url;
        }
      ).end(req.file.buffer);
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, date, location, imageUrl },
      { new: true }
    );

    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete an event
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Check user authorization
    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await event.remove();

    res.json({ msg: 'Event removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


// BACKEND/routes/donationRoutes.js;
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Donation = require('../models/Donation');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config/config');

// Initiate MPESA STK Push
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;

    // Get MPESA access token
    const auth = Buffer.from(`${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`).toString('base64');
    const tokenResponse = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const password = Buffer.from(`${config.MPESA_SHORTCODE}${config.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkPushResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: config.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: config.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: `${config.BASE_URL}/api/donations/callback`,
        AccountReference: 'ACK St Philips KIHINGO Donation',
        TransactionDesc: 'Church Donation'
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    res.json(stkPushResponse.data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// MPESA callback
router.post('/callback', async (req, res) => {
  try {
    const { Body } = req.body;

    if (Body.stkCallback.ResultCode === 0) {
      const amount = Body.stkCallback.CallbackMetadata.Item.find(item => item.Name === 'Amount').Value;
      const transactionId = Body.stkCallback.CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber').Value;
      const phoneNumber = Body.stkCallback.CallbackMetadata.Item.find(item => item.Name === 'PhoneNumber').Value;

      // Find user by phone number (assuming you have phone number in your User model)
      const user = await User.findOne({ phoneNumber });

      if (user) {
        const donation = new Donation({
          user: user._id,
          amount,
          transactionId,
          status: 'completed'
        });

        await donation.save();
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all donations for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// BACKEND/routes/authRoutes.js;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      role
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      config.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get User
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// BACKEND/routes/appointmentRoutes.js;
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
    if (!['admin', 'reverend', 'evangelist'].includes(req.user.role)) {
      return res.status(403).json({ msg: 'Not authorized to update appointment status' });
    }

    appointment.status = status;
    await appointment.save();

    res.json(appointment);
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

    // Check if user owns the appointment or is an admin
    if (appointment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this appointment' });
    }

    await appointment.deleteOne();
    res.json({ msg: 'Appointment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// BACKEND/models/User.js;
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'reverend', 'evangelist'],
    default: 'member'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);

// BACKEND/models/Testimonial.js
const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['like', 'love', 'pray', 'amen']
  }
});

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TestimonialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  reactions: [ReactionSchema],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Testimonial', TestimonialSchema);

// BACKEND/models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);

// BACKEND/models/Donation.js
const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Donation', DonationSchema);


// BACKEND/models/Appointment.js;
const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentWith: {
    type: String,
    enum: ['reverend', 'evangelist'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);


// BACKEND/middleware/authMiddleware.js;
const jwt = require('jsonwebtoken');
const config = require('../config/config');

module.exports = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// BACKEND/config/config.js;
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'), // Important to replace escaped newlines
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET
};


// BACKEND/.env;
# Firebase credentials
FCM_PROJECT_ID=kihingo-469ea
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDZCPK85xUhtqMi\nqs5Cl8SBxhgwWHA/ffprlQ1qbjDAJFZjPvYO53B9q/XFLnHFNmqqS6J5DV1UlZZO\nkEraNZcCrZinMXIcA1Z/m1+5NrpoEAgkoEPj3g9+cNBI8HCqUTAcZOd6HkZkLnfs\nF8Bv7Zryt30XkVqCg7MNItP4uDgzpeYJlzfgqF1QvlQgBrpO8dzKJT8AnIvLDLL7\nocn8YCQOf0RaeMVmaT2lNY7ElEFFOV02QrVFDDckv+gis6id4Y7ExZVmwdefTFXU\nWtZWfLHbkVPcs+3Tv7g+REtc7RliRip133NWPTGbuPAKmYpv/Izp4pzJh/Rt774F\n4Pp1Foz/AgMBAAECggEAQKlTVKeOWrCE0w/LiviXkch4rXKz4p7AbKwIRrTUrnJF\nEKWR/qfCkpaYjypCuCx5xAnruqAaNdipYvfHbVK5DpG04N8w7Zqq+zLJ5q8hA17/\nZhYfk/S1bgjjbU/BaWTt7g+8DVyWwUM89GixK0fBud2kFdD3A9qEDn5ZZAlSqUQQ\nCHD514upaLYMA9sulyVo5VDy4b+g/F01GJz/hStZfdi/vasCX1n1wg1R00Bx5fXQ\nUbjYZ/5VTldZ98lSs87vRro6MDR/oEbJ+wBfFU9bOoY92/VB+52HoFmRn2vnDWVK\n8sWl42EbDtO+jGdtM6+MDB36GURF5FDPnyvh1X88iQKBgQDzrDF1LBtDSJzUTJkU\nHiRKhcI1m2YbmI2mbBz3CBmVKRWIJsncducQgZvOd5hnDABc4uBOMFruJfqbXstu\n7gGDCJK51C2Nzy7+1b3wTGvz3aHOtYAE8UUMEcl6LdT+OOjMS2DThX6X9jQw9s7r\ng226wNl3/sxTRb8RqGputsg/RwKBgQDkA8UqgViL7eBktPmtDnjBX0lHBXS0yAMk\nvWFN7woZ2eRNgZyyt3RRBhzgYe6F6FTJWBHGRppqX6jMhjCGw+TbQu2IuYRDJHIw\n9KF5JktXbqbcM470JGbETLegZ4YaB7XttHy9oS184A4ypI69vyap4zS1fStpjvIF\n3jNU+uXQiQKBgGRG5ouLvSRxS2jqpMxsow6wAP5Cl0CgBRsJvtnCUZTatWu0WroJ\njIl0bQQIn4U4oSWYkCpdJ+59XqZ12k4qUCD2dDtZH+4N5w8kMugi6wIOoToJ40cl\nav7OixVmqxJ7pQH9uzkQ5MnwngXQa9Lr4UpLdrM0/iz+tOS1ZCdvvPSdAoGAL/JP\nAooiaYJC3kpj+i0B3X/A8+tEyEMKzi34iR/L2vXDmTy5C6eiEOudJN3S/1uEgLZB\nPpVYISguYZuSFrSYqjafplGEa239iSfX0Jbp3t/IvKMm21XQOlT7hAJg45Zdfjem\nx2VeIFUpByMtVN8eLTk2uzcv6smBQRShbKw5qSkCgYEAo5OC/E+Cfwe7CfpKMFM1\nsFoPrzJu+9tKP9YdDQj0xWNn0MPuXB+w2Ahiob4xinZxRlpROM7dK2UGDjMz08YY\nEnJGBr2VUfNctGV4ONMN3Nzja/6brbo6iEyW9ANOesYXiC9SBmMagOAeIY4/bm3f\n2Jh2bRMFCLx6+n4KqVD5c3c=\n-----END PRIVATE KEY-----\n"
FCM_CLIENT_EMAIL=firebase-adminsdk-577z7@kihingo-469ea.iam.gserviceaccount.com
PORT=8000
MONGODB_URI=mongodb+srv://Naina:kihingo@main.nfdyx.mongodb.net/?retryWrites=true&w=majority&appName=Main
JWT_SECRET=wMOQwgm-fNrA_KdYgYzk24wqot22Dc-a0puZJ5i6abI
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_PASSKEY=
MPESA_SHORTCODE=
SENDGRID_API_KEY=
YOUTUBE_API_KEY=AIzaSyA9VcJpMV6gr0B5uaSvZxoHlD20XkqcPiM
CLOUDINARY_CLOUD_NAME=KIHINGO
CLOUDINARY_API_KEY=722522146451945
CLOUDINARY_API_SECRET=CVi9fD9H7H-RNn-xaYVRQuAUJeY

// BACKEND/routes/notificationRoutes.js;
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/authMiddleware');

// Get all notifications for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Mark a notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    // Check if the notification belongs to the user
    if (notification.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await notification.deleteOne();

    res.json({ msg: 'Notification removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;


// Backend/routes/livestreamRoutes.js;
const express = require('express');
const router = express.Router();
const Livestream = require('../models/Livestream');
const authMiddleware = require('../middleware/authMiddleware');
const { createLiveBroadcast, endLiveBroadcast } = require('../services/youtubeService');

// Create a livestream
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    // Create live broadcast on YouTube
    const { broadcastId, streamUrl } = await createLiveBroadcast(title, description, startTime, endTime);

    const newLivestream = new Livestream({
      title,
      description,
      streamUrl: `https://www.youtube.com/watch?v=${broadcastId}`, // YouTube livestream URL
      startTime,
      endTime,
      createdBy: req.user.id,
      youtubeBroadcastId: broadcastId, // Store YouTube broadcast ID
    });

    const livestream = await newLivestream.save();
    res.json(livestream);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all livestreams
router.get('/', async (req, res) => {
  try {
    const livestreams = await Livestream.find().sort({ startTime: -1 }).populate('createdBy', 'name');
    res.json(livestreams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a livestream
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({ msg: 'Livestream not found' });
    }

    // Check user authorization
    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Optionally, update the YouTube broadcast if needed
    // This requires implementing an update function in youtubeService.js

    livestream.title = title;
    livestream.description = description;
    livestream.startTime = startTime;
    livestream.endTime = endTime;

    await livestream.save();

    res.json(livestream);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a livestream
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const livestream = await Livestream.findById(req.params.id);

    if (!livestream) {
      return res.status(404).json({ msg: 'Livestream not found' });
    }

    // Check user authorization
    if (livestream.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // End the YouTube broadcast
    if (livestream.youtubeBroadcastId) {
      await endLiveBroadcast(livestream.youtubeBroadcastId);
    }

    await livestream.remove();

    res.json({ msg: 'Livestream removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

// Backend/routes/feedRoutes.js;
const express = require('express');
const router = express.Router();
const Feed = require('../models/Feed');
const authMiddleware = require('../middleware/authMiddleware');

// Create a feed post
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const newFeed = new Feed({
      user: req.user.id,
      content,
      attachments
    });
    const feed = await newFeed.save();
    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all feed posts
router.get('/', async (req, res) => {
  try {
    const feeds = await Feed.find().sort({ createdAt: -1 }).populate('user', 'name');
    res.json(feeds);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Update a feed post
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const feed = await Feed.findById(req.params.id);

    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }

    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update the feed post
    feed.content = content;
    feed.attachments = attachments;

    await feed.save();

    res.json(feed);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Delete a feed post
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const feed = await Feed.findById(req.params.id);
    if (!feed) {
      return res.status(404).json({ msg: 'Feed post not found' });
    }
    // Check user authorization
    if (feed.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    await feed.remove();
    res.json({ msg: 'Feed post removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
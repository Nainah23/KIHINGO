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
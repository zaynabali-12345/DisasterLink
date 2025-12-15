const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Donation = require('../models/donationModel.js');
const sendEmail = require('../utils/sendEmail.js');

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const RAZORPAY_AMOUNT_MULTIPLIER = 100;

// @desc    Create a Razorpay order
// @route   POST /api/donate/order
// @access  Public
const createOrder = asyncHandler(async (req, res) => {
  const { amount: requestAmount, currency = 'INR' } = req.body;
  const amount = Number(requestAmount);

  if (!amount || isNaN(amount) || amount <= 0) {
    res.status(400);
    throw new Error('A valid amount is required');
  }

  const options = {
    // Razorpay expects the amount in the smallest currency unit (e.g., paise for INR)
    // Ensure it's an integer.
    amount: Math.round(amount * RAZORPAY_AMOUNT_MULTIPLIER),
    currency,
    receipt: `receipt_order_${new Date().getTime()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    console.log('Razorpay Order Created Successfully on Backend:', order);
    res.json(order);
  } catch (error) {
    console.error('Error Creating Razorpay Order on Backend:', error);
    res.status(500);
    throw new Error('Failed to create Razorpay order.');
  }
});

// @desc    Verify payment and save donation
// @route   POST /api/donate/verify
// @access  Public
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    donorName,
    donorEmail,
  } = req.body;

  // --- Add validation for verification ---
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !donorName ||
    !donorEmail
  ) {
    res.status(400);
    throw new Error('Missing required fields for payment verification.');
  }

  // --- Add logging for verification ---
  console.log('--- Verifying Payment ---');
  console.log('Request Body:', req.body);

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    try {
      // For security, fetch the order directly from Razorpay to verify the amount
      const orderDetails = await razorpayInstance.orders.fetch(razorpay_order_id);

      if (!orderDetails) {
        res.status(404);
        throw new Error('Order not found with Razorpay.');
      }

      console.log('Payment Verification Successful. Signatures match.');
      // Payment is authentic, save to DB using the trusted amount from Razorpay
      const newDonation = await Donation.create({
        donorName,
        donorEmail,
        amount: orderDetails.amount / RAZORPAY_AMOUNT_MULTIPLIER, // Convert back from paise
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      // --- Send Thank You Email ---
      // We wrap this in a try/catch so that if the email fails to send,
      // it doesn't break the entire request. The donation is already saved.
      try {
        const emailSubject = 'Thank You for Your Donation to DisasterLink!';
        const emailText = `Dear ${donorName},\n\nThank you so much for your generous donation of ${newDonation.amount} ${orderDetails.currency}.\n\nYour support helps us respond quickly and effectively to disasters, providing essential aid to those in need.\n\nYour transaction ID is ${razorpay_payment_id}.\n\nWith gratitude,\nThe DisasterLink Team`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #0056b3;">Thank You for Your Generous Donation!</h2>
            <p>Dear ${donorName},</p>
            <p>Thank you so much for your generous donation of <strong>${newDonation.amount} ${orderDetails.currency}</strong>.</p>
            <p>Your support helps us respond quickly and effectively to disasters, providing essential aid to those in need.</p>
            <p>Your transaction ID is: <strong>${razorpay_payment_id}</strong></p>
            <hr>
            <p>With gratitude,<br><strong>The DisasterLink Team</strong></p>
          </div>
        `;

        await sendEmail({
          to: donorEmail,
          subject: emailSubject,
          text: emailText,
          html: emailHtml,
        });
        console.log(`Thank you email sent successfully to ${donorEmail}`);
      } catch (emailError) {
        console.error(`Failed to send thank you email to ${donorEmail}:`, emailError);
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully.',
        paymentId: razorpay_payment_id,
      });
    } catch (error) {
      console.error('Error during post-signature-verification step:', error);
      res.status(500);
      throw new Error('Error processing payment after verification.');
    }
  } else {
    console.error('Payment Verification Failed. Signatures do not match.');
    // It's important to return a 400 Bad Request here, as the client sent invalid data.
    res.status(400).json({
      success: false,
      message: 'Payment verification failed.',
    });
  }
});

module.exports = { createOrder, verifyPayment };

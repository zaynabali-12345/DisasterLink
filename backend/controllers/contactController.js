const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const ContactQuery = require('../models/contactQueryModel.js');

/**
 * @desc    Send an email from the contact form.
 * @route   POST /api/contact/send
 * @access  Public
 */
const sendContactEmail = asyncHandler(async (req, res) => {
  const { name, email, phoneNumber, queryType, subject, message } = req.body;

  if (!name || !email || !queryType || !subject || !message) {
    res.status(400);
    throw new Error('All required fields must be filled.');
  }

  // 1. Save the query to the database
  const query = new ContactQuery({
    name,
    email,
    phoneNumber,
    queryType,
    subject,
    message,
  });
  await query.save();

  // 2. Send the email notification
  // IMPORTANT: Use environment variables for your email and password in a real app!
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email provider
      auth: {
        user: process.env.EMAIL_USER, // Your email address from .env
        pass: process.env.EMAIL_PASS, // Your email password or app password from .env
      },
    });

    const mailOptions = {
      from: `"${name}" <${email}>`, // Shows the sender's name and email
      to: 'disasterlinkhelp@gmail.com', // Your receiving email address
      subject: `[${queryType}] - ${subject}`, // Add query type to subject for easy filtering
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone Number:</strong> ${phoneNumber || 'Not provided'}</p>
        <p><strong>Query Type:</strong> ${queryType}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p> 
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p>This query has been saved to the admin dashboard with ID: ${query._id}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (emailError) {
    console.error('Nodemailer error:', emailError);
    // The query was saved, but the email failed.
    // You might want to handle this case, but for now, we'll let the user know it was submitted.
  }

  res.status(201).json({ message: 'Message sent and query saved successfully!' });
});

/**
 * @desc    Get all contact queries
 * @route   GET /api/contact/queries
 * @access  Private/Admin
 */
const getContactQueries = asyncHandler(async (req, res) => {
  const queries = await ContactQuery.find({}).sort({ createdAt: -1 });
  res.json(queries);
});

/**
 * @desc    Update query status
 * @route   PUT /api/contact/queries/:id
 * @access  Private/Admin
 */
const updateQueryStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const query = await ContactQuery.findById(req.params.id);

  if (query) {
    query.status = status || query.status;
    const updatedQuery = await query.save();
    res.json(updatedQuery);
  } else {
    res.status(400);
    throw new Error('All fields are required.');
  }
});

/**
 * @desc    Reply to a contact query
 * @route   POST /api/contact/queries/:id/reply
 * @access  Private/Admin
 */
const replyToQuery = asyncHandler(async (req, res) => {
  const { replyMessage } = req.body;
  const query = await ContactQuery.findById(req.params.id);

  if (!query) {
    res.status(404);
    throw new Error('Query not found.');
  }

  if (!replyMessage) {
    res.status(400);
    throw new Error('Reply message is required.');
  }

  // Configure Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your disasterlinkhelp@gmail.com
      pass: process.env.EMAIL_PASS, // Your app password
    },
  });

  const mailOptions = {
    from: `"DisasterLink Support" <${process.env.EMAIL_USER}>`,
    to: query.email, // The user who submitted the query
    subject: `Re: ${query.subject}`,
    html: `
      <p>Hello ${query.name},</p>
      <p>Thank you for contacting DisasterLink. Here is a response to your query:</p>
      <blockquote style="border-left: 2px solid #ccc; padding-left: 1rem; margin-left: 1rem; color: #555;">${replyMessage.replace(/\n/g, '<br>')}</blockquote>
      <p>If you have any further questions, please feel free to reply to this email.</p>
      <p>Best regards,<br>The DisasterLink Team</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 2rem;" />
      <p style="font-size: 0.8rem; color: #777;">Original Message:<br><em>"${query.message}"</em></p>
    `,
  };

  await transporter.sendMail(mailOptions);

  // Mark the query as resolved after replying
  query.status = 'Resolved';
  const updatedQuery = await query.save();

  res.status(200).json(updatedQuery);
});

module.exports = { sendContactEmail, getContactQueries, updateQueryStatus, replyToQuery };
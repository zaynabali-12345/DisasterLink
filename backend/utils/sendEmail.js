const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      // Convert the string from .env to a boolean
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
      // For services like Mailtrap that might have self-signed certs in dev
      tls: {
        // Do not fail on invalid certs in development
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      },
    });

    // 2. Define the email options
    const mailOptions = {
      // Use a more descriptive "from" field for better email client display
      from: `"${process.env.EMAIL_FROM_NAME || 'DisasterLink Team'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
      to: options.to, // Use options.to to match the calling controller
      subject: options.subject,
      text: options.message, // Use options.message to be consistent
      html: options.html, // Allow for HTML content as well
    };

    // 3. Actually send the email and log the result
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Re-throw the error so the calling function knows something went wrong.
    throw new Error('Email could not be sent.');
  }
};

module.exports = sendEmail;
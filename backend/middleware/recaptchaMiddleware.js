const axios = require('axios');

const verifyRecaptcha = async (req, res, next) => {
  // When using multer for multipart forms, the text fields are in req.body
  const { captchaToken } = req.body;

  if (!captchaToken) {
    return res.status(400).json({ message: 'CAPTCHA token is missing.' });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`;

    const { data } = await axios.post(verificationURL);

    if (data.success) {
      // CAPTCHA is valid, proceed to the next middleware/controller
      next();
    } else {
      // CAPTCHA is invalid
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return res.status(400).json({ message: 'Failed CAPTCHA verification.' });
    }
  } catch (error) {
    console.error('Error during reCAPTCHA verification:', error);
    return res.status(500).json({ message: 'Server error during CAPTCHA verification.' });
  }
};

module.exports = { verifyRecaptcha };

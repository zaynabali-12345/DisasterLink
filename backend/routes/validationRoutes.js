const express = require('express');
const tesseract = require('tesseract.js');
const fs = require('fs');
const upload = require('../middleware/uploadMiddleware'); // Assuming uploadMiddleware is in this path

const router = express.Router();

/**
 * @desc    Validate an uploaded Aadhaar card image
 * @route   POST /api/validate/aadhaar
 * @access  Public
 */
router.post(
  '/aadhaar',
  upload.single('aadhaarPhoto'), // Use 'aadhaarPhoto' as the field name
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const imagePath = req.file.path;

    try {
      const {
        data: { text },
      } = await tesseract.recognize(imagePath, 'eng', {
        logger: (m) => console.log(m), // Optional: logs progress
      });

      // Validation criteria
      const hasKeywords =
        /Government of India|Unique Identification Authority of India|Aadhaar/i.test(
          text
        );
      const hasAadhaarNumber = /\b\d{4}\s\d{4}\s\d{4}\b/.test(text);

      if (hasKeywords && hasAadhaarNumber) {
        res.status(200).json({ isValid: true, message: 'Aadhaar card is valid.' });
      } else {
        res.status(400).json({ isValid: false, message: 'The uploaded image does not appear to be a valid Aadhaar card. Please try again.' });
      }
    } catch (error) {
      console.error('OCR Processing Error:', error);
      res.status(500).json({ message: 'Error processing the image.' });
    } finally {
      // Clean up the uploaded file after processing
      fs.unlinkSync(imagePath);
    }
  }
);

module.exports = router;


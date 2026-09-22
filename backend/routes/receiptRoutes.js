const express = require('express');
const router = express.Router();
const { analyzeReceipt } = require('../controllers/receiptController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected receipt upload & analysis
router.post('/analyze', protect, upload.single('receipt'), analyzeReceipt);

module.exports = router;

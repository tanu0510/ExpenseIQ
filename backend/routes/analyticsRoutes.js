const express = require('express');
const router = express.Router();
const {
  getSummary,
  getMonthlyTrends,
  getCategoryBreakdown,
  getSpendingTrends,
  getDeepMetrics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getSummary);
router.get('/monthly', getMonthlyTrends);
router.get('/categories', getCategoryBreakdown);
router.get('/trends', getSpendingTrends);
router.get('/deep-metrics', getDeepMetrics);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createRecurring,
  getRecurring,
  updateRecurring,
  deleteRecurring,
  processDueRecurring
} = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getRecurring)
  .post(createRecurring);

router.post('/process', processDueRecurring);

router.route('/:id')
  .put(updateRecurring)
  .delete(deleteRecurring);

module.exports = router;

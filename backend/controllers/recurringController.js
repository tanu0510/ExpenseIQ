const RecurringTransaction = require('../models/RecurringTransaction');
const { Transaction } = require('../models/Transaction');

const calculateNextDueDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setMonth(next.getMonth() + 1);
  }
  return next;
};

// @desc    Create recurring transaction
// @route   POST /api/recurring
// @access  Private
exports.createRecurring = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type = 'expense',
      category,
      frequency = 'monthly',
      startDate = new Date(),
      endDate,
      paymentMethod = 'UPI',
      notes
    } = req.body;

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
    }

    if (!title || !category) {
      return res.status(400).json({ success: false, error: 'Title and category are required' });
    }

    const start = new Date(startDate);
    const recurring = await RecurringTransaction.create({
      user: req.user.id,
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: category.trim(),
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      paymentMethod,
      notes: notes ? notes.trim() : '',
      nextDueDate: start
    });

    res.status(201).json({
      success: true,
      message: 'Recurring transaction created successfully',
      data: recurring
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user recurring transactions
// @route   GET /api/recurring
// @access  Private
exports.getRecurring = async (req, res, next) => {
  try {
    const recurring = await RecurringTransaction.find({ user: req.user.id }).sort({ nextDueDate: 1 });
    res.status(200).json({
      success: true,
      count: recurring.length,
      data: recurring
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update recurring transaction
// @route   PUT /api/recurring/:id
// @access  Private
exports.updateRecurring = async (req, res, next) => {
  try {
    let recurring = await RecurringTransaction.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    if (recurring.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const { title, amount, category, frequency, isActive, paymentMethod, notes, nextDueDate } = req.body;

    if (title) recurring.title = title.trim();
    if (amount !== undefined) recurring.amount = Math.max(0.01, Number(amount));
    if (category) recurring.category = category.trim();
    if (frequency) recurring.frequency = frequency;
    if (isActive !== undefined) recurring.isActive = !!isActive;
    if (paymentMethod) recurring.paymentMethod = paymentMethod;
    if (notes !== undefined) recurring.notes = notes.trim();
    if (nextDueDate) recurring.nextDueDate = new Date(nextDueDate);

    await recurring.save();

    res.status(200).json({
      success: true,
      message: 'Recurring transaction updated',
      data: recurring
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
exports.deleteRecurring = async (req, res, next) => {
  try {
    const recurring = await RecurringTransaction.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ success: false, error: 'Recurring transaction not found' });
    }

    if (recurring.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await recurring.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Recurring transaction deleted'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Process due recurring transactions safely without duplicates
// @route   POST /api/recurring/process
// @access  Private
exports.processDueRecurring = async (req, res, next) => {
  try {
    const now = new Date();
    const dueItems = await RecurringTransaction.find({
      user: req.user.id,
      isActive: true,
      nextDueDate: { $lte: now }
    });

    const generatedTransactions = [];

    for (const item of dueItems) {
      // Check if end date passed
      if (item.endDate && now > item.endDate) {
        item.isActive = false;
        await item.save();
        continue;
      }

      // Create transaction
      const txn = await Transaction.create({
        user: req.user.id,
        type: item.type,
        amount: item.amount,
        category: item.category,
        date: item.nextDueDate,
        paymentMethod: item.paymentMethod,
        description: `Recurring: ${item.title}`,
        notes: item.notes,
        recurring: true,
        recurringId: item._id,
        tags: ['recurring', item.frequency]
      });

      generatedTransactions.push(txn);

      // Advance nextDueDate
      item.lastGeneratedDate = item.nextDueDate;
      item.nextDueDate = calculateNextDueDate(item.nextDueDate, item.frequency);
      await item.save();
    }

    res.status(200).json({
      success: true,
      processedCount: generatedTransactions.length,
      data: generatedTransactions
    });
  } catch (err) {
    next(err);
  }
};

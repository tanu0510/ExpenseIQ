const Budget = require('../models/Budget');
const { Transaction } = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res, next) => {
  try {
    const { category = 'Overall', amount, month, year } = req.body;

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid budget amount greater than 0'
      });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!m || m < 1 || m > 12 || !y || y < 2020) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid month (1-12) and year'
      });
    }

    // Check if budget already exists for this category/month/year
    const existing = await Budget.findOne({
      user: req.user.id,
      category: category.trim(),
      month: m,
      year: y
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: `A budget for ${category} in ${m}/${y} already exists. You can edit it instead.`
      });
    }

    const budget = await Budget.create({
      user: req.user.id,
      category: category.trim(),
      amount: parsedAmount,
      month: m,
      year: y
    });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: budget
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all budgets with live actual spending and alert levels
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({
      user: userId,
      month,
      year
    }).sort({ category: 1 });

    // Calculate start & end date for the target month
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Aggregate expenses for the target month
    const expenses = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const totalOverallSpent = expenses.reduce((sum, item) => sum + item.totalSpent, 0);
    const categorySpentMap = {};
    expenses.forEach((item) => {
      categorySpentMap[item._id] = item.totalSpent;
    });

    // Compute progress for each budget
    const progressList = budgets.map((b) => {
      const spent = b.category === 'Overall' ? totalOverallSpent : (categorySpentMap[b.category] || 0);
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount > 0 ? parseFloat(((spent / b.amount) * 100).toFixed(1)) : 0;

      let alertLevel = 'normal';
      let alertMessage = 'Spending within healthy budget limits';

      if (percentage >= 100) {
        alertLevel = 'exceeded';
        alertMessage = `Budget exceeded by ${(spent - b.amount).toFixed(2)}!`;
      } else if (percentage >= 90) {
        alertLevel = 'danger';
        alertMessage = 'Critical: Over 90% of budget consumed!';
      } else if (percentage >= 70) {
        alertLevel = 'warning';
        alertMessage = 'Notice: 70% budget threshold reached.';
      }

      return {
        _id: b._id,
        category: b.category,
        amount: b.amount,
        month: b.month,
        year: b.year,
        spent,
        remaining,
        percentage,
        alertLevel,
        alertMessage
      };
    });

    res.status(200).json({
      success: true,
      month,
      year,
      totalOverallSpent,
      data: progressList
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res, next) => {
  try {
    const { amount, category } = req.body;
    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this budget' });
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Amount must be positive' });
      }
      budget.amount = parsedAmount;
    }

    if (category) {
      budget.category = category.trim();
    }

    await budget.save();

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: budget
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    if (budget.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this budget' });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

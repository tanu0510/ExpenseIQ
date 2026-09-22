const mongoose = require('mongoose');
const { Transaction } = require('../models/Transaction');
const Budget = require('../models/Budget');

// Helper to get current month date range
const getMonthRange = (date = new Date()) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
  return { start, end, year: y, month: m + 1 };
};

// @desc    Get dashboard financial summary
// @route   GET /api/analytics/summary
// @access  Private
exports.getSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const currentMonth = getMonthRange(now);

    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = getMonthRange(prevMonthDate);

    // Current Month Aggregations
    const currentMonthAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: currentMonth.start, $lte: currentMonth.end }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;
    currentMonthAgg.forEach((item) => {
      if (item._id === 'income') currentMonthIncome = item.total;
      if (item._id === 'expense') currentMonthExpense = item.total;
    });

    // Previous Month Expense (for MoM comparison)
    const prevMonthAgg = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: prevMonth.start, $lte: prevMonth.end }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const prevMonthExpense = prevMonthAgg.length > 0 ? prevMonthAgg[0].total : 0;

    // Calculate MoM change percentage
    let momChangePercentage = 0;
    if (prevMonthExpense > 0) {
      momChangePercentage = parseFloat(
        (((currentMonthExpense - prevMonthExpense) / prevMonthExpense) * 100).toFixed(1)
      );
    }

    // All-time Lifetime Totals
    const lifetimeAgg = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let lifetimeIncome = 0;
    let lifetimeExpense = 0;
    lifetimeAgg.forEach((item) => {
      if (item._id === 'income') lifetimeIncome = item.total;
      if (item._id === 'expense') lifetimeExpense = item.total;
    });

    const netBalance = lifetimeIncome - lifetimeExpense;
    const monthlySavings = currentMonthIncome - currentMonthExpense;
    const savingsRate =
      currentMonthIncome > 0
        ? parseFloat(((monthlySavings / currentMonthIncome) * 100).toFixed(1))
        : 0;

    // Get current month Overall Budget if configured
    const currentBudget = await Budget.findOne({
      user: userId,
      month: currentMonth.month,
      year: currentMonth.year,
      category: 'Overall'
    });

    let budgetAmount = currentBudget ? currentBudget.amount : 0;
    let budgetUtilization = budgetAmount > 0 ? parseFloat(((currentMonthExpense / budgetAmount) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalIncome: lifetimeIncome,
        totalExpenses: lifetimeExpense,
        netBalance,
        currentMonthIncome,
        currentMonthExpense,
        prevMonthExpense,
        monthlySavings,
        savingsRate: Math.max(0, savingsRate),
        momChangePercentage,
        budgetAmount,
        budgetUtilization,
        currency: req.user.currency || 'INR'
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get monthly income vs expense for the past 6 or 12 months
// @route   GET /api/analytics/monthly
// @access  Private
exports.getMonthlyTrends = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const monthsBack = parseInt(req.query.months, 10) || 6;

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsBack - 1));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthlyData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      }
    ]);

    // Build continuous array for all months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = [];

    const now = new Date();
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = `${monthNames[m - 1]} ${y.toString().slice(-2)}`;

      const inc = monthlyData.find(d => d._id.year === y && d._id.month === m && d._id.type === 'income');
      const exp = monthlyData.find(d => d._id.year === y && d._id.month === m && d._id.type === 'expense');

      const incomeTotal = inc ? inc.total : 0;
      const expenseTotal = exp ? exp.total : 0;

      result.push({
        month: label,
        year: y,
        monthNum: m,
        income: incomeTotal,
        expense: expenseTotal,
        savings: incomeTotal - expenseTotal
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get category-wise expense breakdown
// @route   GET /api/analytics/categories
// @access  Private
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month, year, type = 'expense' } = req.query;

    const match = { user: userId, type };

    if (month && year) {
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      match.date = {
        $gte: new Date(Date.UTC(y, m, 1)),
        $lte: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
      };
    }

    const categories = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const grandTotal = categories.reduce((sum, item) => sum + item.totalAmount, 0);

    const formatted = categories.map((cat) => ({
      category: cat._id,
      amount: cat.totalAmount,
      count: cat.count,
      percentage: grandTotal > 0 ? parseFloat(((cat.totalAmount / grandTotal) * 100).toFixed(1)) : 0
    }));

    res.status(200).json({
      success: true,
      total: grandTotal,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get daily spending trend for the current month or date range
// @route   GET /api/analytics/trends
// @access  Private
exports.getSpendingTrends = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month, year } = req.query;

    const now = new Date();
    const targetMonth = month ? parseInt(month, 10) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59, 999));

    const dailyData = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const exp = dailyData.find(d => d._id.day === day && d._id.type === 'expense');
      const inc = dailyData.find(d => d._id.day === day && d._id.type === 'income');

      result.push({
        day,
        date: `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        expense: exp ? exp.total : 0,
        income: inc ? inc.total : 0
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get deep analytics metrics (averages, top category, ratios)
// @route   GET /api/analytics/deep-metrics
// @access  Private
exports.getDeepMetrics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const now = new Date();
    const currentMonth = getMonthRange(now);

    // Current month expenses
    const expenses = await Transaction.find({
      user: userId,
      type: 'expense',
      date: { $gte: currentMonth.start, $lte: currentMonth.end }
    }).lean();

    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
    const daysSoFar = Math.max(1, now.getDate());
    const avgDailyExpense = parseFloat((totalExpense / daysSoFar).toFixed(2));

    // Category grouping
    const catMap = {};
    expenses.forEach((t) => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });

    let topCategory = { category: 'None', amount: 0 };
    Object.entries(catMap).forEach(([cat, amt]) => {
      if (amt > topCategory.amount) {
        topCategory = { category: cat, amount: amt };
      }
    });

    // Highest single transaction
    let highestExpense = { description: 'None', amount: 0, category: 'None' };
    expenses.forEach((t) => {
      if (t.amount > highestExpense.amount) {
        highestExpense = { description: t.description, amount: t.amount, category: t.category, date: t.date };
      }
    });

    res.status(200).json({
      success: true,
      data: {
        avgDailyExpense,
        totalCurrentMonthExpense: totalExpense,
        topCategory,
        highestExpense,
        transactionCount: expenses.length
      }
    });
  } catch (err) {
    next(err);
  }
};

const {
  Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS
} = require('../models/Transaction');

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      category,
      subcategory,
      date,
      paymentMethod,
      description,
      notes,
      recurring,
      tags,
      receiptUrl
    } = req.body;

    // Validate type
    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Transaction type must be 'income' or 'expense'"
      });
    }

    // Validate amount
    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number greater than 0'
      });
    }

    // Validate description
    if (!description || description.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a description'
      });
    }

    // Validate category
    if (!category || category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please select a category'
      });
    }

    const transaction = await Transaction.create({
      user: req.user.id,
      type,
      amount: parsedAmount,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      date: date ? new Date(date) : new Date(),
      paymentMethod: paymentMethod || 'UPI',
      description: description.trim(),
      notes: notes ? notes.trim() : '',
      recurring: !!recurring,
      tags: Array.isArray(tags) ? tags.map(t => t.trim()) : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()) : []),
      receiptUrl: receiptUrl || ''
    });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all transactions with search, filter, sort & pagination
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      month,
      year,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    const query = { user: req.user.id };

    // Type filter
    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    } else if (month && year) {
      // Month (1-12) & Year filter
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
      query.date = { $gte: start, $lte: end };
    }

    // Search filter across description, notes, and tags
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { notes: searchRegex },
        { tags: searchRegex },
        { category: searchRegex }
      ];
    }

    // Sorting
    const sort = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[sortBy] = order;
    if (sortBy !== 'createdAt') {
      sort.createdAt = -1;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Ensure transaction belongs to user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this transaction'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Ownership check
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this transaction'
      });
    }

    const {
      type,
      amount,
      category,
      subcategory,
      date,
      paymentMethod,
      description,
      notes,
      recurring,
      tags,
      receiptUrl
    } = req.body;

    const updateFields = {};
    if (type) {
      if (!['income', 'expense'].includes(type)) {
        return res.status(400).json({ success: false, error: 'Invalid transaction type' });
      }
      updateFields.type = type;
    }
    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
      }
      updateFields.amount = parsedAmount;
    }
    if (category) updateFields.category = category.trim();
    if (subcategory !== undefined) updateFields.subcategory = subcategory.trim();
    if (date) updateFields.date = new Date(date);
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;
    if (description) updateFields.description = description.trim();
    if (notes !== undefined) updateFields.notes = notes.trim();
    if (recurring !== undefined) updateFields.recurring = !!recurring;
    if (tags !== undefined) {
      updateFields.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map(t => t.trim()) : []);
    }
    if (receiptUrl !== undefined) updateFields.receiptUrl = receiptUrl;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    // Ownership check
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this transaction'
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: req.params.id }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get summary statistics (income, expenses, balance)
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const match = { user: req.user._id };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    } else if (month && year) {
      const m = parseInt(month, 10) - 1;
      const y = parseInt(year, 10);
      match.date = {
        $gte: new Date(Date.UTC(y, m, 1)),
        $lte: new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999))
      };
    }

    const summary = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    summary.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = item.total;
        incomeCount = item.count;
      } else if (item._id === 'expense') {
        totalExpense = item.total;
        expenseCount = item.count;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate: Math.max(0, parseFloat(savingsRate.toFixed(2))),
        totalTransactions: incomeCount + expenseCount,
        incomeCount,
        expenseCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get standard category lists & payment methods
// @route   GET /api/transactions/categories
// @access  Private
exports.getCategories = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      expenseCategories: EXPENSE_CATEGORIES,
      incomeCategories: INCOME_CATEGORIES,
      paymentMethods: PAYMENT_METHODS
    }
  });
};

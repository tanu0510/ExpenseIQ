const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Transportation',
  'Shopping',
  'Bills',
  'Rent',
  'Education',
  'Healthcare',
  'Entertainment',
  'Travel',
  'Subscription',
  'Personal Care',
  'Other'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Scholarship',
  'Gift',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'UPI',
  'Net Banking',
  'Bank Transfer',
  'Other'
];

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify transaction type (income or expense)'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than 0']
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
      index: true
    },
    subcategory: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'UPI'
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
      default: ''
    },
    recurring: {
      type: Boolean,
      default: false
    },
    recurringId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    receiptUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimized querying
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ user: 1, category: 1 });
TransactionSchema.index({ user: 1, type: 1, date: -1 });

module.exports = {
  Transaction: mongoose.model('Transaction', TransactionSchema),
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS
};

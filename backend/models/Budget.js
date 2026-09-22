const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Please provide a category for the budget'],
      default: 'Overall',
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide a budget limit amount'],
      min: [1, 'Budget amount must be at least 1']
    },
    month: {
      type: Number,
      required: [true, 'Please specify the month (1-12)'],
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: [true, 'Please specify the year'],
      min: 2020,
      max: 2100
    }
  },
  {
    timestamps: true
  }
);

// Ensure a user can only have one budget per category per month/year
BudgetSchema.index({ user: 1, category: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);

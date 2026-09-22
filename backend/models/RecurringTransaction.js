const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the recurring item'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be positive']
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      default: 'expense'
    },
    category: {
      type: String,
      required: [true, 'Please specify a category']
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    paymentMethod: {
      type: String,
      default: 'UPI'
    },
    notes: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastGeneratedDate: {
      type: Date,
      default: null
    },
    nextDueDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

RecurringTransactionSchema.index({ user: 1, isActive: 1, nextDueDate: 1 });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);

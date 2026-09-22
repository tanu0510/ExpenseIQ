import React, { useState, useEffect, useCallback } from 'react';
import { budgetService } from '../services/budgetService';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit2,
  Trash2,
  DollarSign,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const BudgetsPage = () => {
  const { formatCurrency } = useCurrency();
  const { success, error } = useToast();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Overall',
    amount: ''
  });

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await budgetService.getBudgets({
        month: selectedMonth,
        year: selectedYear
      });
      setBudgets(res.data);
      setTotalSpent(res.totalOverallSpent);
    } catch (err) {
      error(err.response?.data?.error || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, error]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setFormData({ category: 'Overall', amount: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBudget(b);
    setFormData({
      category: b.category,
      amount: b.amount
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      error('Please enter a valid positive budget amount');
      return;
    }

    try {
      setSubmitting(true);
      if (editingBudget) {
        await budgetService.updateBudget(editingBudget._id, {
          amount: Number(formData.amount),
          category: formData.category
        });
        success('Budget updated successfully');
      } else {
        await budgetService.createBudget({
          category: formData.category,
          amount: Number(formData.amount),
          month: selectedMonth,
          year: selectedYear
        });
        success('Budget created successfully');
      }
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await budgetService.deleteBudget(id);
      success('Budget removed');
      fetchBudgets();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete budget');
    }
  };

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Critical alerts summary
  const alerts = budgets.filter((b) => b.alertLevel !== 'normal');

  return (
    <div className="space-y-6">
      {/* Header & Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Budget Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Set target spending thresholds and receive automated alerts at 70%, 90%, and 100%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month selector controls */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-32 text-center">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </span>
            <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-lg text-slate-500">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Threshold Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a._id}
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                a.alertLevel === 'exceeded'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : a.alertLevel === 'danger'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">
                <span className="font-bold">{a.category} Budget Alert:</span> {a.alertMessage} (
                {formatCurrency(a.spent)} of {formatCurrency(a.amount)} used - {a.percentage}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Loading budgets...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No budgets configured for {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            Plan your spending by setting an overall limit or specific limits for groceries, rent, or food.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const isExceeded = b.alertLevel === 'exceeded';
            const isDanger = b.alertLevel === 'danger';
            const isWarning = b.alertLevel === 'warning';

            let barColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let badgeText = 'On Track';

            if (isExceeded) {
              barColor = 'bg-rose-500';
              badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';
              badgeText = 'Exceeded (100%+)';
            } else if (isDanger) {
              barColor = 'bg-amber-500';
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-200';
              badgeText = 'Critical (90%+)';
            } else if (isWarning) {
              barColor = 'bg-yellow-400';
              badgeBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
              badgeText = 'Warning (70%+)';
            }

            return (
              <div
                key={b._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {b.category === 'Overall' ? 'Monthly Master' : 'Category Target'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{b.category}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit limit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xl font-bold text-slate-900">{formatCurrency(b.spent)}</span>
                    <span className="text-xs text-slate-500 font-medium">of {formatCurrency(b.amount)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className="text-slate-500">
                      {isExceeded ? 'Overspent by' : 'Remaining'}:{' '}
                      <span className="font-bold text-slate-800">
                        {formatCurrency(isExceeded ? b.spent - b.amount : b.remaining)}
                      </span>
                    </span>
                    <span className="font-bold text-slate-900">{b.percentage}%</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                    {badgeText}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {monthNames[b.month - 1].slice(0, 3)} {b.year}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Create / Edit Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBudget ? 'Edit Budget' : 'Create Monthly Budget'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Category *</label>
                <select
                  value={formData.category}
                  disabled={!!editingBudget}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value="Overall">Overall (Total Monthly Limit)</option>
                  <optgroup label="Specific Categories">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Choose 'Overall' to set a cap for your entire monthly spending, or pick a specific category.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Budget Limit Amount *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold">Period:</span> {monthNames[selectedMonth - 1]} {selectedYear}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBudget ? 'Save Changes' : 'Create Budget'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;

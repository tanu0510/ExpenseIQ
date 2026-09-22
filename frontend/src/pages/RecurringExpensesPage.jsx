import React, { useState, useEffect, useCallback } from 'react';
import { recurringService } from '../services/recurringService';
import { useCurrency } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../utils/constants';
import {
  RefreshCw,
  Plus,
  Calendar,
  DollarSign,
  Play,
  Pause,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Loader2,
  Clock,
  Sparkles
} from 'lucide-react';

const RecurringExpensesPage = () => {
  const { formatCurrency } = useCurrency();
  const { success, error, info } = useToast();

  const [recurringList, setRecurringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    amount: '',
    type: 'expense',
    category: 'Subscription',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentMethod: 'UPI',
    notes: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchRecurring = useCallback(async () => {
    try {
      setLoading(true);
      const data = await recurringService.getRecurring();
      setRecurringList(data);
    } catch (err) {
      error(err.response?.data?.error || 'Failed to fetch recurring items');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const handleProcessDue = async () => {
    try {
      setProcessing(true);
      const res = await recurringService.processDueRecurring();
      if (res.processedCount > 0) {
        success(`Successfully processed ${res.processedCount} due recurring transactions!`);
      } else {
        info('No recurring transactions are due at this time.');
      }
      fetchRecurring();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to process recurring transactions');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await recurringService.updateRecurring(item._id, { isActive: !item.isActive });
      success(`Recurring item ${!item.isActive ? 'activated' : 'paused'}`);
      fetchRecurring();
    } catch (err) {
      error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring subscription/schedule?')) return;
    try {
      await recurringService.deleteRecurring(id);
      success('Recurring rule removed');
      fetchRecurring();
    } catch (err) {
      error('Failed to delete');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || Number(formData.amount) <= 0) {
      error('Please provide a valid title and positive amount');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        endDate: formData.endDate ? formData.endDate : null
      };

      if (editingItem) {
        await recurringService.updateRecurring(editingItem._id, payload);
        success('Recurring rule updated');
      } else {
        await recurringService.createRecurring(payload);
        success('Recurring transaction scheduled');
      }
      setIsModalOpen(false);
      fetchRecurring();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save recurring item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      paymentMethod: item.paymentMethod || 'UPI',
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Expenses & Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automate routine commitments (Netflix, broadband, rent, salary) safely without duplicates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleProcessDue}
            disabled={processing}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            title="Check and safely generate due transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${processing ? 'animate-spin' : ''}`} />
            <span>Sync Due Items</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Recurring Item</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
          <p className="text-xs font-semibold text-slate-700">Loading recurring schedules...</p>
        </div>
      ) : recurringList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No recurring items configured</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            Add recurring subscriptions like Spotify, Gym memberships, or monthly house rent.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Schedule Recurring Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recurringList.map((item) => {
            const isExpense = item.type === 'expense';
            const isDueNow = new Date(item.nextDueDate) <= new Date();

            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
                  item.isActive ? 'border-slate-200/80' : 'border-slate-200/50 opacity-70 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {item.frequency}
                        </span>
                        {item.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            Paused
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isActive
                            ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={item.isActive ? 'Pause' : 'Activate'}
                      >
                        {item.isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-slate-900 my-2">
                    {formatCurrency(item.amount)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 py-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Next Due:
                      </span>
                      <span className={`font-semibold ${isDueNow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {new Date(item.nextDueDate).toLocaleDateString()}
                        {isDueNow && ' (Due Now)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Method:</span>
                      <span className="text-slate-800 font-medium">{item.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {item.lastGeneratedDate && (
                  <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                    Last logged: {new Date(item.lastGeneratedDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingItem ? 'Edit Recurring Schedule' : 'Schedule Recurring Item'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Netflix Premium / High-speed Fiber"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount *</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
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
                  <span>{editingItem ? 'Save Changes' : 'Schedule Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringExpensesPage;

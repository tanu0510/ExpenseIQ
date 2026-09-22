import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_COLORS } from '../utils/constants';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Award,
  CreditCard,
  Loader2,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const AnalyticsPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);

  const [timeframe, setTimeframe] = useState('6'); // 3, 6, 12 months
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [dailyTrends, setDailyTrends] = useState([]);
  const [deepMetrics, setDeepMetrics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [monthly, cats, daily, deep] = await Promise.all([
          analyticsService.getMonthlyTrends(parseInt(timeframe, 10)),
          analyticsService.getCategoryBreakdown(),
          analyticsService.getSpendingTrends(),
          analyticsService.getDeepMetrics()
        ]);

        setMonthlyTrends(monthly);
        setCategoryBreakdown(cats.data || []);
        setDailyTrends(daily);
        setDeepMetrics(deep);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        <p className="text-xs font-semibold text-slate-700">Analyzing financial data...</p>
      </div>
    );
  }

  // Calculate Average Monthly Expense across the timeframe
  const totalExpensesInPeriod = monthlyTrends.reduce((sum, m) => sum + m.expense, 0);
  const avgMonthlyExpense = monthlyTrends.length > 0 ? totalExpensesInPeriod / monthlyTrends.length : 0;

  return (
    <div className="space-y-6">
      {/* Header & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Spending Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Deep insights into your cash flow, category distributions, and multi-month trends.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 shadow-sm text-xs">
          <span className="text-slate-400 px-2 font-medium">History:</span>
          {['3', '6', '12'].map((months) => (
            <button
              key={months}
              onClick={() => setTimeframe(months)}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                timeframe === months
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {months} Months
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Average Daily Expense</span>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(deepMetrics?.avgDailyExpense || 0)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Based on this month's activity</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Average Monthly Expense</span>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(avgMonthlyExpense)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across past {timeframe} months</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Top Category</span>
          <div className="text-xl font-bold text-slate-900 truncate">
            {deepMetrics?.topCategory?.category || 'None'}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            {formatCurrency(deepMetrics?.topCategory?.amount || 0)} total
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Highest Single Expense</span>
          <div className="text-xl font-bold text-slate-900">
            {formatCurrency(deepMetrics?.highestExpense?.amount || 0)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            {deepMetrics?.highestExpense?.description || 'N/A'}
          </span>
        </div>
      </div>

      {/* Monthly Cash Flow & Savings Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Multi-Month Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Cash Flow Comparison</h2>
          <p className="text-xs text-slate-400 mb-4">Income vs Expense trends over {timeframe} months</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Savings Trajectory Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Monthly Savings Trajectory</h2>
          <p className="text-xs text-slate-400 mb-4">Net surplus (Income minus Expense) per month</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="savings"
                  name="Net Savings"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily Spending Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Daily Expense Breakdown (Current Month)</h2>
          <p className="text-xs text-slate-400 mb-4">Expenditure spikes throughout the month</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="expense" name="Day Expense" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Table Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 mb-1">All-time Category Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Ranked by total spending</p>

          <div className="flex-1 overflow-y-auto max-h-64 space-y-2 pr-1">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{item.category}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span>{item.count} transactions</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: CATEGORY_COLORS[item.category] || '#64748b'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

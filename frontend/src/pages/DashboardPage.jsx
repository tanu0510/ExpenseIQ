import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { transactionService } from '../services/transactionService';
import { useCurrency } from '../context/CurrencyContext';
import { CATEGORY_COLORS } from '../utils/constants';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Plus,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Receipt,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DashboardPage = () => {
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState(null);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [spendingTrends, setSpendingTrends] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [sumRes, trendsRes, catRes, spendRes, txnRes] = await Promise.all([
          analyticsService.getSummary(),
          analyticsService.getMonthlyTrends(6),
          analyticsService.getCategoryBreakdown(),
          analyticsService.getSpendingTrends(),
          transactionService.getTransactions({ limit: 5, sortBy: 'date', sortOrder: 'desc' })
        ]);

        setSummary(sumRes);
        setMonthlyTrends(trendsRes);
        setCategoryData(catRes.data || []);
        setSpendingTrends(spendRes);
        setRecentTransactions(txnRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading your financial dashboard...</p>
      </div>
    );
  }

  // Calculate dynamic automated insights based on real user figures
  const insights = [];
  if (summary) {
    if (summary.momChangePercentage > 0) {
      insights.push({
        type: 'warning',
        text: `Your spending increased by ${summary.momChangePercentage}% compared with last month.`
      });
    } else if (summary.momChangePercentage < 0) {
      insights.push({
        type: 'success',
        text: `Great job! Your spending decreased by ${Math.abs(summary.momChangePercentage)}% compared to last month.`
      });
    }

    if (categoryData.length > 0) {
      insights.push({
        type: 'info',
        text: `${categoryData[0].category} is currently your highest expense category (${categoryData[0].percentage}% of total expenses).`
      });
    }

    if (summary.budgetAmount > 0) {
      if (summary.budgetUtilization > 100) {
        insights.push({
          type: 'danger',
          text: `Alert: Overall budget exceeded! You have spent ${summary.budgetUtilization}% of your monthly limit.`
        });
      } else if (summary.budgetUtilization >= 90) {
        insights.push({
          type: 'warning',
          text: `Caution: You have used ${summary.budgetUtilization}% of your monthly budget.`
        });
      } else if (summary.budgetUtilization >= 70) {
        insights.push({
          type: 'info',
          text: `Notice: You have used ${summary.budgetUtilization}% of your monthly budget.`
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time analytics and tracking for the current period.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/receipts"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>Scan Receipt</span>
          </Link>

          <Link
            to="/budgets"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Target className="w-3.5 h-3.5 text-indigo-600" />
            <span>Budgets</span>
          </Link>

          <Link
            to="/transactions"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* AI & Rule-based Insights Alert Banner */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs font-medium ${
                ins.type === 'danger'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : ins.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : ins.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-current opacity-80" />
              <div className="flex-1">{ins.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Income</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary?.totalIncome || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">
              +{formatCurrency(summary?.currentMonthIncome || 0)}
            </span>{' '}
            this month
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary?.totalExpenses || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-rose-600 font-semibold">
              {formatCurrency(summary?.currentMonthExpense || 0)}
            </span>{' '}
            this month
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Current Balance</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {formatCurrency(summary?.netBalance || 0)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Net accumulated savings
          </div>
        </div>

        {/* Savings Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500">Savings Rate</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">
            {summary?.savingsRate || 0}%
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {formatCurrency(summary?.monthlySavings || 0)} saved this month
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Monthly Income vs Expense</h2>
              <p className="text-xs text-slate-400">Past 6 months comparison</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => formatCurrency(val)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Expense by Category</h2>
              <p className="text-xs text-slate-400">Top spending areas</p>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              No expense data recorded yet.
            </div>
          ) : (
            <>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => formatCurrency(val)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="mt-2 space-y-1.5 overflow-y-auto max-h-32 pr-1">
                {categoryData.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b' }}
                      />
                      <span className="text-slate-600 font-medium">{cat.category}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {formatCurrency(cat.amount)} <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Spending Trend Area Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Daily Spending Trend (Current Month)</h2>
            <p className="text-xs text-slate-400">Day-by-day expense distribution</p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spendingTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Area type="monotone" dataKey="expense" name="Daily Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#expenseGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions & Budget Progress Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest activity</p>
            </div>
            <Link to="/transactions" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">No transactions recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTransactions.map((t) => {
                const isIncome = t.type === 'income';
                return (
                  <div key={t._id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{t.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {t.category} • {new Date(t.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isIncome ? '+' : '-'} {formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Budget Utilization Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Monthly Budget</h2>
                <p className="text-xs text-slate-400">Overall monthly spending limit</p>
              </div>
              <Link to="/budgets" className="text-xs text-indigo-600 font-semibold hover:underline">
                Manage
              </Link>
            </div>

            {summary?.budgetAmount > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-black text-slate-900">
                    {summary.budgetUtilization}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatCurrency(summary.currentMonthExpense)} / {formatCurrency(summary.budgetAmount)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.budgetUtilization > 100
                        ? 'bg-rose-500'
                        : summary.budgetUtilization >= 90
                        ? 'bg-amber-500'
                        : summary.budgetUtilization >= 70
                        ? 'bg-yellow-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, summary.budgetUtilization)}%` }}
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Remaining Limit:</span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(Math.max(0, summary.budgetAmount - summary.currentMonthExpense))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span
                      className={`font-semibold ${
                        summary.budgetUtilization > 100
                          ? 'text-rose-600'
                          : summary.budgetUtilization >= 90
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {summary.budgetUtilization > 100
                        ? 'Over Budget'
                        : summary.budgetUtilization >= 90
                        ? 'Near Limit'
                        : 'On Track'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No overall budget set for this month.</p>
                <Link
                  to="/budgets"
                  className="mt-3 inline-block px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold"
                >
                  Set Budget Now
                </Link>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>AI Spending Forecast</span>
            <Link to="/ml-insights" className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
              <span>View Predictions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency, CURRENCY_SYMBOLS } from '../context/CurrencyContext';
import { useToast } from '../context/ToastContext';
import { User, Lock, DollarSign, Target, Globe, Shield, Save, Loader2 } from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const { success, error } = useToast();

  const [profileForm, setProfileForm] = useState({
    name: '',
    currency: 'INR',
    monthlyIncome: '',
    savingsGoal: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        currency: user.currency || 'INR',
        monthlyIncome: user.monthlyIncome || '',
        savingsGoal: user.savingsGoal || '',
      });
      if (user.currency) {
        setCurrency(user.currency);
      }
    }
  }, [user, setCurrency]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        name: profileForm.name,
        currency: profileForm.currency,
        monthlyIncome: profileForm.monthlyIncome ? Number(profileForm.monthlyIncome) : 0,
        savingsGoal: profileForm.savingsGoal ? Number(profileForm.savingsGoal) : 0,
      });
      setCurrency(profileForm.currency);
      success('Profile updated successfully!');
    } catch (err) {
      error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      success('Password changed successfully!');
    } catch (err) {
      error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Financial Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, preferred currency, and monthly budget targets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-emerald-400 border-2 border-slate-700 flex items-center justify-center font-bold text-2xl shadow-md mb-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="font-bold text-slate-900 text-lg">{user?.name}</h2>
          <p className="text-xs text-slate-500 mb-4">{user?.email}</p>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-left">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Member Since:</span>
              <span className="font-medium text-slate-700">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Base Currency:</span>
              <span className="font-semibold text-emerald-600">
                {user?.currency || 'INR'} ({CURRENCY_SYMBOLS[user?.currency || 'INR']})
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Monthly Target:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(user?.savingsGoal || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Settings Form */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-base">General Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Default Currency</label>
                <select
                  value={profileForm.currency}
                  onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
                    <option key={curr} value={curr}>
                      {curr} - {CURRENCY_SYMBOLS[curr]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Expected Monthly Income</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    value={profileForm.monthlyIncome}
                    onChange={(e) => setProfileForm({ ...profileForm, monthlyIncome: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Monthly Savings Goal</label>
                <div className="relative">
                  <Target className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    value={profileForm.savingsGoal}
                    onChange={(e) => setProfileForm({ ...profileForm, savingsGoal: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Security / Password Change */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 text-base">Security & Password</h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Min 6 chars"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Min 6 chars"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

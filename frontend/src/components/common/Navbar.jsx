import React from 'react';
import { Menu, Globe, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency, CURRENCY_SYMBOLS } from '../../context/CurrencyContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-sm font-medium text-slate-500">Welcome back,</span>{' '}
          <span className="text-sm font-bold text-slate-900">{user?.name || 'Rahul'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 hover:bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition-colors">
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-transparent border-none outline-none cursor-pointer pr-1 text-slate-800 font-medium"
          >
            {Object.keys(CURRENCY_SYMBOLS).map((curr) => (
              <option key={curr} value={curr}>
                {curr} ({CURRENCY_SYMBOLS[curr]})
              </option>
            ))}
          </select>
        </div>

        {/* AI Quick Assistant Link */}
        <Link
          to="/ai-assistant"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/70 text-xs font-semibold transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Ask AI</span>
        </Link>

        {/* Profile Avatar */}
        <Link
          to="/profile"
          className="w-9 h-9 rounded-full bg-slate-900 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-sm shadow-sm hover:ring-2 hover:ring-emerald-500/30 transition-all"
          title="Account Profile"
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;

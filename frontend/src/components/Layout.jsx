import { NavLink } from 'react-router-dom';
import { Search, Coins, Wallet, BarChart2, Trophy, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const nav = [
  { to: '/', label: 'Search', icon: Search, end: true },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/pnl', label: 'PnL', icon: TrendingUp },
  { to: '/top-traders', label: 'Top Traders', icon: Trophy },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-dark-600 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-brand-400" />
            </div>
            <span className="font-bold text-slate-100 text-sm">SolTracker</span>
          </div>

          <nav className="flex items-center gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500/15 text-brand-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-700'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}

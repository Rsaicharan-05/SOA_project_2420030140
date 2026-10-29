import React from 'react';
import { View, UserProfile } from '../types';
import { Icons } from './Icons';
import { getCurrencySymbol } from '../constants';

interface Props {
  currentView: View;
  onChangeView: (view: View) => void;
  onOpenAddModal?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenShortcuts?: () => void;
  user?: UserProfile | null;
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ 
  currentView, 
  onChangeView, 
  onOpenAddModal, 
  onOpenCommandPalette,
  onOpenShortcuts,
  user, 
  children 
}) => {
  const currencySymbol = getCurrencySymbol(user?.currency || 'INR');

  const getPageTitle = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return { title: 'Dashboard', subtitle: 'Overview of your financial activity' };
      case View.TRANSACTIONS:
        return { title: 'Transactions Ledger', subtitle: 'Detailed record of income and expenses' };
      case View.ANALYTICS:
        return { title: 'Spending Analytics', subtitle: 'Visual trends and AI-powered insights' };
      case View.PROFILE:
        return { title: 'Profile & Settings', subtitle: 'Budgets, accounts, and preferences' };
      default:
        return { title: 'AI EXPENSE TRACKING', subtitle: 'Personal Finance' };
    }
  };

  const { title, subtitle } = getPageTitle();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* ============================================================ */}
      {/* DESKTOP & TABLET SIDEBAR (md and above) */}
      {/* ============================================================ */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col justify-between bg-white border-r border-slate-200/80 sticky top-0 h-screen p-5 z-40">
        <div className="space-y-5">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-500/20">
              ₹
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                AI EXPENSE TRACKING
              </h1>
              <p className="text-[11px] font-medium text-slate-400">Smart Personal Finance</p>
            </div>
          </div>

          {/* Search / Command Palette Quick Button */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Icons.Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search or Cmd...</span>
              </div>
              <kbd className="px-1.5 py-0.5 bg-white rounded text-[10px] font-mono border border-slate-200 font-bold">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Add Button */}
          {onOpenAddModal && (
            <button
              id="sidebar-add-btn"
              onClick={onOpenAddModal}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition-all cursor-pointer"
            >
              <Icons.Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1 pt-1">
            <SidebarItem
              id="nav-home"
              active={currentView === View.DASHBOARD}
              onClick={() => onChangeView(View.DASHBOARD)}
              icon={<Icons.Home className="w-5 h-5" />}
              label="Dashboard"
            />
            <SidebarItem
              id="nav-transactions"
              active={currentView === View.TRANSACTIONS}
              onClick={() => onChangeView(View.TRANSACTIONS)}
              icon={<Icons.List className="w-5 h-5" />}
              label="Transactions"
            />
            <SidebarItem
              id="nav-analytics"
              active={currentView === View.ANALYTICS}
              onClick={() => onChangeView(View.ANALYTICS)}
              icon={<Icons.Chart className="w-5 h-5" />}
              label="Insights & Analytics"
            />
            <SidebarItem
              id="nav-profile"
              active={currentView === View.PROFILE}
              onClick={() => onChangeView(View.PROFILE)}
              icon={<Icons.User className="w-5 h-5" />}
              label="Profile & Budgets"
            />
          </nav>
        </div>

        {/* Sidebar Footer User Card & Shortcuts */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Icons.Keyboard className="w-3.5 h-3.5" />
                <span>Shortcuts</span>
              </span>
              <kbd className="text-[10px] font-mono font-bold bg-slate-100 px-1 rounded border border-slate-200">?</kbd>
            </button>
          )}

          {user && (
            <button
              onClick={() => onChangeView(View.PROFILE)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-slate-200/60 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-brand-600">Lvl {Math.floor(user.points / 100) + 1}</span>
                  {user.currentStreak > 0 && (
                    <span className="text-orange-500 font-bold flex items-center">
                      🔥 {user.currentStreak}d
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT WRAPPER */}
      {/* ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Header Top Bar */}
        <header className="hidden md:flex h-16 px-6 lg:px-10 border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-30 items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Button */}
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                <Icons.Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search (Ctrl+K)</span>
              </button>
            )}

            {/* Currency Pill */}
            <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200/60">
              Currency: <span className="text-slate-900 font-bold">{currencySymbol} {user?.currency || 'INR'}</span>
            </div>

            {/* Top Quick Add */}
            {onOpenAddModal && (
              <button
                onClick={onOpenAddModal}
                className="py-1.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Icons.Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>New Transaction</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 pb-28 md:pb-12">
          {children}
        </main>
      </div>

      {/* ============================================================ */}
      {/* MOBILE BOTTOM NAVIGATION (Visible only on < md screens) */}
      {/* ============================================================ */}
      <nav
        id="main-nav"
        className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl p-1.5 flex justify-around items-center z-50"
      >
        <NavButton
          id="nav-home"
          active={currentView === View.DASHBOARD}
          onClick={() => onChangeView(View.DASHBOARD)}
          icon={<Icons.Home />}
          label="Home"
        />
        <NavButton
          id="nav-transactions"
          active={currentView === View.TRANSACTIONS}
          onClick={() => onChangeView(View.TRANSACTIONS)}
          icon={<Icons.List />}
          label="Ledger"
        />
        <NavButton
          id="nav-analytics"
          active={currentView === View.ANALYTICS}
          onClick={() => onChangeView(View.ANALYTICS)}
          icon={<Icons.Chart />}
          label="Insights"
        />
        <NavButton
          id="nav-profile"
          active={currentView === View.PROFILE}
          onClick={() => onChangeView(View.PROFILE)}
          icon={<Icons.User />}
          label="Profile"
        />
      </nav>
    </div>
  );
};

// Sidebar Navigation Item for Desktop
const SidebarItem = ({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    id={id}
    onClick={onClick}
    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-brand-50 text-brand-700 shadow-sm border border-brand-200/60'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`}
  >
    <div className={`${active ? 'text-brand-600 stroke-[2.5px]' : 'text-slate-400 stroke-[2px]'}`}>
      {icon}
    </div>
    <span>{label}</span>
  </button>
);

// Bottom Mobile Navigation Button
const NavButton = ({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id?: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    id={id}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 flex-1 ${
      active ? 'text-brand-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
    }`}
  >
    <div className={`w-5 h-5 mb-1 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`}>
      {icon}
    </div>
    <span className="text-[10px] leading-tight">{label}</span>
  </button>
);

export default Layout;

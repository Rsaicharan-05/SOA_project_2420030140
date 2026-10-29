import React, { useMemo } from 'react';
import { Transaction, UserProfile, BudgetPeriod } from '../types';
import { formatCurrency, formatDate, CATEGORY_COLORS, CATEGORY_EMOJIS } from '../constants';
import { Icons } from '../components/Icons';

interface Props {
  user: UserProfile;
  expenses: Transaction[]; 
  onAddClick: () => void;
  onDeleteExpense: (id: string) => void;
  onViewAll?: () => void;
  onOpenCommandPalette?: () => void;
}

const Dashboard: React.FC<Props> = ({ 
  user, 
  expenses: transactions, 
  onAddClick, 
  onDeleteExpense, 
  onViewAll,
  onOpenCommandPalette
}) => {
  const currentCurrency = user.currency || 'INR';

  // Financial Summary Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  // Savings rate
  const netSavingsRate = totalIncome > 0 
    ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) 
    : null;

  // Weekly Challenge Calculation (Monday as start of week)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };
  
  const startOfWeek = getStartOfWeek(new Date());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const weeklyTransactionCount = transactions.filter(t => new Date(t.date) >= startOfWeek).length;
  const weeklyGoal = 5;
  const weeklyProgress = Math.min((weeklyTransactionCount / weeklyGoal) * 100, 100);

  // Budget Calculations
  const getBudgetStart = (period: BudgetPeriod) => {
    const now = new Date();
    if (period === 'weekly') return getStartOfWeek(now);
    if (period === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'yearly') return new Date(now.getFullYear(), 0, 1);
    return new Date();
  };

  const budgetStart = getBudgetStart(user.budget?.period || 'monthly');
  budgetStart.setHours(0, 0, 0, 0);

  const periodExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= budgetStart);
  
  const totalPeriodSpent = periodExpenses.reduce((sum, t) => sum + t.amount, 0);
  const budgetAmount = user.budget?.amount || 0;
  const budgetProgress = budgetAmount > 0 ? (totalPeriodSpent / budgetAmount) * 100 : 0;
  const remainingBudget = Math.max(0, budgetAmount - totalPeriodSpent);
  const isBudgetExceeded = budgetAmount > 0 && totalPeriodSpent > budgetAmount;
  const overSpentAmount = totalPeriodSpent - budgetAmount;
  const budgetColor = isBudgetExceeded ? 'bg-red-500' : budgetProgress > 80 ? 'bg-orange-500' : 'bg-brand-500';

  // Days remaining in month & safe daily spend
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - today.getDate() + 1);
  const dailyAllowance = budgetAmount > 0 
    ? Math.max(0, Math.round(remainingBudget / daysRemaining)) 
    : 0;

  const monthProgressPercent = Math.round((today.getDate() / daysInMonth) * 100);
  const isPaceAhead = budgetAmount > 0 && budgetProgress > monthProgressPercent + 12;

  // Category specific budget progress
  const categoryLimits = user.budget?.categoryLimits || {};
  const categoryBudgets = Object.entries(categoryLimits)
    .map(([cat, limit]) => {
      const spent = periodExpenses
        .filter(t => t.category === cat)
        .reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, limit: Number(limit), spent };
    })
    .filter(item => item.spent > 0 || item.limit > 0)
    .sort((a, b) => (b.spent / (b.limit || 1)) - (a.spent / (a.limit || 1)));

  // Account balances calculation
  const accountBalances = useMemo(() => {
    const accounts = user.accounts || [];
    return accounts.map(account => {
      const accountTransactions = transactions.filter(t => t.accountId === account.id);
      const income = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const balance = income - expense;
      return { account, balance, income, expense };
    });
  }, [user.accounts, transactions]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 animate-fade-in pb-28">
      {/* Top Welcome Header & Command Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/60">
              AI EXPENSE TRACKING
            </span>
            <span className="text-xs text-slate-400">• Personal Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Here is a summary of your recent finances and budget health.
          </p>
        </div>

        {/* Quick Command Bar & Streak Pill */}
        <div className="flex items-center gap-3 flex-wrap">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-2.5 bg-white border border-slate-200 hover:border-slate-300 px-3.5 py-2 rounded-2xl shadow-xs text-slate-500 hover:text-slate-800 transition-all cursor-pointer text-xs font-medium"
            >
              <Icons.Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search or type a command...</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono border border-slate-200 font-bold">
                Ctrl K
              </kbd>
            </button>
          )}

          {user.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border border-orange-200/60 px-3.5 py-2 rounded-2xl font-bold text-xs shadow-xs">
              <Icons.Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
              <span>{user.currentStreak} Day Streak</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 bg-white border border-slate-200/80 px-3.5 py-2 rounded-2xl shadow-xs">
            <span className="text-xl">{user.avatar}</span>
            <span className="text-xs font-bold text-slate-700">{user.name}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TOP STAT CARDS (Responsive Grid: 1 col on mobile, 2 on tablet, 4 on desktop) */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Net Balance */}
        <div 
          id="dashboard-balance-card" 
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[160px]"
        >
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Total Balance</span>
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Icons.Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className={`text-2xl sm:text-3xl font-extrabold mt-1 ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(balance, currentCurrency)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Net position across all accounts
            </p>
          </div>
          <div className="text-[11px] font-semibold pt-2 border-t border-slate-50 flex items-center justify-between">
            <span className="text-slate-400">Cashflow Status</span>
            {netSavingsRate !== null ? (
              <span className={netSavingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {netSavingsRate >= 0 ? `+${netSavingsRate}% Saved` : `${netSavingsRate}% Deficit`}
              </span>
            ) : (
              <span className="text-slate-500">Neutral</span>
            )}
          </div>
        </div>

        {/* Card 2: Period Budget Status & Safe Daily Allowance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>{user.budget?.period || 'Monthly'} Budget</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                budgetAmount === 0 ? 'bg-slate-100 text-slate-500' :
                isBudgetExceeded ? 'bg-rose-100 text-rose-700' :
                isPaceAhead ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {budgetAmount === 0 ? 'Not set' : isBudgetExceeded ? 'Exceeded' : isPaceAhead ? 'Pacing Fast' : 'On Track'}
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {budgetAmount > 0 ? formatCurrency(remainingBudget, currentCurrency) : 'No Budget'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {budgetAmount > 0 
                ? (isBudgetExceeded ? `Over by ${formatCurrency(overSpentAmount, currentCurrency)}` : `${formatCurrency(totalPeriodSpent, currentCurrency)} spent so far`)
                : 'Set a limit in Profile'}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-50 flex items-center justify-between font-medium">
            <span>Safe Daily Spend</span>
            <span className="font-bold text-slate-800">
              {budgetAmount > 0 ? `${formatCurrency(dailyAllowance, currentCurrency)}/day` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Income */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Total Inflow</span>
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Icons.ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(totalIncome, currentCurrency)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {transactions.filter(t => t.type === 'income').length} recorded deposits
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-50">
            Recorded to cash & bank accounts
          </div>
        </div>

        {/* Card 4: Total Expenses */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between min-h-[160px]">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>Total Outflow</span>
              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Icons.ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
              {formatCurrency(totalExpense, currentCurrency)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {periodExpenses.length} expenses in current period
            </p>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-50">
            Tracked across categories
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN TWO-COLUMN DASHBOARD GRID */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Balances & Recent Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Account Balances Widget */}
          {accountBalances.length > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Account Balances</h3>
                  <p className="text-xs text-slate-400">
                    Manual record labels for categorizing transactions
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded self-start sm:self-auto">
                  Manual Tracking
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {accountBalances.map(({ account, balance, income, expense }) => {
                  const accountIcon =
                    account.type === 'cash' ? '💵' :
                    account.type === 'bank' ? '🏦' :
                    account.type === 'credit' ? '💳' : '📊';
                  return (
                    <div
                      key={account.id}
                      className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl">{accountIcon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{account.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">
                            {account.type}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xl font-extrabold ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                          {formatCurrency(balance, currentCurrency)}
                        </p>
                        <div className="flex justify-between text-[11px] pt-1.5 border-t border-slate-200/50">
                          <span className="text-emerald-600 font-semibold">+{formatCurrency(income, currentCurrency)}</span>
                          <span className="text-rose-500 font-semibold">-{formatCurrency(expense, currentCurrency)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Activity List */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                <p className="text-xs text-slate-400">Latest recorded transactions</p>
              </div>
              {onViewAll && (
                <button
                  type="button"
                  onClick={onViewAll}
                  className="text-xs text-brand-600 hover:text-brand-700 font-bold hover:underline cursor-pointer"
                >
                  View All ({transactions.length}) →
                </button>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm font-semibold text-slate-600">No transactions recorded yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Click the button below or scan a receipt with AI to add your first transaction.
                </p>
                <button
                  type="button"
                  onClick={onAddClick}
                  className="mt-4 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Add First Transaction
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {transactions.slice(0, 6).map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/50 transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${CATEGORY_COLORS[t.category]}20` }}
                      >
                        {CATEGORY_EMOJIS[t.category] || '📦'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{t.title}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <span>{formatDate(t.date)}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">{t.category}</span>
                          {t.accountId && user.accounts && (
                            <>
                              <span>•</span>
                              <span className="text-[11px] text-slate-500">
                                {user.accounts.find(a => a.id === t.accountId)?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`text-right font-bold text-sm sm:text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currentCurrency)}
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        aria-label="Delete record"
                      >
                        <Icons.Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Budgets & Challenge Widgets (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Add Action Banner */}
          <div className="bg-gradient-to-br from-brand-600 to-sky-600 rounded-3xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-md">
                Fast Record
              </span>
              <h3 className="text-xl font-bold">Track a New Transaction</h3>
              <p className="text-xs text-sky-100 leading-relaxed">
                Log manual payments or let Google Gemini automatically scan and parse your receipt.
              </p>
              <button
                id="dashboard-add-btn"
                type="button"
                onClick={onAddClick}
                className="w-full py-3.5 bg-white text-brand-700 hover:bg-sky-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Icons.Plus className="w-4 h-4 stroke-[3]" />
                <span>Add / Scan Transaction</span>
              </button>
            </div>
          </div>

          {/* Budget Widget with Category Breakdown & Daily Pace */}
          {budgetAmount > 0 && (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Budget Progress</h3>
                  <p className="text-xs text-slate-400 capitalize">{user.budget.period} spending limits</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isBudgetExceeded ? 'bg-rose-100 text-rose-700' : 'bg-brand-50 text-brand-700'
                }`}>
                  {isBudgetExceeded ? 'Limit Exceeded' : `${Math.round(budgetProgress)}% used`}
                </span>
              </div>

              {/* Overall Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-slate-600">Total Spent</span>
                  <span className="text-slate-900 font-bold">
                    {formatCurrency(totalPeriodSpent, currentCurrency)} / {formatCurrency(budgetAmount, currentCurrency)}
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${budgetColor}`}
                    style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Safe Daily Pace Card */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Safe Daily Spend</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {formatCurrency(dailyAllowance, currentCurrency)} / day
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Days Left</span>
                  <span className="font-semibold text-slate-600">
                    {daysRemaining} days in month
                  </span>
                </div>
              </div>

              {/* Category Limits List */}
              {categoryBudgets.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Category Breakdown
                  </p>
                  {categoryBudgets.map(cb => {
                    const pct = cb.limit > 0 ? (cb.spent / cb.limit) * 100 : 0;
                    const isOver = cb.limit > 0 && cb.spent > cb.limit;
                    return (
                      <div key={cb.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <span>{CATEGORY_EMOJIS[cb.category as keyof typeof CATEGORY_EMOJIS] || '📦'}</span>
                            <span>{cb.category}</span>
                          </span>
                          <span className={isOver ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {formatCurrency(cb.spent, currentCurrency)}
                            {cb.limit > 0 && ` / ${formatCurrency(cb.limit, currentCurrency)} (${Math.round(pct)}%)`}
                          </span>
                        </div>
                        {cb.limit > 0 && (
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-400' : 'bg-brand-500'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Weekly Quest Challenge Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Icons.Target className="w-4 h-4 text-white/90" />
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-100">Weekly Quest</span>
              </div>
              <p className="text-sm font-semibold text-white">Log {weeklyGoal} transactions this week</p>
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-700"
                  style={{ width: `${weeklyProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="ml-5 text-center min-w-[50px]">
              <span className="text-2xl font-black">{weeklyTransactionCount}/{weeklyGoal}</span>
              {weeklyProgress >= 100 && (
                <span className="block text-[10px] font-extrabold bg-white text-purple-700 px-2 py-0.5 rounded-full mt-1">
                  DONE ✨
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

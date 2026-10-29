import React, { useState, useMemo } from 'react';
import { Transaction, UserProfile, Category } from '../types';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_EMOJIS, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { Icons } from '../components/Icons';
import CsvImportModal from '../components/CsvImportModal';

interface Props {
  user: UserProfile;
  expenses: Transaction[];
  onDeleteExpense: (id: string) => void;
  onOpenAddModal?: () => void;
  onImportTransactions?: (imported: Omit<Transaction, 'id'>[]) => void;
  onBatchDelete?: (ids: string[]) => void;
}

type FilterType = 'all' | 'income' | 'expense';
type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateRangePreset = 'all' | 'this-month' | 'last-30' | 'this-week';

const Transactions: React.FC<Props> = ({ 
  user, 
  expenses: transactions, 
  onDeleteExpense, 
  onOpenAddModal,
  onImportTransactions,
  onBatchDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [sortType, setSortType] = useState<SortType>('date-desc');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const currentCurrency = user.currency || 'INR';
  const accounts = user.accounts || [];

  // Available categories based on selected type
  const availableCategories = useMemo(() => {
    if (filterType === 'expense') return EXPENSE_CATEGORIES;
    if (filterType === 'income') return INCOME_CATEGORIES;
    return Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));
  }, [filterType]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    // Filter by account
    if (selectedAccount !== 'all') {
      result = result.filter(t => t.accountId === selectedAccount);
    }

    // Filter by date preset
    if (datePreset !== 'all') {
      const now = new Date();
      result = result.filter(t => {
        const d = new Date(t.date);
        if (datePreset === 'this-month') {
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }
        if (datePreset === 'last-30') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return d >= thirtyDaysAgo;
        }
        if (datePreset === 'this-week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const startOfWeek = new Date(now.setDate(diff));
          startOfWeek.setHours(0, 0, 0, 0);
          return d >= startOfWeek;
        }
        return true;
      });
    }

    // Sort
    const sorted = [...result].sort((a, b) => {
      switch (sortType) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [transactions, searchQuery, filterType, selectedCategory, selectedAccount, datePreset, sortType]);

  // Financial summary of filtered transactions
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredAndSortedTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredAndSortedTransactions.length
    };
  }, [filteredAndSortedTransactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    filteredAndSortedTransactions.forEach(t => {
      const d = new Date(t.date);
      const dateStr = d.toDateString();
      let label: string;

      if (dateStr === today) {
        label = 'Today';
      } else if (dateStr === yesterday) {
        label = 'Yesterday';
      } else {
        label = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });

    return groups;
  }, [filteredAndSortedTransactions]);

  const hasActiveFilters = searchQuery.trim() !== '' || 
    filterType !== 'all' || 
    selectedCategory !== 'all' || 
    selectedAccount !== 'all' ||
    datePreset !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedCategory('all');
    setSelectedAccount('all');
    setDatePreset('all');
    setSortType('date-desc');
    setSelectedIds(new Set());
  };

  const getAccountInfo = (accountId?: string) => {
    if (!accountId) return null;
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return null;
    const icon = acc.type === 'cash' ? '💵' : acc.type === 'bank' ? '🏦' : acc.type === 'credit' ? '💳' : '📊';
    return { name: acc.name, icon };
  };

  const toggleSelectTransaction = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedTransactions.map(t => t.id)));
    }
  };

  const handleExecuteBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} transactions?`)) {
      if (onBatchDelete) {
        onBatchDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDeleteExpense(id));
      }
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in pb-28">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Transactions</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review, search, filter, and batch manage your records
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Import CSV Button */}
          <button
            type="button"
            onClick={() => setIsCsvModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
          >
            <Icons.FileSpreadsheet className="w-4 h-4" />
            <span>Import CSV</span>
          </button>

          {/* Quick Add Button */}
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-brand-500/20"
            >
              <Icons.Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          )}

          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
            {filteredAndSortedTransactions.length} of {transactions.length} records
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 space-y-4">
        {/* Search bar + Type toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-7 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Icons.Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by merchant, title, or category..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Switcher */}
          <div className="md:col-span-5 flex bg-gray-100 p-1 rounded-xl">
            {(['all', 'income', 'expense'] as FilterType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFilterType(type);
                  setSelectedCategory('all');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all capitalize cursor-pointer ${
                  filterType === type
                    ? type === 'income'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white text-slate-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Icons.Calendar className="w-3.5 h-3.5" />
            Period:
          </span>
          {(['all', 'this-month', 'last-30', 'this-week'] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setDatePreset(preset)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                datePreset === preset
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset === 'all' ? 'All Time' : preset === 'this-month' ? 'This Month' : preset === 'last-30' ? 'Last 30 Days' : 'This Week'}
            </button>
          ))}
        </div>

        {/* Category, Account, and Sort Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-50">
          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {CATEGORY_EMOJIS[cat] || '📦'} {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Account Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Account Label
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            >
              <option value="all">All Accounts</option>
              {accounts.map(acc => {
                const icon = acc.type === 'cash' ? '💵' : acc.type === 'bank' ? '🏦' : acc.type === 'credit' ? '💳' : '📊';
                return (
                  <option key={acc.id} value={acc.id}>
                    {icon} {acc.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Sort Order
            </label>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtered Summary Metrics Bar */}
      {filteredAndSortedTransactions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="px-2 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Filtered Records</span>
              <span className="text-base sm:text-lg font-bold text-slate-800">
                {filteredSummary.count}
              </span>
            </div>
            {filteredAndSortedTransactions.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-brand-600 hover:underline font-semibold"
              >
                {selectedIds.size === filteredAndSortedTransactions.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          <div className="px-2 border-l border-gray-100">
            <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider block">Total Income</span>
            <span className="text-base sm:text-lg font-bold text-emerald-600">
              {formatCurrency(filteredSummary.income, currentCurrency)}
            </span>
          </div>
          <div className="px-2 border-l border-gray-100">
            <span className="text-[11px] font-medium text-rose-500 uppercase tracking-wider block">Total Expenses</span>
            <span className="text-base sm:text-lg font-bold text-rose-500">
              {formatCurrency(filteredSummary.expense, currentCurrency)}
            </span>
          </div>
          <div className="px-2 border-l border-gray-100 col-span-2 md:col-span-1">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block">Net Filtered</span>
            <span className={`text-base sm:text-lg font-bold ${filteredSummary.net >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              {formatCurrency(filteredSummary.net, currentCurrency)}
            </span>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {filteredAndSortedTransactions.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-200 space-y-3">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Icons.Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No transactions match your criteria</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {hasActiveFilters 
              ? 'Try adjusting your search terms or clearing filters to see more transactions.'
              : 'You have not recorded any transactions yet. Record your daily income or expenses.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
              >
                <Icons.FileSpreadsheet className="w-4 h-4" />
                <span>Import CSV File</span>
              </button>
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-sm shadow-brand-500/20"
                >
                  <Icons.Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Record a Transaction</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([dateKey, dateTransactions]) => (
            <div key={dateKey} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-bold text-gray-500">
                  {dateKey}
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  {dateTransactions.length} {dateTransactions.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>

              <div className="space-y-2">
                {dateTransactions.map((transaction) => {
                  const accountInfo = getAccountInfo(transaction.accountId);
                  const isIncome = transaction.type === 'income';
                  const isSelected = selectedIds.has(transaction.id);

                  return (
                    <div
                      key={transaction.id}
                      className={`bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border shadow-sm hover:shadow-md transition-all group ${
                        isSelected ? 'border-brand-500 bg-brand-50/20 ring-1 ring-brand-500' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Checkbox for batch selection */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectTransaction(transaction.id)}
                          className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                        />

                        {/* Category Icon */}
                        <div
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl flex-shrink-0"
                          style={{ backgroundColor: `${CATEGORY_COLORS[transaction.category] || '#94a3b8'}20` }}
                        >
                          {CATEGORY_EMOJIS[transaction.category] || '📦'}
                        </div>

                        {/* Middle Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <h4 className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                              {transaction.title}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                              {transaction.category}
                            </span>

                            {accountInfo && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                <span>{accountInfo.icon}</span>
                                <span>{accountInfo.name}</span>
                              </span>
                            )}

                            <span className="text-[11px] text-gray-400">
                              {new Date(transaction.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {transaction.notes && (
                            <p className="text-xs text-gray-400 mt-1 truncate italic">
                              "{transaction.notes}"
                            </p>
                          )}
                        </div>

                        {/* Amount & Delete */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className="text-right">
                            <div className={`flex items-center justify-end font-bold text-sm sm:text-base ${isIncome ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {isIncome ? (
                                <Icons.ArrowUpRight className="w-4 h-4 mr-0.5 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Icons.ArrowDownRight className="w-4 h-4 mr-0.5 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="whitespace-nowrap">
                                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currentCurrency)}
                              </span>
                            </div>
                            <span className={`text-[10px] font-medium uppercase tracking-wider ${isIncome ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {transaction.type}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => onDeleteExpense(transaction.id)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                            aria-label={`Delete ${transaction.title}`}
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-scale-up border border-slate-700 text-xs sm:text-sm">
          <span className="font-bold text-brand-300">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-slate-700"></div>
          <button
            type="button"
            onClick={handleSelectAll}
            className="hover:text-brand-300 font-semibold cursor-pointer"
          >
            {selectedIds.size === filteredAndSortedTransactions.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            type="button"
            onClick={handleExecuteBatchDelete}
            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <Icons.Trash className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImport={(imported) => {
          if (onImportTransactions) onImportTransactions(imported);
        }}
        currency={currentCurrency}
      />
    </div>
  );
};

export default Transactions;

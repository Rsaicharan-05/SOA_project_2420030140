import React, { useState, useEffect, useRef } from 'react';
import { View, Transaction, UserProfile } from '../types';
import { Icons } from './Icons';
import { formatCurrency, CATEGORY_EMOJIS } from '../constants';

interface ActionItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  category: 'Navigation' | 'Actions' | 'Exports';
  run: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onChangeView: (view: View) => void;
  onOpenAddModal: (initialType?: 'expense' | 'income') => void;
  transactions: Transaction[];
  user: UserProfile | null;
  onOpenShortcuts: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
}

const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onChangeView,
  onOpenAddModal,
  transactions,
  user,
  onOpenShortcuts,
  onExportExcel,
  onExportPDF,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: ActionItem[] = [
    {
      id: 'add-expense',
      title: 'Add New Expense',
      subtitle: 'Record an outflow or scan a receipt',
      icon: <Icons.Plus className="w-4 h-4 text-rose-500" />,
      category: 'Actions',
      run: () => { onOpenAddModal('expense'); onClose(); },
    },
    {
      id: 'add-income',
      title: 'Add New Income',
      subtitle: 'Record salary, freelance, or gift',
      icon: <Icons.Plus className="w-4 h-4 text-emerald-500" />,
      category: 'Actions',
      run: () => { onOpenAddModal('income'); onClose(); },
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'Overview, balances, and quick budget',
      icon: <Icons.Home className="w-4 h-4 text-brand-600" />,
      category: 'Navigation',
      run: () => { onChangeView(View.DASHBOARD); onClose(); },
    },
    {
      id: 'nav-transactions',
      title: 'Go to Transactions',
      subtitle: 'Review, search, filter, and delete entries',
      icon: <Icons.List className="w-4 h-4 text-brand-600" />,
      category: 'Navigation',
      run: () => { onChangeView(View.TRANSACTIONS); onClose(); },
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics & AI Insights',
      subtitle: 'Spending charts, category donut & AI Coach',
      icon: <Icons.Chart className="w-4 h-4 text-brand-600" />,
      category: 'Navigation',
      run: () => { onChangeView(View.ANALYTICS); onClose(); },
    },
    {
      id: 'nav-profile',
      title: 'Go to Profile & Budgets',
      subtitle: 'Manage budget limits, gamification, and accounts',
      icon: <Icons.User className="w-4 h-4 text-brand-600" />,
      category: 'Navigation',
      run: () => { onChangeView(View.PROFILE); onClose(); },
    },
    {
      id: 'export-excel',
      title: 'Export to Excel (.xlsx)',
      subtitle: 'Download complete transaction history',
      icon: <Icons.FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
      category: 'Exports',
      run: () => { onExportExcel(); onClose(); },
    },
    {
      id: 'export-pdf',
      title: 'Export to PDF Statement',
      subtitle: 'Generate printable visual expense summary',
      icon: <Icons.Download className="w-4 h-4 text-rose-600" />,
      category: 'Exports',
      run: () => { onExportPDF(); onClose(); },
    },
    {
      id: 'shortcuts',
      title: 'View Keyboard Shortcuts',
      subtitle: 'Show cheat sheet (? shortcut)',
      icon: <Icons.Keyboard className="w-4 h-4 text-indigo-500" />,
      category: 'Actions',
      run: () => { onOpenShortcuts(); onClose(); },
    },
  ];

  // Filter actions based on query
  const filteredActions = query.trim()
    ? actions.filter(a =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(query.toLowerCase()))
      )
    : actions;

  // Search matching transactions if user types
  const matchingTransactions = query.trim().length >= 2
    ? transactions
        .filter(t => 
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase()) ||
          (t.notes && t.notes.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const totalItemsCount = filteredActions.length + matchingTransactions.length;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItemsCount));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItemsCount) % Math.max(1, totalItemsCount));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredActions.length) {
        filteredActions[selectedIndex]?.run();
      } else {
        // Selected a transaction
        const txIndex = selectedIndex - filteredActions.length;
        if (matchingTransactions[txIndex]) {
          onChangeView(View.TRANSACTIONS);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-16 sm:pt-24 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[80vh] animate-scale-up"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Icons.Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search transactions..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-800 placeholder-gray-400 outline-none"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 rounded border border-gray-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-gray-50 flex-1 no-scrollbar">
          {totalItemsCount === 0 && (
            <div className="py-12 text-center text-gray-400 text-xs">
              No matching commands or transactions found for "{query}"
            </div>
          )}

          {/* Quick Actions & Navigation */}
          {filteredActions.length > 0 && (
            <div className="space-y-0.5">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Commands & Shortcuts
              </div>
              {filteredActions.map((action, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.run}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-brand-50 text-brand-900 font-semibold' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{action.title}</p>
                        {action.subtitle && (
                          <p className="text-[11px] text-gray-400 truncate">{action.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                      {action.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Matching Transactions */}
          {matchingTransactions.length > 0 && (
            <div className="space-y-0.5 pt-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Matching Transactions ({matchingTransactions.length})
              </div>
              {matchingTransactions.map((tx, idx) => {
                const overallIdx = filteredActions.length + idx;
                const isSelected = selectedIndex === overallIdx;
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => { onChangeView(View.TRANSACTIONS); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(overallIdx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected ? 'bg-brand-50 text-brand-900 font-semibold' : 'hover:bg-gray-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{CATEGORY_EMOJIS[tx.category] || '💳'}</span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">{tx.title}</p>
                        <p className="text-[11px] text-gray-400">{tx.category} • {new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency || 'INR')}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>AI EXPENSE TRACKING</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

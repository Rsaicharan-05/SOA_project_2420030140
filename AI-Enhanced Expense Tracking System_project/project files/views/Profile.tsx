import React, { useState, useRef } from 'react';
import saveAs from 'file-saver';
import { UserProfile, Transaction, BudgetPeriod, Account } from '../types';
import { BADGES, AVATAR_LIST, CURRENCIES, EXPENSE_CATEGORIES } from '../constants';
import { Icons } from '../components/Icons';
import { exportToPDF, exportToExcel } from '../services/exportService';
import { exportBackup, importBackup, validateBackupData } from '../services/storageService';

interface Props {
  user: UserProfile;
  expenses: Transaction[]; 
  onUpdateUser: (user: UserProfile) => void;
}

const Profile: React.FC<Props> = ({ user, expenses: transactions, onUpdateUser }) => {
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<Account['type']>('bank');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChangeAvatar = (emoji: string) => {
    const updated = { ...user, avatar: emoji };
    onUpdateUser(updated);
  };

  const handleChangeCurrency = (code: string) => {
    const updated = { ...user, currency: code };
    onUpdateUser(updated);
  };

  const handleUpdateBudget = (field: keyof UserProfile['budget'], value: any) => {
    const updatedUser = {
      ...user,
      budget: {
        ...user.budget,
        [field]: value
      }
    };
    onUpdateUser(updatedUser);
  };

  const handleUpdateCategoryLimit = (category: string, value: number) => {
    const newLimits = { ...user.budget.categoryLimits };
    if (value > 0) {
      newLimits[category] = value;
    } else {
      delete newLimits[category];
    }
    
    onUpdateUser({
      ...user,
      budget: {
        ...user.budget,
        categoryLimits: newLimits
      }
    });
  };

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    
    const accounts = user.accounts || [];
    const uniqueId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : 'acc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);

    const newAccount: Account = {
      id: uniqueId,
      name: newAccountName.trim(),
      type: newAccountType,
      color: newAccountType === 'cash' ? '#10b981' : newAccountType === 'bank' ? '#3b82f6' : newAccountType === 'credit' ? '#f59e0b' : '#8b5cf6'
    };
    
    onUpdateUser({
      ...user,
      accounts: [...accounts, newAccount]
    });
    
    setNewAccountName('');
    setIsAddingAccount(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    const accounts = user.accounts || [];
    if (accounts.length <= 1) {
      alert('You need at least one account label for tracking.');
      return;
    }
    
    const hasTransactions = transactions.some(t => t.accountId === accountId);
    if (hasTransactions) {
      if (!confirm('This account label is associated with existing transactions. Deleting it will detach the account label from those transactions. Proceed?')) {
        return;
      }
    }
    
    onUpdateUser({
      ...user,
      accounts: accounts.filter(a => a.id !== accountId)
    });
  };

  const handleEditAccount = (accountId: string, newName: string) => {
    const accounts = user.accounts || [];
    onUpdateUser({
      ...user,
      accounts: accounts.map(a => a.id === accountId ? { ...a, name: newName.trim() } : a)
    });
    setEditingAccountId(null);
  };

  const getAccountTypeIcon = (type: Account['type']) => {
    switch (type) {
      case 'cash': return '💵';
      case 'bank': return '🏦';
      case 'credit': return '💳';
      default: return '📊';
    }
  };

  const accounts = user.accounts || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in pb-28">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Profile & Preferences</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage budgets, manual account labels, currency, backups, and unlocked achievements
        </p>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: User, Avatars, Badges (Desktop 5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* User Profile Card */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5">
            <div className="text-5xl sm:text-6xl relative flex-shrink-0">
              {user.avatar}
              <div className="absolute -bottom-1 -right-1 bg-brand-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                Lvl {Math.floor(user.points / 100) + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{user.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Member since {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                  🏆 {user.points} Pts
                </span>
                <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1 rounded-full text-xs font-bold">
                  🔥 {user.currentStreak} Day Streak
                </span>
              </div>
            </div>
          </div>

          {/* Avatar Collection */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Icons.Avatar className="w-5 h-5 text-brand-500 flex-shrink-0" />
                Avatar Collection
              </h3>
              <span className="text-[11px] text-gray-400">Unlock via tracking</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {AVATAR_LIST.map(item => {
                let isUnlocked = false;
                if (item.isDefault) isUnlocked = true;
                else if (item.unlockCondition?.type === 'points' && user.points >= (item.unlockCondition.value as number)) isUnlocked = true;
                else if (item.unlockCondition?.type === 'badge' && user.badges.includes(item.unlockCondition.value as string)) isUnlocked = true;

                const isCurrent = user.avatar === item.emoji;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => handleChangeAvatar(item.emoji)}
                    className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer ${
                      isCurrent ? 'border-brand-500 bg-brand-50 shadow-sm' : 
                      isUnlocked ? 'border-transparent bg-gray-50 shadow-sm hover:bg-gray-100' : 
                      'border-transparent bg-gray-100/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl sm:text-3xl mb-0.5">{item.emoji}</span>
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-gray-100/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                        <Icons.Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    {!isUnlocked && item.unlockCondition?.type === 'points' && (
                      <span className="absolute bottom-1 text-[8px] font-bold text-gray-600 bg-white/90 px-1 rounded shadow-xs">
                        {item.unlockCondition.value}pts
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Icons.Trophy className="w-5 h-5 text-brand-500 flex-shrink-0" />
                Badges & Streaks
              </h3>
              <span className="text-[11px] text-gray-400">
                {user.badges.length} of {BADGES.length} unlocked
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map(badge => {
                const isUnlocked = user.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isUnlocked 
                        ? 'bg-amber-50/50 border-amber-200 shadow-sm' 
                        : 'bg-gray-50 border-gray-100 opacity-60 grayscale'
                    }`}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <h4 className="font-bold text-xs text-slate-800">{badge.name}</h4>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset All Local Data */}
          <div className="bg-white p-4 rounded-3xl border border-red-100">
            <button 
              type="button"
              onClick={() => {
                if (confirm("Are you sure? This will permanently clear all local transactions and profile settings stored in your browser.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Reset All Local Browser Data
            </button>
          </div>
        </div>

        {/* Right Column: Budgets, Accounts, Currency, Export, Backup (Desktop 7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Budgeting Goals */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Icons.Target className="w-5 h-5 text-brand-500 flex-shrink-0" />
                Budget Limits & Cadence
              </h3>
              <span className="text-[11px] text-gray-400">Calculated locally</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Overall Budget Limit ({user.currency || 'INR'})
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="number" 
                  value={user.budget.amount > 0 ? user.budget.amount : ''} 
                  onChange={(e) => {
                    const value = e.target.value;
                    handleUpdateBudget('amount', value === '' ? 0 : parseFloat(value) || 0);
                  }}
                  placeholder="Set target amount (e.g. 25000)"
                  min="0"
                  step="0.01"
                  className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                />
                <select 
                  value={user.budget.period || 'monthly'}
                  onChange={(e) => handleUpdateBudget('period', e.target.value as BudgetPeriod)}
                  className="px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-sm w-full sm:w-auto"
                >
                  <option value="weekly">Weekly Budget</option>
                  <option value="monthly">Monthly Budget</option>
                  <option value="yearly">Yearly Budget</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-50">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Category Spending Caps (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EXPENSE_CATEGORIES.map(cat => (
                  <div key={cat} className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-xs text-slate-700 font-medium truncate">
                      {cat}
                    </span>
                    <input 
                      type="number"
                      placeholder="No limit"
                      value={user.budget.categoryLimits[cat] || ''}
                      onChange={(e) => handleUpdateCategoryLimit(cat, parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-right bg-white rounded-lg text-xs border border-gray-200 outline-none focus:ring-1 focus:ring-brand-500 font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Management (Manual Labels) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                  <Icons.Wallet className="w-5 h-5 text-brand-500 flex-shrink-0" />
                  Account Labels
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Custom tags for manual categorisation (Cash, Bank, Cards)</p>
              </div>
            </div>

            <div className="space-y-2">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {editingAccountId === account.id ? (
                    <div className="flex items-center gap-2 flex-1 w-full">
                      <span className="text-xl flex-shrink-0">{getAccountTypeIcon(account.type)}</span>
                      <input
                        type="text"
                        defaultValue={account.name}
                        onBlur={(e) => handleEditAccount(account.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditAccount(account.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingAccountId(null);
                          }
                        }}
                        autoFocus
                        className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-brand-300 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{getAccountTypeIcon(account.type)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 text-sm truncate">{account.name}</p>
                          <p className="text-[11px] text-gray-400 capitalize">{account.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingAccountId(account.id)}
                          className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          aria-label="Edit account"
                        >
                          <Icons.Edit className="w-4 h-4" />
                        </button>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(account.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            aria-label="Delete account"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {isAddingAccount ? (
                <div className="p-3 bg-brand-50 rounded-xl space-y-2 border border-brand-200">
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="Account label (e.g. Savings, Salary Account)"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    autoFocus
                  />
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as Account['type'])}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="bank">Bank Account (Manual)</option>
                    <option value="cash">Cash</option>
                    <option value="credit">Credit Card</option>
                    <option value="other">Other Account</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddAccount}
                      disabled={!newAccountName.trim()}
                      className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      Save Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAccount(false);
                        setNewAccountName('');
                      }}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(true)}
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-dashed border-gray-300 cursor-pointer"
                >
                  <Icons.Plus className="w-4 h-4" />
                  Add Custom Account Label
                </button>
              )}
            </div>
          </div>

          {/* Currency Preference */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Icons.Settings className="w-5 h-5 text-brand-500 flex-shrink-0" />
                Currency
              </h3>
              <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-md">
                Active: {user.currency || 'INR'}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {CURRENCIES.map(c => (
                <button 
                  key={c.code}
                  type="button"
                  onClick={() => handleChangeCurrency(c.code)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    user.currency === c.code 
                      ? 'border-brand-500 bg-brand-50 text-brand-700 font-bold shadow-sm' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="text-base font-bold">{c.symbol}</span>
                  <span className="text-[10px] font-medium">{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export & Data Management */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                <Icons.Download className="w-5 h-5 flex-shrink-0 text-brand-500" />
                Export & Backups
              </h3>
              <span className="text-xs text-gray-400">
                {transactions.length} records ready
              </span>
            </div>

            {/* Document Exports */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => exportToPDF(transactions, user)}
                disabled={transactions.length === 0}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-600 rounded-2xl transition-all border border-gray-200 disabled:opacity-50 cursor-pointer"
              >
                <Icons.Download className="w-4 h-4 text-red-500" />
                <span className="font-bold text-xs sm:text-sm">Export PDF</span>
              </button>

              <button 
                type="button"
                onClick={() => exportToExcel(transactions, user)}
                disabled={transactions.length === 0}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded-2xl transition-all border border-gray-200 disabled:opacity-50 cursor-pointer"
              >
                <Icons.Download className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs sm:text-sm">Export Excel</span>
              </button>
            </div>

            {/* JSON Backup & Validated Restore */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
              <button 
                type="button"
                onClick={() => {
                  try {
                    const backup = exportBackup();
                    const jsonString = JSON.stringify(backup, null, 2);
                    const blob = new Blob([jsonString], { type: 'application/json' });
                    const fileName = `ai-expense-tracking-backup-${new Date().toISOString().split('T')[0]}.json`;
                    saveAs(blob, fileName);
                    alert('Backup downloaded successfully!');
                  } catch (error) {
                    alert('Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 rounded-2xl transition-all border border-gray-200 cursor-pointer"
              >
                <Icons.Database className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-xs sm:text-sm">Save JSON</span>
              </button>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-600 rounded-2xl transition-all border border-gray-200 cursor-pointer"
              >
                <Icons.Upload className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-xs sm:text-sm">Restore JSON</span>
              </button>
            </div>

            {/* Hidden validated file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const jsonContent = event.target?.result as string;
                    let parsedData: any;
                    try {
                      parsedData = JSON.parse(jsonContent);
                    } catch {
                      throw new Error('The selected file is not a valid JSON document.');
                    }

                    // Execute robust schema validation
                    const validation = validateBackupData(parsedData);
                    if (!validation.isValid) {
                      alert(`❌ Invalid Backup File:\n\n${validation.error}\n\nYour existing data has NOT been modified.`);
                      return;
                    }

                    // Validated successfully: ask for final user consent
                    const confirmMessage = `✅ Valid backup verified!\nUser: ${validation.userName}\nTransactions: ${validation.transactionCount}\n\nRestoring this backup will replace current local data. Proceed?`;
                    
                    if (confirm(confirmMessage)) {
                      importBackup(parsedData);
                      alert('Data restored successfully!');
                      window.location.reload();
                    }
                  } catch (error) {
                    alert('Failed to import backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-xs text-gray-400 pt-6">
        AI EXPENSE TRACKING • Designed for calm, reliable local finance
      </div>
    </div>
  );
};

export default Profile;

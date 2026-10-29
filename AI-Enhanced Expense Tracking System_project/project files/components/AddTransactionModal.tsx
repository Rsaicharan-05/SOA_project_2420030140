import React, { useState, useRef, useEffect } from 'react';
import { Category, Transaction, TransactionType, Account } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCurrencySymbol } from '../constants';
import { Icons } from './Icons';
import { scanReceipt } from '../services/geminiService';
import { detectCategory } from '../services/categoryDetector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (transaction: Omit<Transaction, 'id'>) => void;
  currency: string;
  accounts?: Account[];
}

const AddTransactionModal: React.FC<Props> = ({ isOpen, onClose, onAdd, currency = 'INR', accounts = [] }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [autoDetected, setAutoDetected] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [aiScanSuccess, setAiScanSuccess] = useState<string | null>(null);
  const [aiScanError, setAiScanError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default account when accounts are loaded or modal opens
  useEffect(() => {
    if (isOpen) {
      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
      setAiScanSuccess(null);
      setAiScanError(null);
    }
  }, [isOpen, accounts]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const currencySymbol = getCurrencySymbol(currency);

  const handleClose = () => {
    setAmount('');
    setTitle('');
    setType('expense');
    setCategory('Food');
    setAutoDetected(null);
    setDate(new Date().toISOString().split('T')[0]);
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setNotes('');
    setAiScanSuccess(null);
    setAiScanError(null);
    setPreviewImage(null);
    onClose();
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const matched = detectCategory(val, type);
    if (matched) {
      setCategory(matched);
      setAutoDetected(matched);
    } else {
      setAutoDetected(null);
    }
  };

  const handleQuickAddAmount = (inc: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + inc).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      type,
      amount: parseFloat(amount),
      title: title.trim() || 'Untitled',
      category: category || currentCategories[0],
      date: new Date(date).toISOString(),
      accountId: accountId || undefined,
      notes: notes.trim() || undefined,
    });
    handleClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAiScanSuccess(null);
    setAiScanError(null);
    setType('expense');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      const mimeType = file.type || 'image/jpeg';
      const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;

      try {
        const data = await scanReceipt(base64Data, mimeType);
        if (data.amount !== undefined && data.amount !== null) {
          setAmount(data.amount.toString());
        }
        if (data.title) setTitle(data.title);
        if (data.date) setDate(data.date);
        if (data.category && EXPENSE_CATEGORIES.includes(data.category as Category)) {
          setCategory(data.category as Category);
        }
        setAiScanSuccess('Receipt details extracted via Gemini. Review and adjust below before saving.');
      } catch (err: any) {
        console.error('Scan error:', err);
        setAiScanError(err.message || 'Failed to scan receipt. Please enter transaction details manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto no-scrollbar border border-gray-100">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Add Transaction</h2>
            <p className="text-xs text-gray-400 mt-0.5">Record income or expense locally</p>
          </div>
          <button 
            type="button"
            onClick={handleClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => { setType('expense'); setCategory(EXPENSE_CATEGORIES[0]); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              type === 'expense' 
                ? 'bg-white text-rose-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => { setType('income'); setCategory(INCOME_CATEGORIES[0]); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              type === 'income' 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Income
          </button>
        </div>

        {/* AI Receipt Scanner Button */}
        {type === 'expense' && (
          <div className="mb-4">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all border border-dashed border-indigo-300 disabled:opacity-50 cursor-pointer text-sm"
            >
              {isScanning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse">Gemini is analyzing your receipt...</span>
                </div>
              ) : (
                <>
                  <Icons.Camera className="w-5 h-5 text-indigo-600" />
                  <span>Scan Receipt with Gemini AI</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />

            {/* Thumbnail and feedback */}
            {previewImage && (
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                <img 
                  src={previewImage} 
                  alt="Receipt Preview" 
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">Receipt photo attached</p>
                  <p className="text-[10px] text-gray-400">Processed locally for OCR</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-xs text-red-500 hover:underline px-2 py-1"
                >
                  Remove
                </button>
              </div>
            )}

            {/* AI Success Banner */}
            {aiScanSuccess && (
              <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 animate-fade-in">
                <span className="text-base flex-shrink-0">✨</span>
                <div className="flex-1">
                  <p className="font-semibold">{aiScanSuccess}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Details filled below. Modify any field if necessary.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiScanSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-900 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* AI Error Banner */}
            {aiScanError && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 animate-fade-in">
                <span className="text-base flex-shrink-0">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold">Receipt Scan Notice</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">{aiScanError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiScanError(null)}
                  className="text-amber-600 hover:text-amber-900 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transaction Entry Form */}
        <form 
          onSubmit={handleSubmit} 
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
          className="space-y-4"
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Amount
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Quick Presets</span>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">
                {currencySymbol}
              </span>
              <input 
                type="number" 
                step="0.01" 
                required 
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-bold text-slate-900 focus:bg-white focus:ring-2 outline-none transition-colors ${
                  type === 'income' ? 'focus:ring-emerald-500' : 'focus:ring-brand-500'
                }`} 
                placeholder="0.00"
              />
            </div>
            {/* Quick Amount Increment Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {[50, 100, 200, 500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  +{currencySymbol}{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="px-2 py-1 text-gray-400 hover:text-gray-600 text-[11px] font-medium ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Title / Merchant
              </label>
              {autoDetected && (
                <span className="text-[11px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fade-in">
                  ✨ Auto-detected: {autoDetected}
                </span>
              )}
            </div>
            <input 
              type="text" 
              required 
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 outline-none text-sm font-medium transition-colors ${
                type === 'income' ? 'focus:ring-emerald-500' : 'focus:ring-brand-500'
              }`}
              placeholder={type === 'income' ? 'e.g. Salary, Client payment' : 'e.g. Grocery Store, Cafe, Metro, Uber'} 
            />
          </div>

          {accounts.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {type === 'income' ? 'Deposit Account' : 'Paid From Account'}
                </label>
                <span className="text-[10px] text-gray-400">Manual tracking tag</span>
              </div>
              <select 
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
              >
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type === 'cash' ? '💵 Cash' : account.type === 'bank' ? '🏦 Bank' : account.type === 'credit' ? '💳 Card' : '📊 Other'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
              >
                {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Date
              </label>
              <input 
                type="date" 
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input 
              type="text" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-xs font-medium"
              placeholder="Add optional description or notes" 
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3.5 text-white rounded-2xl font-bold text-base shadow-lg mt-2 active:scale-[0.99] transition-all cursor-pointer ${
              type === 'income' 
                ? 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700' 
                : 'bg-brand-600 shadow-brand-200 hover:bg-brand-700'
            }`}
          >
            {type === 'income' ? 'Save Income' : 'Save Expense'}
          </button>
          
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Ctrl/⌘</span>
            <span>+</span>
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Enter</span>
            <span>to save quickly</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;

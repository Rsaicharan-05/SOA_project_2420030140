import React, { useEffect } from 'react';
import { Icons } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + K  /  ⌘K', desc: 'Open Command & Search Palette' },
  { key: 'N  /  +', desc: 'Quickly Add New Transaction' },
  { key: '1', desc: 'Jump to Dashboard' },
  { key: '2', desc: 'Jump to Transactions' },
  { key: '3', desc: 'Jump to Analytics & Insights' },
  { key: '4', desc: 'Jump to Profile & Budgets' },
  { key: 'Ctrl + Enter', desc: 'Submit and save transaction in modal' },
  { key: 'Esc', desc: 'Close any active modal or palette' },
  { key: '?', desc: 'Show this keyboard shortcuts guide' },
];

const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
              <Icons.Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Keyboard Shortcuts</h3>
              <p className="text-xs text-gray-400">Power user navigation tips</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 mt-4">
          {SHORTCUTS.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
              <span className="text-gray-600 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default ShortcutsModal;

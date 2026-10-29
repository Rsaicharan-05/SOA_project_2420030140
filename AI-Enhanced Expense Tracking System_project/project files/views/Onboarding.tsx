import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AVATAR_LIST } from '../constants';
import { Icons } from '../components/Icons';

interface Props {
  onComplete: (user: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  
  // Filter for default avatars
  const defaultAvatars = AVATAR_LIST.filter(a => a.isDefault);
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatars[0].emoji);

  const handleNext = () => {
    if (step === 1 && name.trim()) {
      setStep(2);
    } else if (step === 2) {
      onComplete({
        name: name.trim(),
        email: '',
        avatar: selectedAvatar,
        joinedDate: new Date().toISOString(),
        points: 50, // Welcome points
        badges: [],
        currency: 'INR', // Default to INR as requested
        currentStreak: 0,
        longestStreak: 0,
        lastTransactionDate: null,
        budget: {
          amount: 0,
          period: 'monthly',
          categoryLimits: {}
        },
        accounts: [
          { id: 'default-cash', name: 'Cash', type: 'cash', color: '#10b981' },
          { id: 'default-bank', name: 'Bank Account', type: 'bank', color: '#3b82f6' }
        ],
        hasCompletedTour: false // New users get the guided tour
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-gray-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-100">
          <Icons.Sparkles className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-1">
          AI EXPENSE TRACKING
        </h1>
        <p className="text-gray-500 mb-8 text-sm">Smart personal finance, offline-first & private.</p>

        {step === 1 && (
          <div className="w-full space-y-6 animate-slide-up">
            <div className="text-left">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                What should we call you?
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && name.trim()) handleNext();
                }}
                className="w-full px-5 py-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none text-base font-semibold transition-all"
                placeholder="Enter your name"
                autoFocus
              />
            </div>
            <button 
              type="button"
              onClick={handleNext}
              disabled={!name.trim()}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-base disabled:opacity-50 active:scale-[0.98] transition-all hover:bg-slate-800 shadow-md cursor-pointer"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full space-y-6 animate-slide-up">
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-800">Choose your initial avatar</h2>
              <p className="text-xs text-gray-400 mt-0.5">You can unlock more avatars later with points and streaks</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {defaultAvatars.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAvatar(item.emoji)}
                  className={`text-3xl p-3.5 rounded-2xl transition-all cursor-pointer ${
                    selectedAvatar === item.emoji
                      ? 'bg-brand-50 ring-2 ring-brand-500 scale-105 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
            <button 
              type="button"
              onClick={handleNext}
              className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold text-base shadow-lg shadow-brand-200 active:scale-[0.98] transition-all hover:bg-brand-700 cursor-pointer"
            >
              Start Tracking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;

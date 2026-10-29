import React, { useState, useEffect } from 'react';
import { View, UserProfile, Transaction } from './types';
import { getTransactions, getUser, saveTransaction, saveUser, deleteTransaction } from './services/storageService';
import { exportToExcel, exportToPDF } from './services/exportService';
import Layout from './components/Layout';
import Onboarding from './views/Onboarding';
import Dashboard from './views/Dashboard';
import Transactions from './views/Transactions';
import Analytics from './views/Analytics';
import Profile from './views/Profile';
import AddTransactionModal from './components/AddTransactionModal';
import CommandPalette from './components/CommandPalette';
import ShortcutsModal from './components/ShortcutsModal';
import Tour, { Step } from './components/Tour';

const TOUR_STEPS: Step[] = [
  {
    targetId: 'dashboard-balance-card',
    title: 'Financial Overview',
    content: 'This is your command center. See your total balance, income, and expenses at a glance in your preferred currency.'
  },
  {
    targetId: 'dashboard-add-btn',
    title: 'Track Expenses',
    content: 'Tap here to add a new transaction. You can manually record details or scan a receipt with AI!'
  },
  {
    targetId: 'nav-analytics',
    title: 'Smart Insights',
    content: 'Switch to the Insights tab to see visual charts and get AI-powered advice on your spending habits.'
  },
  {
    targetId: 'nav-profile',
    title: 'Gamification & Settings',
    content: 'Visit your profile to set budgets, export data to PDF/Excel, and unlock new avatars by earning points.'
  }
];

const generateTransactionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return 'tx_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.ONBOARDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial Load
    const loadedUser = getUser();
    const loadedTransactions = getTransactions();
    
    if (loadedUser) {
      setUser(loadedUser);
      setTransactions(loadedTransactions);
      setCurrentView(View.DASHBOARD);
    } else {
      setCurrentView(View.ONBOARDING);
    }
    setLoading(false);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable
      );

      // Ctrl + K or Cmd + K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (isInput) return;

      // N or +: Quick Add Transaction
      if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        setIsModalOpen(true);
        return;
      }

      // ?: Open Shortcuts Guide
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // 1-4: Switch Views
      if (e.key === '1') {
        setCurrentView(View.DASHBOARD);
      } else if (e.key === '2') {
        setCurrentView(View.TRANSACTIONS);
      } else if (e.key === '3') {
        setCurrentView(View.ANALYTICS);
      } else if (e.key === '4') {
        setCurrentView(View.PROFILE);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleOnboardingComplete = (newUser: UserProfile) => {
    saveUser(newUser);
    setUser(newUser);
    setCurrentView(View.DASHBOARD);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    saveUser(updatedUser);
    setUser(updatedUser);
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: generateTransactionId(),
    };
    const updated = saveTransaction(newTransaction);
    setTransactions(updated);
    
    // Refresh user to get badge and streak updates
    const updatedUser = getUser();
    if (updatedUser) setUser(updatedUser);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = deleteTransaction(id);
    setTransactions(updated);
  };

  const handleBatchDelete = (ids: string[]) => {
    ids.forEach(id => deleteTransaction(id));
    setTransactions(getTransactions());
    const updatedUser = getUser();
    if (updatedUser) setUser(updatedUser);
  };

  const handleBatchImport = (importedList: Omit<Transaction, 'id'>[]) => {
    importedList.forEach(t => {
      saveTransaction({
        ...t,
        id: generateTransactionId(),
      });
    });
    setTransactions(getTransactions());
    const updatedUser = getUser();
    if (updatedUser) setUser(updatedUser);
  };

  const handleTourFinish = () => {
    if (user) {
      const updatedUser = { ...user, hasCompletedTour: true };
      handleUpdateUser(updatedUser);
    }
  };

  const handleExportExcel = () => {
    if (user) exportToExcel(transactions, user);
  };

  const handleExportPDF = () => {
    if (user) exportToPDF(transactions, user);
  };

  if (loading) return null;

  if (currentView === View.ONBOARDING) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <>
      <Layout 
        currentView={currentView} 
        onChangeView={setCurrentView}
        onOpenAddModal={() => setIsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        user={user}
      >
        {currentView === View.DASHBOARD && user && (
          <Dashboard 
            user={user} 
            expenses={transactions} 
            onAddClick={() => setIsModalOpen(true)}
            onDeleteExpense={handleDeleteTransaction}
            onViewAll={() => setCurrentView(View.TRANSACTIONS)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          />
        )}
        {currentView === View.TRANSACTIONS && user && (
          <Transactions 
            user={user}
            expenses={transactions} 
            onDeleteExpense={handleDeleteTransaction}
            onOpenAddModal={() => setIsModalOpen(true)}
            onImportTransactions={handleBatchImport}
            onBatchDelete={handleBatchDelete}
          />
        )}
        {currentView === View.ANALYTICS && user && (
          <Analytics 
            expenses={transactions} 
            currency={user.currency || 'INR'}
            onOpenAddModal={() => setIsModalOpen(true)}
          />
        )}
        {currentView === View.PROFILE && user && (
          <Profile 
            user={user} 
            expenses={transactions} 
            onUpdateUser={handleUpdateUser}
          />
        )}
      </Layout>
      
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddTransaction}
        currency={user?.currency || 'INR'}
        accounts={user?.accounts}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onChangeView={setCurrentView}
        onOpenAddModal={() => setIsModalOpen(true)}
        transactions={transactions}
        user={user}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportExcel={handleExportExcel}
        onExportPDF={handleExportPDF}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Guided Tour for New Users */}
      <Tour 
        run={!!user && !user.hasCompletedTour && currentView === View.DASHBOARD}
        steps={TOUR_STEPS}
        onFinish={handleTourFinish}
      />
    </>
  );
};

export default App;

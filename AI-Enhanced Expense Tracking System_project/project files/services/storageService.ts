import { Transaction, UserProfile, Badge, Account } from '../types';
import { BADGES } from '../constants';

const KEYS = {
  TRANSACTIONS: 'ai_expense_tracking_transactions',
  USER: 'ai_expense_tracking_user',
  // Backward compatibility keys for seamless migration
  LEGACY_TRANSACTIONS: 'spendsense_expenses',
  LEGACY_USER: 'spendsense_user',
};

export const getTransactions = (): Transaction[] => {
  let data = localStorage.getItem(KEYS.TRANSACTIONS);
  if (!data) {
    data = localStorage.getItem(KEYS.LEGACY_TRANSACTIONS);
  }
  if (!data) return [];

  try {
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => ({
      ...item,
      type: item.type || 'expense',
      accountId: item.accountId || undefined,
    }));
  } catch {
    return [];
  }
};

export const saveTransaction = (transaction: Transaction): Transaction[] => {
  const current = getTransactions();
  const updated = [transaction, ...current];
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));

  // Update Streak Logic
  updateUserStreak();

  // Check Badges after streak update
  checkBadges(updated);
  return updated;
};

const updateUserStreak = () => {
  const user = getUser();
  if (!user) return;

  const today = new Date().toDateString();
  const lastDate = user.lastTransactionDate ? new Date(user.lastTransactionDate).toDateString() : null;

  if (lastDate === today) {
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  let newStreak = user.currentStreak;

  if (lastDate === yesterday.toDateString()) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const updatedUser: UserProfile = {
    ...user,
    lastTransactionDate: new Date().toISOString(),
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, user.longestStreak),
    points: user.points + (newStreak > 1 ? 10 : 5),
  };

  saveUser(updatedUser);
};

export const deleteTransaction = (id: string): Transaction[] => {
  const current = getTransactions();
  const updated = current.filter(e => e.id !== id);
  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updated));
  return updated;
};

export const getUser = (): UserProfile | null => {
  let data = localStorage.getItem(KEYS.USER);
  if (!data) {
    data = localStorage.getItem(KEYS.LEGACY_USER);
  }
  if (!data) return null;

  try {
    const parsed = JSON.parse(data);

    let accounts = parsed.accounts;
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      accounts = [
        { id: 'default-cash', name: 'Cash', type: 'cash' as const, color: '#10b981' },
        { id: 'default-bank', name: 'Bank Account', type: 'bank' as const, color: '#3b82f6' },
      ];
      const updatedUser = {
        ...parsed,
        accounts,
      };
      localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));
    }

    return {
      ...parsed,
      currency: parsed.currency || 'INR',
      currentStreak: parsed.currentStreak || 0,
      longestStreak: parsed.longestStreak || 0,
      lastTransactionDate: parsed.lastTransactionDate || null,
      budget: parsed.budget || { amount: 0, period: 'monthly', categoryLimits: {} },
      accounts: accounts,
      hasCompletedTour: parsed.hasCompletedTour ?? true,
    };
  } catch {
    return null;
  }
};

export const saveUser = (user: UserProfile) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const checkBadges = (transactions: Transaction[]) => {
  const user = getUser();
  if (!user) return;

  const earnedBadgeIds = new Set(user.badges);
  let newBadgesEarned = false;
  let pointsToAdd = 0;

  BADGES.forEach(badge => {
    if (!earnedBadgeIds.has(badge.id) && badge.condition(transactions, user)) {
      earnedBadgeIds.add(badge.id);
      newBadgesEarned = true;
      pointsToAdd += 100;
    }
  });

  if (newBadgesEarned) {
    saveUser({
      ...user,
      badges: Array.from(earnedBadgeIds),
      points: user.points + pointsToAdd,
    });
  }
};

// Backup & Restore Functions with Strict Schema Validation
export interface BackupData {
  appName: string;
  user: UserProfile;
  transactions: Transaction[];
  version: string;
  exportDate: string;
}

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  transactionCount?: number;
  userName?: string;
}

/**
 * Validates a backup JSON payload thoroughly before any state is mutated.
 * If invalid, leaves existing data completely untouched.
 */
export const validateBackupData = (data: any): BackupValidationResult => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'File content is not a valid JSON object.' };
  }

  // 1. Validate User Profile
  const user = data.user;
  if (!user || typeof user !== 'object') {
    return { isValid: false, error: 'Backup is missing the user profile section.' };
  }

  if (typeof user.name !== 'string' || !user.name.trim()) {
    return { isValid: false, error: 'User profile name is missing or invalid.' };
  }

  if (typeof user.avatar !== 'string' || !user.avatar.trim()) {
    return { isValid: false, error: 'User avatar emoji is missing or invalid.' };
  }

  if (user.points !== undefined && (typeof user.points !== 'number' || isNaN(user.points))) {
    return { isValid: false, error: 'User points must be a valid number.' };
  }

  if (user.badges !== undefined && !Array.isArray(user.badges)) {
    return { isValid: false, error: 'User badges must be an array of badge IDs.' };
  }

  if (user.budget !== undefined) {
    if (typeof user.budget !== 'object' || user.budget === null) {
      return { isValid: false, error: 'User budget configuration is malformed.' };
    }
    if (typeof user.budget.amount !== 'number' || isNaN(user.budget.amount) || user.budget.amount < 0) {
      return { isValid: false, error: 'Budget amount must be a positive number.' };
    }
    if (user.budget.period && !['weekly', 'monthly', 'yearly'].includes(user.budget.period)) {
      return { isValid: false, error: 'Budget period must be "weekly", "monthly", or "yearly".' };
    }
  }

  // 2. Validate Transactions Array
  const transactions = data.transactions;
  if (!Array.isArray(transactions)) {
    return { isValid: false, error: 'Transactions list must be an array.' };
  }

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const recordLabel = t && t.title ? `"${t.title}" (record #${i + 1})` : `Record #${i + 1}`;

    if (!t || typeof t !== 'object') {
      return { isValid: false, error: `${recordLabel} is not a valid transaction object.` };
    }

    if (!t.id || typeof t.id !== 'string') {
      return { isValid: false, error: `${recordLabel} is missing a valid unique ID.` };
    }

    if (t.type !== 'income' && t.type !== 'expense') {
      return { isValid: false, error: `${recordLabel} has invalid type: "${t.type}". Expected "income" or "expense".` };
    }

    if (typeof t.amount !== 'number' || isNaN(t.amount) || t.amount < 0) {
      return { isValid: false, error: `${recordLabel} has an invalid amount: ${t.amount}. Must be a non-negative number.` };
    }

    if (!t.title || typeof t.title !== 'string') {
      return { isValid: false, error: `${recordLabel} is missing a merchant or title description.` };
    }

    if (!t.category || typeof t.category !== 'string') {
      return { isValid: false, error: `${recordLabel} is missing a category.` };
    }

    const parsedDate = new Date(t.date);
    if (!t.date || isNaN(parsedDate.getTime())) {
      return { isValid: false, error: `${recordLabel} has an invalid date: "${t.date}".` };
    }
  }

  return {
    isValid: true,
    transactionCount: transactions.length,
    userName: user.name.trim(),
  };
};

export const exportBackup = (): BackupData => {
  const user = getUser();
  const transactions = getTransactions();

  if (!user) {
    throw new Error('No user data found to backup');
  }

  return {
    appName: 'AI EXPENSE TRACKING',
    user,
    transactions,
    version: '1.0',
    exportDate: new Date().toISOString(),
  };
};

export const importBackup = (backupData: any): void => {
  const validation = validateBackupData(backupData);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid backup data format.');
  }

  // Pre-clean and prepare transactions
  const sanitizedTransactions: Transaction[] = backupData.transactions.map((t: any) => ({
    id: String(t.id),
    type: t.type === 'income' ? 'income' : 'expense',
    amount: Math.abs(Number(t.amount)),
    category: String(t.category),
    title: String(t.title).trim(),
    date: new Date(t.date).toISOString(),
    notes: t.notes ? String(t.notes) : undefined,
    accountId: t.accountId ? String(t.accountId) : undefined,
  }));

  const sanitizedUser: UserProfile = {
    name: String(backupData.user.name).trim(),
    email: backupData.user.email ? String(backupData.user.email).trim() : '',
    avatar: String(backupData.user.avatar || '🧑‍💻'),
    joinedDate: backupData.user.joinedDate ? new Date(backupData.user.joinedDate).toISOString() : new Date().toISOString(),
    points: typeof backupData.user.points === 'number' ? Math.max(0, backupData.user.points) : 50,
    badges: Array.isArray(backupData.user.badges) ? backupData.user.badges : [],
    currency: backupData.user.currency || 'INR',
    currentStreak: typeof backupData.user.currentStreak === 'number' ? backupData.user.currentStreak : 0,
    longestStreak: typeof backupData.user.longestStreak === 'number' ? backupData.user.longestStreak : 0,
    lastTransactionDate: backupData.user.lastTransactionDate || null,
    budget: backupData.user.budget || { amount: 0, period: 'monthly', categoryLimits: {} },
    accounts: Array.isArray(backupData.user.accounts) && backupData.user.accounts.length > 0
      ? backupData.user.accounts
      : [
          { id: 'default-cash', name: 'Cash', type: 'cash', color: '#10b981' },
          { id: 'default-bank', name: 'Bank Account', type: 'bank', color: '#3b82f6' },
        ],
    hasCompletedTour: backupData.user.hasCompletedTour ?? true,
  };

  // ONLY clear and update after everything has been thoroughly checked
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.removeItem(KEYS.USER);
  localStorage.removeItem(KEYS.LEGACY_TRANSACTIONS);
  localStorage.removeItem(KEYS.LEGACY_USER);

  localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(sanitizedTransactions));
  localStorage.setItem(KEYS.USER, JSON.stringify(sanitizedUser));
};

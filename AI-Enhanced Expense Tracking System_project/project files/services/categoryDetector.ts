import { Category } from '../types';

interface CategoryRule {
  category: Category;
  keywords: string[];
}

const EXPENSE_RULES: CategoryRule[] = [
  {
    category: 'Food',
    keywords: [
      'cafe', 'coffee', 'starbucks', 'dunkin', 'tea', 'chai',
      'pizza', 'burger', 'mcdonald', 'kfc', 'subway', 'domino',
      'zomato', 'swiggy', 'doordash', 'uber eats', 'grubhub',
      'restaurant', 'diner', 'bistro', 'dhaba', 'bakery', 'bar', 'pub',
      'lunch', 'dinner', 'breakfast', 'brunch', 'snacks', 'food',
      'grocery', 'groceries', 'supermarket', 'mart', 'instamart', 'blinkit',
      'zepto', 'bigbasket', 'vegetable', 'fruit', 'milk', 'bread', 'meat'
    ]
  },
  {
    category: 'Transport',
    keywords: [
      'uber', 'ola', 'lyft', 'grab', 'taxi', 'cab', 'auto', 'rickshaw',
      'metro', 'subway', 'bus', 'train', 'railway', 'irctc', 'flight',
      'airline', 'indigo', 'air india', 'fuel', 'petrol', 'diesel', 'gas',
      'shell', 'hpcl', 'bpcl', 'ioc', 'parking', 'toll', 'fastag', 'transit'
    ]
  },
  {
    category: 'Shopping',
    keywords: [
      'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'ebay', 'walmart',
      'target', 'zara', 'h&m', 'uniqlo', 'nike', 'adidas', 'puma', 'levi',
      'mall', 'retail', 'clothes', 'clothing', 'apparel', 'shoes', 'footwear',
      'sneakers', 'electronics', 'apple store', 'croma', 'reliance digital'
    ]
  },
  {
    category: 'Bills',
    keywords: [
      'electricity', 'power', 'water', 'gas bill', 'lpg', 'piped gas',
      'utility', 'broadband', 'wifi', 'internet', 'airtel', 'jio', 'vi',
      'vodafone', 'at&t', 'verizon', 'phone bill', 'mobile recharge',
      'rent', 'maintenance', 'society', 'property tax', 'insurance',
      'lic', 'hdfc ergo', 'emi', 'loan repayment'
    ]
  },
  {
    category: 'Entertainment',
    keywords: [
      'netflix', 'spotify', 'youtube', 'prime video', 'hotstar', 'disney',
      'apple tv', 'apple music', 'audible', 'cinema', 'movie', 'pvr', 'inox',
      'bookmyshow', 'theatre', 'concert', 'event', 'gaming', 'steam',
      'playstation', 'xbox', 'nintendo', 'game'
    ]
  },
  {
    category: 'Health',
    keywords: [
      'doctor', 'physician', 'hospital', 'clinic', 'dentist', 'dental',
      'pharmacy', 'chemist', 'apolo', 'apollo', '1mg', 'pharmeasy', 'medplus',
      'medicine', 'drugs', 'tests', 'pathology', 'diagnostics', 'blood test',
      'gym', 'fitness', 'cult.fit', 'cultfit', 'workout', 'yoga', 'supplements'
    ]
  },
  {
    category: 'Education',
    keywords: [
      'course', 'udemy', 'coursera', 'edx', 'skillshare', 'masterclass',
      'tuition', 'school', 'college', 'university', 'fees', 'books',
      'textbook', 'stationery', 'exam', 'coaching', 'training'
    ]
  }
];

const INCOME_RULES: CategoryRule[] = [
  {
    category: 'Salary',
    keywords: ['salary', 'payroll', 'wages', 'stipend', 'monthly pay', 'employer', 'paycheck']
  },
  {
    category: 'Freelance',
    keywords: ['freelance', 'client', 'consulting', 'project', 'contract', 'gig', 'upwork', 'fiverr', 'invoice payment']
  },
  {
    category: 'Investments',
    keywords: ['dividend', 'interest', 'stock', 'shares', 'equity', 'zerodha', 'groww', 'robinhood', 'mutual fund', 'crypto', 'yield', 'capital gain']
  },
  {
    category: 'Gift',
    keywords: ['gift', 'present', 'cash gift', 'reward', 'cashback', 'bonus']
  }
];

/**
 * Predicts the most likely category based on merchant or title input.
 */
export function detectCategory(title: string, type: 'expense' | 'income' = 'expense'): Category | null {
  if (!title || !title.trim()) return null;
  const lower = title.toLowerCase().trim();

  const rules = type === 'expense' ? EXPENSE_RULES : INCOME_RULES;

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      // Check full word or phrase boundary match
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(lower)) {
        return rule.category;
      }
    }
  }

  return null;
}

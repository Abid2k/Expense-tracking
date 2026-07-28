export const CATEGORIES = [
  'Food',
  'Transport',
  'Housing',
  'Utilities',
  'Health',
  'Entertainment',
  'Shopping',
  'Education',
  'Other',
];

export const CATEGORY_COLORS = {
  Food: '#f59e0b',
  Transport: '#3b82f6',
  Housing: '#8b5cf6',
  Utilities: '#06b6d4',
  Health: '#ef4444',
  Entertainment: '#ec4899',
  Shopping: '#10b981',
  Education: '#6366f1',
  Other: '#6b7280',
  'Debt Payment': '#0ea5e9',
  'Savings Contribution': '#14b8a6',
};

export const DEBT_TYPES = ['I Owe', 'Owed to Me'];

export const GOAL_TYPES = ['Monthly', 'Yearly', 'One-time', 'General', 'Custom'];

export const COUNTRIES = [
  { name: 'Saudi Arabia', currency: 'SAR' },
  { name: 'India', currency: 'INR' },
  { name: 'United Arab Emirates', currency: 'AED' },
  { name: 'Kuwait', currency: 'KWD' },
  { name: 'Qatar', currency: 'QAR' },
  { name: 'Bahrain', currency: 'BHD' },
  { name: 'Oman', currency: 'OMR' },
  { name: 'Jordan', currency: 'JOD' },
  { name: 'Egypt', currency: 'EGP' },
  { name: 'Pakistan', currency: 'PKR' },
  { name: 'Bangladesh', currency: 'BDT' },
  { name: 'Sri Lanka', currency: 'LKR' },
  { name: 'Nepal', currency: 'NPR' },
  { name: 'Philippines', currency: 'PHP' },
  { name: 'Indonesia', currency: 'IDR' },
  { name: 'Malaysia', currency: 'MYR' },
  { name: 'Singapore', currency: 'SGD' },
  { name: 'China', currency: 'CNY' },
  { name: 'Japan', currency: 'JPY' },
  { name: 'South Korea', currency: 'KRW' },
  { name: 'United States', currency: 'USD' },
  { name: 'Canada', currency: 'CAD' },
  { name: 'United Kingdom', currency: 'GBP' },
  { name: 'Germany', currency: 'EUR' },
  { name: 'France', currency: 'EUR' },
  { name: 'Spain', currency: 'EUR' },
  { name: 'Italy', currency: 'EUR' },
  { name: 'Netherlands', currency: 'EUR' },
  { name: 'Turkey', currency: 'TRY' },
  { name: 'South Africa', currency: 'ZAR' },
  { name: 'Nigeria', currency: 'NGN' },
  { name: 'Kenya', currency: 'KES' },
  { name: 'Australia', currency: 'AUD' },
  { name: 'Brazil', currency: 'BRL' },
  { name: 'Mexico', currency: 'MXN' },
  { name: 'Russia', currency: 'RUB' },
  { name: 'Other', currency: 'USD' },
];

export const CURRENCIES = Array.from(new Set(COUNTRIES.map((c) => c.currency))).sort();

export const DEFAULT_CURRENCY = 'SAR';

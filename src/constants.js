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
  Food: '#c97b3d',
  Transport: '#3b6e8f',
  Housing: '#6b4e9c',
  Utilities: '#2a8c8c',
  Health: '#b3432b',
  Entertainment: '#b0568a',
  Shopping: '#157a5b',
  Education: '#4a5fa5',
  Other: '#7a7267',
  'Debt Payment': '#0f6b5c',
  'Savings Contribution': '#a9812e',
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

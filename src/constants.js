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
  Food: '#c8ff2e',
  Transport: '#ff4a1c',
  Housing: '#046d63',
  Utilities: '#1d7ae8',
  Health: '#8e7cff',
  Entertainment: '#e5157f',
  Shopping: '#ffb302',
  Education: '#0e8c7e',
  Other: '#a8a296',
  'Debt Payment': '#ff4a1c',
  'Savings Contribution': '#c8ff2e',
};

// Chart marks can't read CSS variables (recharts writes SVG presentation
// attributes), so they live here — picked to stay legible on bone and on ink.
export const CHART = {
  primary: '#0e8c7e',
  secondary: '#ffb302',
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

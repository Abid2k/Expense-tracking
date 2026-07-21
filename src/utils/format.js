import { DEFAULT_CURRENCY } from '../constants';

export function formatCurrency(amount, currency = DEFAULT_CURRENCY) {
  const value = Number(amount) || 0;
  // Fraction digits vary by currency (JPY/KRW use 0, KWD/BHD/OMR use 3) — ask
  // Intl for the correct count instead of hardcoding 2 for every currency.
  const digits = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
  return `${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
}

export function toMonthKey(dateStr) {
  return String(dateStr).slice(0, 7); // 'YYYY-MM'
}

export function toDateStr(dateStr) {
  // Google Sheets may return dates as full ISO timestamps; keep just the date part.
  return String(dateStr).slice(0, 10);
}

export function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function todayStr() {
  // Build from local date parts — toISOString() converts to UTC first,
  // which rolls the date back a day in UTC+ timezones during early morning hours.
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentMonthKey() {
  return toMonthKey(todayStr());
}

export function previousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function daysInMonth(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function monthsUntil(targetDateStr) {
  if (!targetDateStr) return null;
  const [ty, tm, td] = targetDateStr.split('-').map(Number);
  const target = new Date(ty, tm - 1, td);
  const now = new Date();
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  const adjusted = target.getDate() < now.getDate() ? months - 1 : months;
  return Math.max(1, adjusted);
}

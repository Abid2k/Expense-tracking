import { useCallback, useEffect, useState } from 'react';

const KEY = 'expense-tracker-theme';

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || '');

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const current = prev || (systemPrefersDark() ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(KEY, next);
      return next;
    });
  }, []);

  const isDark = theme ? theme === 'dark' : systemPrefersDark();

  return { isDark, toggle };
}

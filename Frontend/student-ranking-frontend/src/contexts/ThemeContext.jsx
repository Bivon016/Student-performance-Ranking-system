import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'appTheme';
const BACKUP_KEY = 'appBackupSettings';

const ThemeContext = createContext(null);

function resolveDark(theme) {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeToDocument(theme) {
  const isDark = resolveDark(theme);
  const root = document.documentElement;

  root.classList.remove('dark');
  if (isDark) root.classList.add('dark');

  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  root.style.colorScheme = isDark ? 'dark' : 'light';

  return isDark;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');
  const [isDark, setIsDark] = useState(() =>
    resolveDark(localStorage.getItem(STORAGE_KEY) || 'light')
  );

  const setTheme = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
    setIsDark(applyThemeToDocument(next));
  }, []);

  useEffect(() => {
    setIsDark(applyThemeToDocument(theme));
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(applyThemeToDocument('auto'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  // Read from DOM so toggle is always in sync with the actual class on <html>
  const toggleTheme = useCallback(() => {
    const currentlyDark = document.documentElement.classList.contains('dark');
    setTheme(currentlyDark ? 'light' : 'dark');
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { STORAGE_KEY as THEME_STORAGE_KEY, BACKUP_KEY };

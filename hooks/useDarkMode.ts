import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const getInitialDark = () => {
    if (typeof window === 'undefined') return false;
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedTheme = localStorage.getItem('theme');
    if (savedDarkMode !== null) {
      return savedDarkMode === 'true';
    } else if (savedTheme !== null) {
      return savedTheme === 'dark';
    } else {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  };
  const [isDark, setIsDark] = useState(getInitialDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  return { isDark, toggleDarkMode };
};


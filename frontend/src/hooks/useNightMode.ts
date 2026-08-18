import { useState, useEffect } from 'react';

interface UseNightModeReturn {
  isNightMode: boolean;
  toggleNightMode: () => void;
}

export function useNightMode(): UseNightModeReturn {
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    // Check saved preference
    const saved = localStorage.getItem('nightMode');
    if (saved !== null) {
      setIsNightMode(JSON.parse(saved));
    } else {
      // Auto-enable between 9 PM and 6 AM
      const hour = new Date().getHours();
      setIsNightMode(hour >= 21 || hour < 6);
    }
  }, []);

  useEffect(() => {
    // Update DOM and localStorage
    localStorage.setItem('nightMode', JSON.stringify(isNightMode));
    if (isNightMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isNightMode]);

  const toggleNightMode = () => {
    setIsNightMode(!isNightMode);
  };

  return {
    isNightMode,
    toggleNightMode
  };
}

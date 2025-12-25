import { useState, useEffect } from 'react';

const SIDEBAR_KEY = 'sportspulse_sidebar_state';

export const useSidebar = () => {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  const toggle = () => setIsOpen((prev: boolean) => !prev);

  return { isOpen, toggle };
};

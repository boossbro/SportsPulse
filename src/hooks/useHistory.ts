import { useState, useEffect, useCallback } from 'react';

export interface HistoryItem {
  id: string;
  type: 'match' | 'news';
  title: string;
  subtitle?: string;
  timestamp: number;
  link: string;
}

const HISTORY_KEY = 'sportspulse_history';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load and clean history on mount
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(HISTORY_KEY);
        if (!stored) return [];

        const items: HistoryItem[] = JSON.parse(stored);
        const now = Date.now();
        
        // Filter out items older than 2 days
        const filtered = items.filter(
          (item) => now - item.timestamp < TWO_DAYS_MS
        );

        // Save cleaned history back
        if (filtered.length !== items.length) {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
        }

        return filtered;
      } catch {
        return [];
      }
    };

    setHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Remove duplicates (same id)
      const filtered = prev.filter((h) => h.id !== newItem.id);
      // Add new item at the beginning
      const updated = [newItem, ...filtered].slice(0, 20); // Keep max 20 items
      
      // Save to localStorage
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
    removeItem,
  };
};

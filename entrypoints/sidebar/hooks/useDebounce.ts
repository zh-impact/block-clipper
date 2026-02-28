/**
 * useDebounce Hook
 * @description Custom hook for debouncing values with TypeScript support
 */

import { useState, useEffect } from 'react';

/**
 * Debounce hook options
 */
interface UseDebounceOptions {
  /**
   * Delay in milliseconds
   * @default 300
   */
  delay?: number;

  /**
   * Whether to debounce on first value change
   * @default true
   */
  leading?: boolean;
}

/**
 * Custom hook to debounce a value
 *
 * @param value - The value to debounce
 * @param options - Debounce options
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, { delay: 300 });
 *
 * useEffect(() => {
 *   // This will only run 300ms after searchTerm stops changing
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebounce<T>(value: T, options: UseDebounceOptions = {}): T {
  const { delay = 300 } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for debounced callback
 * Useful when you need to debounce a function call rather than a value
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced function
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebounceCallback(
 *   (query: string) => performSearch(query),
 *   300
 * );
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
}

// Import React for useRef and useCallback
import React from 'react';

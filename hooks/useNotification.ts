/**
 * useNotification Hook
 * @description Manages toast notifications with auto-dismiss and concurrency limits
 */

import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export interface UseNotificationResult {
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "error" | "info", duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 5; // Limit number of toasts to prevent UI clutter

/**
 * Hook for managing toast notifications
 */
export function useNotification(): UseNotificationResult {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Show a toast notification
   */
  const showToast = useCallback((
    message: string,
    type: "success" | "error" | "info" = "info",
    duration = 3000,
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => {
      const updated = [...prev, newToast];

      // Limit number of toasts
      if (updated.length > MAX_TOASTS) {
        updated.shift(); // Remove oldest toast
      }

      return updated;
    });

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  /**
   * Remove a specific toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    clearToasts,
  };
}

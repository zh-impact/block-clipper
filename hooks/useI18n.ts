/**
 * useI18n Hook
 * @description React hook for internationalization with Chrome Extension i18n API
 */

import { useEffect, useState, useCallback } from "react";
import { type I18nSubstitutions, type I18nKey, type UseI18nResult } from "../types/i18n";

/**
 * React hook for i18n translations
 * Handles pre-rendering compatibility and provides type-safe translations
 */
export function useI18n(): UseI18nResult {
  const [locale, setLocale] = useState<string>("en");

  // Get current locale on mount
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.i18n) {
      setLocale(chrome.i18n.getUILanguage() || "en");
    }
  }, []);

  /**
   * Get translated message by key
   * @param key - The i18n message key
   * @param substitutions - Optional substitution values for placeholders
   * @returns The translated message
   */
  const t = useCallback(
    (key: I18nKey, substitutions?: I18nSubstitutions): string => {
      // Check if chrome.i18n is available (not available during pre-rendering)
      if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getMessage) {
        const message = chrome.i18n.getMessage(key, substitutions as string | (string | number)[] | undefined);
        return message || key;
      }

      // Fallback during pre-rendering: return the key itself
      // This will be replaced on client-side hydration
      return key;
    },
    []
  );

  /**
   * Get current locale
   * @returns The current locale code (e.g., "en", "zh-CN")
   */
  const getLocale = useCallback((): string => {
    return locale;
  }, [locale]);

  return { t, getLocale };
}

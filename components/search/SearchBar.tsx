/**
 * SearchBar Component
 * @description Search input with debouncing, IME composition support, and loading state
 */

import { type JSX } from "react";
import { useI18n } from "../../hooks/useI18n";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  isSearching?: boolean;
  placeholder?: string;
  disabled?: boolean;
  isComposing?: boolean;
  onCompositionStart?: () => void;
  onCompositionEnd?: (event: React.CompositionEvent<HTMLInputElement>) => void;
}

/**
 * SearchBar Component
 */
export function SearchBar({
  value,
  onChange,
  onClear,
  isSearching = false,
  placeholder,
  disabled = false,
  isComposing = false,
  onCompositionStart,
  onCompositionEnd,
}: SearchBarProps): JSX.Element {
  const { t } = useI18n();
  const placeholderText = placeholder || t('search_placeholder');

  return (
    <div className="search-bar" role="search">
      <label htmlFor="search-input" className="sr-only">
        {placeholderText}
      </label>
      <input
        id="search-input"
        type="text"
        placeholder={placeholderText}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        className="search-input"
        disabled={disabled || isSearching}
        aria-label={placeholderText}
        aria-describedby="search-description"
      />
      <span id="search-description" className="sr-only">
        {t('search_searchDescription')}
      </span>
      {isSearching ? (
        <div
          className="search-loading"
          aria-label={t('search_searching')}
          role="status"
        >
          <div className="search-spinner" aria-hidden="true" />
        </div>
      ) : value && onClear ? (
        <button
          onClick={onClear}
          className="clear-button"
          aria-label={t('search_clearSearch')}
          type="button"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

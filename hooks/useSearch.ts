/**
 * useSearch Hook
 * @description Manages search functionality with debouncing and IME composition support
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { getStorageService } from "../utils/storage";
import type { Block } from "../utils/block-model";

export interface UseSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export interface UseSearchResult {
  searchQuery: string;
  isSearching: boolean;
  isComposing: boolean;
  searchResults: Block[];
  isSearchMode: boolean;
  setSearchQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: (event: React.CompositionEvent<HTMLInputElement>) => void;
}

/**
 * Sort blocks by createdAt descending (newest first)
 */
function sortBlocks(blocks: Block[]): Block[] {
  return blocks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Hook for managing search functionality
 */
export function useSearch(
  onResults: (results: Block[], isSearchMode: boolean) => void,
  options: UseSearchOptions = {},
): UseSearchResult {
  const { debounceMs = 300, limit = 50 } = options;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [searchResults, setSearchResults] = useState<Block[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Perform the actual search operation
   */
  const performSearch = useCallback(async (query: string) => {
    if (query.trim()) {
      setIsSearching(true);

      try {
        const storageService = getStorageService();
        const results = await storageService.search({ query, limit });
        const sortedResults = sortBlocks(results);

        setSearchResults(sortedResults);
        setIsSearchMode(true);
        onResults(sortedResults, true);
      } catch (error) {
        console.error("[useSearch] Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      // Load all blocks when query is empty
      setIsSearching(true);

      try {
        const storageService = getStorageService();
        const result = await storageService.query({ page: 1, limit });
        const sortedItems = sortBlocks(result.items);

        setSearchResults([]);
        setIsSearchMode(false);
        onResults(sortedItems, false);
      } catch (error) {
        console.error("[useSearch] Failed to load blocks:", error);
      } finally {
        setIsSearching(false);
      }
    }
  }, [limit, onResults]);

  /**
   * Handle search query change with debouncing
   */
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);

    // Don't search while IME is composing (e.g., typing Pinyin)
    if (isComposing) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid excessive API calls during typing
    searchTimeoutRef.current = setTimeout(() => {
      void performSearch(query);
    }, debounceMs);
  }, [isComposing, debounceMs, performSearch]);

  /**
   * Clear search
   */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearchMode(false);
    setSearchResults([]);
    void performSearch("");
  }, [performSearch]);

  /**
   * Handle IME composition start (e.g., Chinese input method)
   */
  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  /**
   * Handle IME composition end
   */
  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);

    // Immediately perform search with the final composed text
    // Don't use debounce delay after composition
    const query = event.currentTarget.value;
    setSearchQuery(query);
    void performSearch(query);
  }, [performSearch]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchQuery,
    isSearching,
    isComposing,
    searchResults,
    isSearchMode,
    setSearchQuery: handleSearchChange,
    performSearch,
    clearSearch,
    handleCompositionStart,
    handleCompositionEnd,
  };
}

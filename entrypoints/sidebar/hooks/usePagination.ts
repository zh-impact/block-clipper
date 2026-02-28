/**
 * usePagination Hook
 * @description Custom hook for pagination logic
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Pagination options
 */
export interface PaginationOptions {
  /**
   * Total number of items
   */
  total: number;

  /**
   * Number of items per page
   * @default 10
   */
  pageSize?: number;

  /**
   * Initial page number (1-indexed)
   * @default 1
   */
  initialPage?: number;
}

/**
 * Pagination state and methods
 */
export interface PaginationReturn {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Index of first item on current page (0-indexed)
   */
  startIndex: number;

  /**
   * Index of last item on current page (0-indexed)
   */
  endIndex: number;

  /**
   * Whether there is a previous page
   */
  hasPreviousPage: boolean;

  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;

  /**
   * Go to a specific page
   */
  goToPage: (page: number) => void;

  /**
   * Go to the next page
   */
  nextPage: () => void;

  /**
   * Go to the previous page
   */
  previousPage: () => void;

  /**
   * Go to the first page
   */
  firstPage: () => void;

  /**
   * Go to the last page
   */
  lastPage: () => void;

  /**
   * Set a new page size
   */
  setPageSize: (size: number) => void;
}

/**
 * Custom hook for pagination logic
 *
 * @param options - Pagination options
 * @returns Pagination state and methods
 *
 * @example
 * ```tsx
 * const {
 *   currentPage,
 *   totalPages,
 *   hasPreviousPage,
 *   hasNextPage,
 *   goToPage,
 *   nextPage,
 *   previousPage,
 * } = usePagination({
 *   total: 150,
 *   pageSize: 10,
 * });
 *
 * // Display: Page 1 of 15
 * <div>Page {currentPage} of {totalPages}</div>
 *
 * <button onClick={previousPage} disabled={!hasPreviousPage}>
 *   Previous
 * </button>
 * <button onClick={nextPage} disabled={!hasNextPage}>
 *   Next
 * </button>
 * ```
 */
export function usePagination(options: PaginationOptions): PaginationReturn {
  const { total, pageSize: initialPageSize = 10, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  /**
   * Calculate total number of pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);

  /**
   * Calculate start and end indices (0-indexed)
   */
  const startIndex = useMemo(() => {
    return (currentPage - 1) * pageSize;
  }, [currentPage, pageSize]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + pageSize - 1, total - 1);
  }, [startIndex, pageSize, total]);

  /**
   * Check if there are previous/next pages
   */
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  /**
   * Go to the next page
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Go to the previous page
   */
  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [hasPreviousPage]);

  /**
   * Go to the first page
   */
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Go to the last page
   */
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Set a new page size and reset to first page
   */
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    pageSize,
    total,
    startIndex,
    endIndex,
    hasPreviousPage,
    hasNextPage,
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setPageSize,
  };
}

/**
 * Hook for infinite scroll pagination
 */
export function useInfinitePagination(options: Omit<PaginationOptions, 'initialPage'>) {
  const { total, pageSize: initialPageSize = 50 } = options;

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(initialPageSize);
  const [items, setItems] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Load more items
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate async data loading
    // In real usage, this would call an API or storage service
    await new Promise((resolve) => setTimeout(resolve, 500));

    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    if (startIndex >= total) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    // In real usage, you would fetch actual data here
    // For now, just update page number
    setCurrentPage(nextPage);

    if (endIndex >= total) {
      setHasMore(false);
    }

    setIsLoadingMore(false);
  }, [currentPage, pageSize, total, isLoadingMore, hasMore]);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
    setItems([]);
    setHasMore(true);
    setIsLoadingMore(false);
  }, []);

  return {
    items,
    currentPage,
    hasMore,
    isLoadingMore,
    loadMore,
    reset,
  };
}

/**
 * useBlocks Hook
 * @description Manages blocks data fetching, caching, pagination, and mutations
 */

import { useState, useEffect, useCallback } from "react";
import { getStorageService } from "../utils/storage";
import type { Block } from "../utils/block-model";

export interface UseBlocksOptions {
  limit?: number;
  autoLoad?: boolean;
}

export interface UseBlocksResult {
  blocks: Block[];
  isLoading: boolean;
  isLoadingMore: boolean;
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  error: Error | null;
  loadBlocks: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  reloadBlocks: () => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  updateLocalBlock: (block: Block) => void;
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
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
 * Hook for managing blocks data
 */
export function useBlocks(options: UseBlocksOptions = {}): UseBlocksResult {
  const { limit = 50, autoLoad = true } = options;

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load blocks from storage
   */
  const loadBlocks = useCallback(async (page = 1, append = false) => {
    try {
      const storageService = getStorageService();
      await storageService.initialize();

      const result = await storageService.query({ page, limit });
      const sortedItems = sortBlocks(result.items);

      setBlocks((prev) => (append ? [...prev, ...sortedItems] : sortedItems));
      setCurrentPage(page);
      setHasMore(sortedItems.length === limit);
      setTotalCount(result.total);
      setError(null);
    } catch (err) {
      console.error("[useBlocks] Failed to load blocks:", err);
      setError(err instanceof Error ? err : new Error("Failed to load blocks"));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  /**
   * Load more blocks (pagination)
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    await loadBlocks(nextPage, true);
  }, [isLoadingMore, hasMore, currentPage, loadBlocks]);

  /**
   * Reload blocks from page 1
   */
  const reloadBlocks = useCallback(async () => {
    setIsLoading(true);
    await loadBlocks(1, false);
  }, [loadBlocks]);

  /**
   * Delete a block
   */
  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      const storageService = getStorageService();
      await storageService.delete(blockId);

      // Remove from local state
      setBlocks((prev) => prev.filter((block) => block.id !== blockId));
      setTotalCount((prev) => Math.max(0, prev - 1));

      // Broadcast deletion to other pages
      try {
        chrome.runtime.sendMessage({
          type: 'BLOCK_DELETED',
          data: { deletedBlockId: blockId },
        }).catch(() => {
          // Ignore - other pages might not be open
        });
      } catch (err) {
        // Ignore - chrome might not be available
      }
    } catch (err) {
      console.error("[useBlocks] Failed to delete block:", err);
      throw err;
    }
  }, []);

  /**
   * Update a block in local state (used for cross-page sync)
   */
  const updateLocalBlock = useCallback((block: Block) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === block.id ? block : b)),
    );
  }, []);

  // Auto-load blocks on mount
  useEffect(() => {
    if (autoLoad) {
      void loadBlocks(1);
    }
  }, [autoLoad, loadBlocks]);

  return {
    blocks,
    isLoading,
    isLoadingMore,
    currentPage,
    hasMore,
    totalCount,
    error,
    loadBlocks,
    loadMore,
    reloadBlocks,
    deleteBlock,
    updateLocalBlock,
    setBlocks,
  };
}

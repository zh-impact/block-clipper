/**
 * useStorage Hook
 * @description Custom hook for StorageService integration with React
 */

import { useState, useEffect, useCallback } from 'react';
import { getStorageService } from '../../../utils/storage';
import type { Block, CreateBlockInput } from '../../../utils/block-model';

/**
 * Query options
 */
interface QueryOptions {
  page?: number;
  limit?: number;
}

/**
 * Search options
 */
interface SearchOptions {
  query: string;
  limit?: number;
}

/**
 * Custom hook for StorageService integration
 *
 * @example
 * ```tsx
 * const { blocks, isLoading, error, reload } = useStorage();
 * const { createBlock, deleteBlock } = useStorage();
 * ```
 */
export function useStorage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Initialize storage and load initial blocks
   */
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const storageService = getStorageService();
        await storageService.initialize();

        if (!mounted) return;

        // Load initial blocks
        const result = await storageService.query({ page: 1, limit: 50 });

        if (!mounted) return;

        setBlocks(result.items);
        setTotalCount(result.total);
        setIsLoading(false);
      } catch (err) {
        if (!mounted) return;

        setError(err instanceof Error ? err : new Error('Failed to initialize storage'));
        setIsLoading(false);
      }
    };

    void initialize();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Reload blocks from storage
   */
  const reload = useCallback(async (options: QueryOptions = { page: 1, limit: 50 }) => {
    setIsLoading(true);
    setError(null);

    try {
      const storageService = getStorageService();
      const result = await storageService.query(options);

      setBlocks(result.items);
      setTotalCount(result.total);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reload blocks'));
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new block
   */
  const createBlock = useCallback(async (input: CreateBlockInput): Promise<Block> => {
    try {
      const storageService = getStorageService();
      const block = await storageService.create(input);

      // Reload blocks to include the new one
      await reload();

      return block;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create block');
      setError(error);
      throw error;
    }
  }, [reload]);

  /**
   * Update a block
   */
  const updateBlock = useCallback(async (id: string, updates: Partial<Block>): Promise<Block> => {
    try {
      const storageService = getStorageService();
      const block = await storageService.update(id, updates);

      // Update local state
      setBlocks((prev) => prev.map((b) => (b.id === id ? block : b)));

      return block;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update block');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Delete a block
   */
  const deleteBlock = useCallback(async (id: string): Promise<void> => {
    try {
      const storageService = getStorageService();
      await storageService.delete(id);

      // Remove from local state
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      setTotalCount((prev) => prev - 1);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete block');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Delete multiple blocks
   */
  const deleteBlocks = useCallback(async (ids: string[]): Promise<number> => {
    try {
      const storageService = getStorageService();
      const count = await storageService.deleteMany(ids);

      // Remove from local state
      setBlocks((prev) => prev.filter((b) => !ids.includes(b.id)));
      setTotalCount((prev) => prev - count);

      return count;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete blocks');
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Search blocks
   */
  const searchBlocks = useCallback(async (options: SearchOptions): Promise<Block[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const storageService = getStorageService();
      const results = await storageService.search(options);

      setBlocks(results);
      setIsLoading(false);

      return results;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to search blocks');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  /**
   * Get a single block by ID
   */
  const getBlock = useCallback(async (id: string): Promise<Block | null> => {
    try {
      const storageService = getStorageService();
      return await storageService.read(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get block');
      setError(error);
      throw error;
    }
  }, []);

  return {
    // State
    blocks,
    isLoading,
    error,
    totalCount,

    // Methods
    reload,
    createBlock,
    updateBlock,
    deleteBlock,
    deleteBlocks,
    searchBlocks,
    getBlock,
  };
}

/**
 * Hook for storage usage statistics
 */
export function useStorageUsage() {
  const [usage, setUsage] = useState<{ bytes: number; quota: number } | null>(null);
  const [isQuotaWarning, setIsQuotaWarning] = useState(false);

  useEffect(() => {
    const checkUsage = async () => {
      try {
        const storageService = getStorageService();
        const usageData = await storageService.getUsage();

        setUsage(usageData);

        // Check if usage exceeds 80% threshold
        if (usageData.quota > 0) {
          const usagePercent = usageData.bytes / usageData.quota;
          setIsQuotaWarning(usagePercent > 0.8);
        }
      } catch (err) {
        console.error('Failed to get storage usage:', err);
      }
    };

    checkUsage();

    // Check usage every 30 seconds
    const interval = setInterval(checkUsage, 30000);

    return () => clearInterval(interval);
  }, []);

  return { usage, isQuotaWarning };
}

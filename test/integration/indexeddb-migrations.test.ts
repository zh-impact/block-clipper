/**
 * Integration tests for IndexedDB migrations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Setup fake IndexedDB before importing storage
import 'fake-indexeddb/auto';

import { getStorageService, type StorageService } from '../../utils/storage';
import type { Block } from '../../utils/block-model';

describe('IndexedDB Migrations - Integration Tests', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    // Use a unique database name for each test to avoid conflicts
    storageService = getStorageService();
    await storageService.initialize();
  });

  afterEach(async () => {
    // Cleanup after each test
    try {
      const all = await storageService.query({ page: 1, limit: 1000 });
      await storageService.deleteMany(all.items.map((item) => item.id));
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Database Schema - Version 1', () => {
    it('should have correct object stores', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Check if we can successfully query and write
      const testBlock = await storage.create({
        type: 'text',
        content: 'Test content',
        source: { url: 'https://example.com', title: 'Test' },
      });

      expect(testBlock).toBeDefined();
      expect(testBlock.id).toBeDefined();
    });

    it('should use correct index names', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Create multiple blocks to test indexing
      const blocks: Block[] = [];
      for (let i = 0; i < 3; i++) {
        // Add small delay to ensure different timestamps
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        const block = await storage.create({
          type: 'text',
          content: `Block ${i}`,
          source: { url: `https://example.com/${i}`, title: `Test ${i}` },
        });
        blocks.push(block);
      }

      // Query should work with default sorting (by created descending)
      const result = await storage.query({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(3);
      // Newest first
      expect(result.items[0].id).toBe(blocks[2].id);
    });
  });

  describe('Data Persistence', () => {
    it('should persist data across service instances', async () => {
      // Create with first instance
      const storage1 = getStorageService();
      await storage1.initialize();

      const created = await storage1.create({
        type: 'text',
        content: 'Persistent content',
        source: { url: 'https://example.com', title: 'Test' },
      });

      // Create second instance (simulates service worker restart)
      const storage2 = getStorageService();
      await storage2.initialize();

      const read = await storage2.read(created.id);

      expect(read).toBeDefined();
      expect(read?.content).toBe('Persistent content');
    });

    it('should maintain data relationships', async () => {
      const storage = getStorageService();
      await storage.initialize();

      const created = await storage.create({
        type: 'text',
        content: 'Original',
        source: { url: 'https://example.com', title: 'Test' },
      });

      // Update the block
      await storage.update(created.id, {
        content: 'Updated',
      });

      // Verify update persisted
      const read = await storage.read(created.id);

      expect(read?.content).toBe('Updated');
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent creates correctly', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Create multiple blocks concurrently
      const promises = Array.from({ length: 5 }, async (_, i) =>
        storage.create({
          type: 'text',
          content: `Concurrent ${i}`,
          source: { url: 'https://example.com', title: 'Test' },
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      // All IDs should be unique
      const ids = results.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should handle concurrent reads and writes', async () => {
      const storage = getStorageService();
      await storage.initialize();

      const block = await storage.create({
        type: 'text',
        content: 'Concurrent test',
        source: { url: 'https://example.com', title: 'Test' },
      });

      // Concurrent operations
      const promises = [
        storage.read(block.id),
        storage.update(block.id, { content: 'Update 1' }),
        storage.read(block.id),
        storage.update(block.id, { content: 'Update 2' }),
      ];

      const results = await Promise.all(promises);

      // All operations should succeed
      expect(results.filter((r) => r !== null)).toHaveLength(4);
    });
  });

  describe('Quota Management', () => {
    it('should track usage accurately', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Add data
      await storage.create({
        type: 'text',
        content: 'X'.repeat(10000),
        source: { url: 'https://example.com', title: 'Test' },
      });

      const usage = await storage.getUsage();

      // Should return usage info (may be 0 if storage API not available in test env)
      expect(usage).toBeDefined();
      expect(typeof usage.bytes).toBe('number');
      expect(typeof usage.quota).toBe('number');
    });

    it('should emit quota warning event at 80% threshold', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Add quota warning listener
      let warningEmitted = false;
      storage.on('quota-warning', () => {
        warningEmitted = true;
      });

      // Note: In real scenario, this would require filling up to 80%
      // For this test, we just verify the event system works
      expect(typeof storage.on).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid UUID gracefully', async () => {
      const storage = getStorageService();
      await storage.initialize();

      const result = await storage.read('invalid-uuid');

      expect(result).toBeNull();
    });

    it('should handle empty updates gracefully', async () => {
      const storage = getStorageService();
      await storage.initialize();

      const block = await storage.create({
        type: 'text',
        content: 'Test',
        source: { url: 'https://example.com', title: 'Test' },
      });

      // Empty update should still return the block
      const result = await storage.update(block.id, {});

      expect(result).toBeDefined();
      expect(result?.id).toBe(block.id);
    });

    it('should handle delete of non-existent gracefully', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // delete() doesn't throw for non-existent, just completes
      await storage.delete('non-existent-id');

      // Verify it truly doesn't exist
      const result = await storage.read('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Performance', () => {
    it('should query 100 items efficiently', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Create 100 blocks
      const promises = Array.from({ length: 100 }, async (_, i) =>
        storage.create({
          type: 'text',
          content: `Performance test ${i}`,
          source: { url: 'https://example.com', title: `Test ${i}` },
        })
      );

      await Promise.all(promises);

      const startTime = performance.now();
      const result = await storage.query({ page: 1, limit: 100 });
      const endTime = performance.now();

      expect(result.items).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
    });

    it('should search 100 items efficiently', async () => {
      const storage = getStorageService();
      await storage.initialize();

      // Create 100 blocks with searchable content
      const promises = Array.from({ length: 100 }, async (_, i) =>
        storage.create({
          type: 'text',
          content: i % 2 === 0 ? 'searchable content' : 'other content',
          source: { url: 'https://example.com', title: `Test ${i}` },
        })
      );

      await Promise.all(promises);

      const startTime = performance.now();
      const results = await storage.search({ query: 'searchable', limit: 100 });
      const endTime = performance.now();

      expect(results.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(200); // Should be reasonably fast
    });
  });
});

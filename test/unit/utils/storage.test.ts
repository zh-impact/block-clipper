/**
 * Unit tests for StorageService CRUD operations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// Setup fake IndexedDB before importing storage
import 'fake-indexeddb/auto';

import { getStorageService, type StorageService } from '../../../utils/storage';

describe('StorageService - CRUD Operations', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    // Clear all data before each test
    storageService = getStorageService();
    await storageService.initialize();

    // Clear any existing data
    const all = await storageService.query({ page: 1, limit: 1000 });
    for (const item of all.items) {
      await storageService.delete(item.id);
    }
  });

  afterEach(async () => {
    // Cleanup after each test
    if (storageService) {
      try {
        const all = await storageService.query({ page: 1, limit: 1000 });
        for (const item of all.items) {
          await storageService.delete(item.id);
        }
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('create()', () => {
    it('should create a block with generated UUID', async () => {
      const block = await storageService.create({
        type: 'text',
        content: 'Test content',
        source: {
          url: 'https://example.com',
          title: 'Test Page',
        },
      });

      expect(block).toBeDefined();
      expect(block.id).toBeDefined();
      expect(block.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(block.type).toBe('text');
      expect(block.content).toBe('Test content');
      expect(block.source.url).toBe('https://example.com');
    });

    it('should set createdAt and updatedAt timestamps', async () => {
      const beforeCreate = Date.now();
      const block = await storageService.create({
        type: 'text',
        content: 'Test',
        source: { url: 'https://example.com', title: 'Test' },
      });

      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
      expect(new Date(block.createdAt).getTime()).toBeGreaterThanOrEqual(beforeCreate);
      expect(new Date(block.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeCreate);
    });

    it('should accept custom metadata', async () => {
      const block = await storageService.create({
        type: 'text',
        content: 'Test',
        metadata: {
          customField: 'customValue',
        },
        source: { url: 'https://example.com', title: 'Test' },
      });

      expect(block.metadata).toBeDefined();
      expect(block.metadata.customField).toBe('customValue');
    });
  });

  describe('read()', () => {
    it('should retrieve a block by ID', async () => {
      const created = await storageService.create({
        type: 'text',
        content: 'Test content for read',
        source: { url: 'https://example.com', title: 'Test' },
      });

      const read = await storageService.read(created.id);

      expect(read).toBeDefined();
      expect(read?.id).toBe(created.id);
      expect(read?.content).toBe('Test content for read');
    });

    it('return null for non-existent ID', async () => {
      const result = await storageService.read('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('query()', () => {
    it('should return paginated results', async () => {
      // Create 5 blocks
      for (let i = 0; i < 5; i++) {
        await storageService.create({
          type: 'text',
          content: `Content ${i}`,
          source: { url: 'https://example.com', title: 'Test' },
        });
      }

      const result1 = await storageService.query({ page: 1, limit: 3 });
      expect(result1.items).toHaveLength(3);
      expect(result1.total).toBe(5);
      expect(result1.page).toBe(1);

      const result2 = await storageService.query({ page: 2, limit: 3 });
      expect(result2.items).toHaveLength(2);
      expect(result2.total).toBe(5);
      expect(result2.page).toBe(2);
    });

    it('should return empty result for no data', async () => {
      const result = await storageService.query({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should sort by createdAt descending', async () => {
      // Create blocks with delay to ensure different timestamps
      const block1 = await storageService.create({
        type: 'text',
        content: 'First',
        source: { url: 'https://example.com', title: 'Test' },
      });

      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay

      const block2 = await storageService.create({
        type: 'text',
        content: 'Second',
        source: { url: 'https://example.com', title: 'Test' },
      });

      const result = await storageService.query({ page: 1, limit: 10 });

      expect(result.items[0].id).toBe(block2.id); // Newest first
      expect(result.items[1].id).toBe(block1.id);
    });
  });

  describe('search()', () => {
    beforeEach(async () => {
      // Create test data
      await storageService.create({
        type: 'text',
        content: 'JavaScript programming tutorial',
        metadata: { tags: ['programming', 'javascript'] },
        source: { url: 'https://example.com/js', title: 'JS Guide' },
      });

      await storageService.create({
        type: 'text',
        content: 'Python tutorial for beginners',
        metadata: { tags: ['programming', 'python'] },
        source: { url: 'https://example.com/py', title: 'Python Guide' },
      });

      await storageService.create({
        type: 'code',
        content: 'function hello() { return "world"; }',
        source: { url: 'https://example.com/code', title: 'Code' },
      });
    });

    it('should search in content', async () => {
      const results = await storageService.search({ query: 'JavaScript', limit: 10 });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('JavaScript');
    });

    it('should search in metadata', async () => {
      const results = await storageService.search({ query: 'programming', limit: 10 });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(2); // 2 matches
    });

    it('should return empty array for no matches', async () => {
      const results = await storageService.search({ query: 'nonexistent', limit: 10 });

      expect(results).toEqual([]);
    });

    it('should limit results', async () => {
      const results = await storageService.search({ query: 'programming', limit: 1 });

      expect(results.length).toBe(1);
    });
  });

  describe('update()', () => {
    it('should update block content', async () => {
      const created = await storageService.create({
        type: 'text',
        content: 'Original content',
        source: { url: 'https://example.com', title: 'Test' },
      });

      // Add delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await storageService.update(created.id, {
        content: 'Updated content',
      });

      expect(updated).toBeDefined();
      expect(updated.content).toBe('Updated content');
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('should update metadata', async () => {
      const created = await storageService.create({
        type: 'text',
        content: 'Content',
        metadata: { tags: ['original'] },
        source: { url: 'https://example.com', title: 'Test' },
      });

      const updated = await storageService.update(created.id, {
        metadata: { tags: ['updated'] },
      });

      expect(updated.metadata?.tags).toEqual(['updated']);
    });

    it('should reject for non-existent ID', async () => {
      await expect(storageService.update('non-existent-id', {
        content: 'Updated',
      })).rejects.toThrow();
    });
  });

  describe('delete()', () => {
    it('should delete a block', async () => {
      const created = await storageService.create({
        type: 'text',
        content: 'To be deleted',
        source: { url: 'https://example.com', title: 'Test' },
      });

      await storageService.delete(created.id);

      // Verify it's gone
      const read = await storageService.read(created.id);
      expect(read).toBeNull();
    });
  });

  describe('deleteMany()', () => {
    it('should delete multiple blocks', async () => {
      const ids: string[] = [];
      for (let i = 0; i < 3; i++) {
        const block = await storageService.create({
          type: 'text',
          content: `Delete test ${i}`,
          source: { url: 'https://example.com', title: 'Test' },
        });
        ids.push(block.id);
      }

      const deletedCount = await storageService.deleteMany(ids);

      expect(deletedCount).toBe(3);

      // Verify all deleted
      for (const id of ids) {
        const read = await storageService.read(id);
        expect(read).toBeNull();
      }
    });

    it('return 0 for empty array', async () => {
      const result = await storageService.deleteMany([]);

      expect(result).toBe(0);
    });
  });

  describe('getUsage()', () => {
    it('should return storage usage statistics', async () => {
      const usage = await storageService.getUsage();

      expect(usage).toBeDefined();
      expect(typeof usage.bytes).toBe('number');
      expect(typeof usage.quota).toBe('number');
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });

    it('should handle missing storage API gracefully', async () => {
      // navigator.storage might not be available in test environment
      const usage = await storageService.getUsage();

      // Should return fallback values
      expect(usage.bytes).toBeGreaterThanOrEqual(0);
      expect(usage.quota).toBeGreaterThanOrEqual(0);
    });
  });
});

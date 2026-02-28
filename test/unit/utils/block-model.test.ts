/**
 * Unit tests for Block model utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBlock,
  isValidBlock,
  createBlockSource,
  isValidBlockSource,
  generateUUID,
  isValidUUID,
  type Block,
  type BlockSource,
  type CreateBlockInput,
  type BlockType,
} from '../../../utils/block-model';

describe('Block Model - UUID Functions', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID v4', () => {
      const uuid = generateUUID();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });

    it('should generate UUIDs with correct format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should return true for UUIDs with different characters', () => {
      expect(isValidUUID('00000000-0000-4000-8000-000000000000')).toBe(true);
      expect(isValidUUID('ffffffff-ffff-4fff-bfff-ffffffffffff')).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('12345678-1234-1234-1234-123456789012')).toBe(false); // Version should be 4
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false); // Too short
    });

    it('should return false for non-string values', () => {
      expect(isValidUUID(null as unknown as string)).toBe(false);
      expect(isValidUUID(undefined as unknown as string)).toBe(false);
      expect(isValidUUID(123 as unknown as string)).toBe(false);
      expect(isValidUUID({} as unknown as string)).toBe(false);
    });
  });
});

describe('Block Model - BlockSource Functions', () => {
  describe('createBlockSource', () => {
    it('should create a BlockSource with required fields', () => {
      const source = createBlockSource('https://example.com', 'Example Page');

      expect(source.url).toBe('https://example.com');
      expect(source.title).toBe('Example Page');
      expect(source.favicon).toBeUndefined();
    });

    it('should create a BlockSource with optional favicon', () => {
      const source = createBlockSource(
        'https://example.com',
        'Example Page',
        'https://example.com/favicon.ico'
      );

      expect(source.url).toBe('https://example.com');
      expect(source.title).toBe('Example Page');
      expect(source.favicon).toBe('https://example.com/favicon.ico');
    });

    it('should handle empty favicon string', () => {
      const source = createBlockSource('https://example.com', 'Example Page', '');

      expect(source.favicon).toBe('');
    });
  });

  describe('isValidBlockSource', () => {
    it('should return true for valid BlockSource', () => {
      const source: BlockSource = {
        url: 'https://example.com',
        title: 'Example Page',
      };

      expect(isValidBlockSource(source)).toBe(true);
    });

    it('should return true for valid BlockSource with favicon', () => {
      const source: BlockSource = {
        url: 'https://example.com',
        title: 'Example Page',
        favicon: 'https://example.com/favicon.ico',
      };

      expect(isValidBlockSource(source)).toBe(true);
    });

    it('should return false for invalid BlockSource', () => {
      expect(isValidBlockSource(null)).toBe(false);
      expect(isValidBlockSource(undefined)).toBe(false);
      expect(isValidBlockSource({})).toBe(false);
      expect(isValidBlockSource({ url: 'https://example.com' })).toBe(false); // Missing title
      expect(isValidBlockSource({ title: 'Example' } as unknown as BlockSource)).toBe(false); // Missing url
    });

    it('should return false for BlockSource with invalid types', () => {
      expect(isValidBlockSource({ url: 123, title: 'Example' } as unknown as BlockSource)).toBe(false);
      expect(isValidBlockSource({ url: 'https://example.com', title: 123 } as unknown as BlockSource)).toBe(false);
      expect(isValidBlockSource({
        url: 'https://example.com',
        title: 'Example',
        favicon: 123,
      } as unknown as BlockSource)).toBe(false);
    });
  });
});

describe('Block Model - Block Functions', () => {
  describe('createBlock', () => {
    it('should create a Block with generated ID and timestamps', () => {
      const input: CreateBlockInput = {
        type: 'text',
        content: 'Hello, world!',
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
      };

      const block = createBlock(input);

      expect(block.id).toBeDefined();
      expect(isValidUUID(block.id)).toBe(true);
      expect(block.type).toBe('text');
      expect(block.content).toBe('Hello, world!');
      expect(block.createdAt).toBeDefined();
      expect(block.updatedAt).toBeDefined();
      expect(block.source).toEqual({
        url: 'https://example.com',
        title: 'Example Page',
      });
    });

    it('should create a Block with metadata', () => {
      const input: CreateBlockInput = {
        type: 'code',
        content: 'console.log("Hello");',
        metadata: {
          language: 'javascript',
        },
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
      };

      const block = createBlock(input);

      expect(block.metadata).toEqual({
        language: 'javascript',
      });
    });

    it('should create a Block with empty metadata if not provided', () => {
      const input: CreateBlockInput = {
        type: 'text',
        content: 'Hello',
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
      };

      const block = createBlock(input);

      expect(block.metadata).toEqual({});
    });

    it('should create Blocks with all supported types', () => {
      const types: BlockType[] = ['text', 'heading', 'code', 'quote', 'list'];

      types.forEach((type) => {
        const input: CreateBlockInput = {
          type,
          content: `Content for ${type}`,
          source: {
            url: 'https://example.com',
            title: 'Example Page',
          },
        };

        const block = createBlock(input);

        expect(block.type).toBe(type);
      });
    });

    it('should generate unique IDs for each Block', () => {
      const input: CreateBlockInput = {
        type: 'text',
        content: 'Content',
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
      };

      const block1 = createBlock(input);
      const block2 = createBlock(input);

      expect(block1.id).not.toBe(block2.id);
    });

    it('should set createdAt and updatedAt to the same time', () => {
      const input: CreateBlockInput = {
        type: 'text',
        content: 'Content',
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
      };

      const block = createBlock(input);

      expect(block.createdAt).toBe(block.updatedAt);
      expect(new Date(block.createdAt).toISOString()).toBe(block.createdAt);
    });
  });

  describe('isValidBlock', () => {
    it('should return true for valid Block', () => {
      const block: Block = {
        id: generateUUID(),
        type: 'text',
        content: 'Hello, world!',
        metadata: {},
        source: {
          url: 'https://example.com',
          title: 'Example Page',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(block)).toBe(true);
    });

    it('should return true for Block with all fields populated', () => {
      const block: Block = {
        id: generateUUID(),
        type: 'code',
        content: 'console.log("Hello");',
        metadata: {
          language: 'javascript',
          lineCount: 1,
        },
        source: {
          url: 'https://example.com',
          title: 'Example Page',
          favicon: 'https://example.com/favicon.ico',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(block)).toBe(true);
    });

    it('should return false for null or undefined', () => {
      expect(isValidBlock(null)).toBe(false);
      expect(isValidBlock(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isValidBlock('string' as unknown as Block)).toBe(false);
      expect(isValidBlock(123 as unknown as Block)).toBe(false);
      expect(isValidBlock([] as unknown as Block)).toBe(false);
    });

    it('should return false for Block with invalid ID', () => {
      const block = {
        id: 'not-a-uuid',
        type: 'text',
        content: 'Content',
        metadata: {},
        source: {
          url: 'https://example.com',
          title: 'Example',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(block as unknown as Block)).toBe(false);
    });

    it('should return false for Block with invalid type', () => {
      const block = {
        id: generateUUID(),
        type: 'invalid-type',
        content: 'Content',
        metadata: {},
        source: {
          url: 'https://example.com',
          title: 'Example',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(block as unknown as Block)).toBe(false);
    });

    it('should return false for Block with missing required fields', () => {
      const blockWithoutContent = {
        id: generateUUID(),
        type: 'text',
        metadata: {},
        source: {
          url: 'https://example.com',
          title: 'Example',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(blockWithoutContent as unknown as Block)).toBe(false);

      const blockWithoutSource = {
        id: generateUUID(),
        type: 'text',
        content: 'Content',
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(blockWithoutSource as unknown as Block)).toBe(false);
    });

    it('should return false for Block with invalid source', () => {
      const block = {
        id: generateUUID(),
        type: 'text',
        content: 'Content',
        metadata: {},
        source: {
          url: 123, // Invalid type
          title: 'Example',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(isValidBlock(block as unknown as Block)).toBe(false);
    });
  });
});

/**
 * Block-based content model for Block Clipper
 * Inspired by Notion/Contentful's block-based content structure
 */

// Import UUID utilities for use in factory functions
import { generateUUID, isValidUUID } from './uuid';

/**
 * Supported block types
 * @description Discriminator for different content types
 */
export type BlockType = 'text' | 'heading' | 'code' | 'quote' | 'list';

/**
 * Source information for clipped content
 */
export interface BlockSource {
  url: string;
  title: string;
  favicon?: string;
}

/**
 * Main Block interface
 * @description Unified content abstraction that can represent various content types
 */
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata: {
    [key: string]: unknown;
  };
  source: BlockSource;
  createdAt: string;  // ISO 8601 timestamp
  updatedAt: string;  // ISO 8601 timestamp
}

/**
 * Input interface for creating blocks (without auto-generated fields)
 */
export interface CreateBlockInput {
  type: BlockType;
  content: string;
  metadata?: Record<string, unknown>;
  source: BlockSource;
}

/**
 * Options for querying blocks
 */
export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Options for searching blocks
 */
export interface SearchQuery {
  query: string;
  fields?: Array<'content' | 'metadata' | 'source'>;
  limit?: number;
}

/**
 * Result of a query operation
 */
export interface QueryResult {
  items: Block[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  bytes: number;
  percentage: number;
  quota: number;
}

/**
 * Create a new Block object with generated ID and timestamps
 * @param input Block creation input
 * @returns Complete Block object
 */
export function createBlock(input: CreateBlockInput): Block {
  const now = new Date().toISOString();

  return {
    id: generateUUID(),
    type: input.type,
    content: input.content,
    metadata: input.metadata || {},
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate if an object is a valid Block
 * @param block Object to validate
 * @returns true if valid Block
 */
export function isValidBlock(block: unknown): block is Block {
  if (typeof block !== 'object' || block === null) {
    return false;
  }

  const b = block as Partial<Block>;

  return (
    typeof b.id === 'string' &&
    isValidUUID(b.id) &&
    typeof b.type === 'string' &&
    ['text', 'heading', 'code', 'quote', 'list'].includes(b.type) &&
    typeof b.content === 'string' &&
    typeof b.metadata === 'object' &&
    b.metadata !== null &&
    typeof b.source === 'object' &&
    b.source !== null &&
    typeof b.source.url === 'string' &&
    typeof b.source.title === 'string' &&
    typeof b.createdAt === 'string' &&
    typeof b.updatedAt === 'string'
  );
}

/**
 * Create a BlockSource object
 * @param url Source URL
 * @param title Source title
 * @param favicon Optional favicon URL
 * @returns BlockSource object
 */
export function createBlockSource(url: string, title: string, favicon?: string): BlockSource {
  return {
    url,
    title,
    favicon,
  };
}

/**
 * Validate if an object is a valid BlockSource
 * @param source Object to validate
 * @returns true if valid BlockSource
 */
export function isValidBlockSource(source: unknown): source is BlockSource {
  if (typeof source !== 'object' || source === null) {
    return false;
  }

  const s = source as Partial<BlockSource>;

  return (
    typeof s.url === 'string' &&
    typeof s.title === 'string' &&
    (s.favicon === undefined || typeof s.favicon === 'string')
  );
}

// Re-export UUID utilities
export { generateUUID, isValidUUID };

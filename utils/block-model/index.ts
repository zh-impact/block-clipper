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
  contentSource: 'selection' | 'full-page'; // Indicates how content was saved
}

/**
 * Main Block interface
 * @description Unified content abstraction that can represent various content types
 */
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  title?: string;         // Optional title for the block (can be AI-generated)
  aiGenerated?: boolean;  // Flag indicating if title was AI-generated
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
  title?: string;         // Optional title
  aiGenerated?: boolean;  // Optional AI generation flag
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
    title: input.title,
    aiGenerated: input.aiGenerated,
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
    // title is optional, but if present must be a string
    (b.title === undefined || typeof b.title === 'string') &&
    // aiGenerated is optional, but if present must be a boolean
    (b.aiGenerated === undefined || typeof b.aiGenerated === 'boolean') &&
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
 * @param contentSource How content was saved ('selection' | 'full-page'), defaults to 'selection'
 * @returns BlockSource object
 */
export function createBlockSource(
  url: string,
  title: string,
  favicon?: string,
  contentSource: 'selection' | 'full-page' = 'selection'
): BlockSource {
  return {
    url,
    title,
    favicon,
    contentSource,
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
    (s.favicon === undefined || typeof s.favicon === 'string') &&
    // contentSource is required for new blocks, but for backward compatibility
    // we allow it to be undefined (will be treated as 'selection')
    (s.contentSource === undefined || typeof s.contentSource === 'string') &&
    (s.contentSource === undefined || ['selection', 'full-page'].includes(s.contentSource))
  );
}

// Re-export UUID utilities
export { generateUUID, isValidUUID };

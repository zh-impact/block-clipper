/**
 * StorageService - Unified IndexedDB storage abstraction layer
 * @description Provides async CRUD interface for Block storage with pagination and search
 */

import type {
  Block,
  CreateBlockInput,
  QueryOptions,
  SearchQuery,
  QueryResult,
  StorageUsage,
} from '../block-model';
import { generateUUID } from '../block-model';
import type { ImportRecord } from '../importer';
import { DB_CONFIG, STORES, INDEXES } from './schema';
import { handleDatabaseUpgrade, validateSchema } from './migrations';

export interface ImportSummary {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Event types emitted by StorageService
 */
type StorageEventType = 'quota-warning' | 'error' | 'ready';

/**
 * Storage service event listener
 */
type StorageEventListener = (event: StorageEvent) => void;

/**
 * Storage event
 */
interface StorageEvent {
  type: StorageEventType;
  data?: unknown;
}

/**
 * StorageService class
 * @description Manages IndexedDB operations for Block storage
 */
export class StorageService {
  private db: IDBDatabase | null = null;
  private initializing: Promise<void> | null = null;
  private listeners: Map<StorageEventType, Set<StorageEventListener>> = new Map();

  /**
   * Initialize the database connection
   * @returns Promise that resolves when database is ready
   */
  async initialize(): Promise<void> {
    if (this.initializing) {
      return this.initializing;
    }

    this.initializing = this._initialize();
    return this.initializing;
  }

  private async _initialize(): Promise<void> {
    // Check if indexedDB is available (not during pre-rendering)
    if (typeof indexedDB === 'undefined') {
      console.warn('[DB] indexedDB not available, skipping initialization');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        console.error('[DB] Failed to open database:', request.error);
        reject(new Error(`Failed to open database: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;

        // Validate schema
        if (!validateSchema(this.db)) {
          reject(new Error('Database schema validation failed'));
          return;
        }

        console.log('[DB] Database initialized successfully');
        this.emit('ready');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        handleDatabaseUpgrade(event as IDBVersionChangeEvent, db);
      };
    });
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInitialized(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db;
  }

  /**
   * Create a new block
   * @param input Block data without id and timestamps
   * @returns Created block with generated id and timestamps
   */
  async create(input: CreateBlockInput): Promise<Block> {
    const db = await this.ensureInitialized();
    const now = new Date().toISOString();

    const block: Block = {
      id: generateUUID(),
      type: input.type,
      content: input.content,
      metadata: input.metadata || {},
      source: input.source,
      createdAt: now,
      updatedAt: now,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readwrite');
      const store = transaction.objectStore(STORES.BLOCKS);

      const request = store.add(block);

      request.onsuccess = () => resolve(block);
      request.onerror = () => {
        const error = request.error;
        console.error('[DB] Failed to create block:', error);
        reject(new Error(`Failed to create block: ${error}`));
      };
    });
  }

  /**
   * Read a block by id
   * @param id Block id
   * @returns Block or null if not found
   */
  async read(id: string): Promise<Block | null> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readonly');
      const store = transaction.objectStore(STORES.BLOCKS);

      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        const error = request.error;
        console.error('[DB] Failed to read block:', error);
        reject(new Error(`Failed to read block: ${error}`));
      };
    });
  }

  /**
   * Query blocks with pagination
   * @param options Query options
   * @returns Query result with items and pagination info
   */
  async query(options: QueryOptions = {}): Promise<QueryResult> {
    const db = await this.ensureInitialized();

    const {
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readonly');
      const store = transaction.objectStore(STORES.BLOCKS);

      // Use index for sorting
      const indexName = sortBy === 'createdAt' ? INDEXES.BY_CREATED : INDEXES.BY_CREATED;
      const index = store.index(indexName);

      // Get total count
      const countRequest = store.count();
      let total = 0;

      countRequest.onsuccess = () => {
        total = countRequest.result;

        // Calculate offset and bounds
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(total / limit);

        // Open cursor with direction
        const direction = sortOrder === 'desc' ? 'prev' : 'next';
        const cursorRequest = index.openCursor(null, direction);

        const items: Block[] = [];
        let skipped = 0;

        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;

          if (!cursor) {
            // Sort items by createdAt descending (newest first) before returning
            const sortedItems = items.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // DEBUG: Log sorting result
            console.log('[DB Query] Cursor finished, sorting items:', {
              originalCount: items.length,
              sortedCount: sortedItems.length,
              firstItem: sortedItems[0] ? { id: sortedItems[0].id, createdAt: sortedItems[0].createdAt } : null,
              lastItem: sortedItems[sortedItems.length - 1] ? { id: sortedItems[sortedItems.length - 1].id, createdAt: sortedItems[sortedItems.length - 1].createdAt } : null,
            });

            resolve({
              items: sortedItems,
              total,
              page,
              limit,
              totalPages,
            });
            return;
          }

          // Skip to offset
          if (skipped < offset) {
            skipped++;
            cursor.advance(1);
            return;
          }

          // Collect items up to limit
          if (items.length < limit) {
            items.push(cursor.value);
            cursor.continue();
          } else {
            // Sort items by createdAt descending (newest first) before returning
            const sortedItems = items.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            // DEBUG: Log sorting result
            console.log('[DB Query] Limit reached, sorting items:', {
              limitReached: true,
              itemCount: items.length,
              sortedCount: sortedItems.length,
              firstItem: sortedItems[0] ? { id: sortedItems[0].id, createdAt: sortedItems[0].createdAt } : null,
              lastItem: sortedItems[sortedItems.length - 1] ? { id: sortedItems[sortedItems.length - 1].id, createdAt: sortedItems[sortedItems.length - 1].createdAt } : null,
            });

            resolve({
              items: sortedItems,
              total,
              page,
              limit,
              totalPages,
            });
          }
        };

        cursorRequest.onerror = () => {
          const error = cursorRequest.error;
          console.error('[DB] Query failed:', error);
          reject(new Error(`Query failed: ${error}`));
        };
      };

      countRequest.onerror = () => {
        const error = countRequest.error;
        console.error('[DB] Count failed:', error);
        reject(new Error(`Count failed: ${error}`));
      };
    });
  }

  /**
   * Search blocks by content and metadata
   * @param query Search query options
   * @returns Array of matching blocks (sorted by createdAt descending)
   */
  async search(query: SearchQuery): Promise<Block[]> {
    const db = await this.ensureInitialized();
    const { query: searchTerm, fields = ['content', 'metadata', 'source'], limit } = query;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readonly');
      const store = transaction.objectStore(STORES.BLOCKS);

      // Use createdAt index for consistent sorting (newest first)
      const index = store.index(INDEXES.BY_CREATED);

      const results: Block[] = [];
      const lowerSearchTerm = searchTerm.toLowerCase();

      // Open cursor in reverse order (newest first)
      const cursorRequest = index.openCursor(null, 'prev');
      let count = 0;

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;

        if (!cursor || (limit && count >= limit)) {
          // Sort results by createdAt descending (newest first) before returning
          const sortedResults = results.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          resolve(sortedResults);
          return;
        }

        const block = cursor.value;

        // Search in specified fields
        let matches = false;

        if (fields.includes('content') && block.content.toLowerCase().includes(lowerSearchTerm)) {
          matches = true;
        }

        if (!matches && fields.includes('metadata')) {
          const metadataStr = JSON.stringify(block.metadata).toLowerCase();
          if (metadataStr.includes(lowerSearchTerm)) {
            matches = true;
          }
        }

        if (!matches && fields.includes('source')) {
          const sourceStr = `${block.source.url} ${block.source.title}`.toLowerCase();
          if (sourceStr.includes(lowerSearchTerm)) {
            matches = true;
          }
        }

        if (matches) {
          results.push(block);
          count++;
        }

        cursor.continue();
      };

      cursorRequest.onerror = () => {
        const error = cursorRequest.error;
        console.error('[DB] Search failed:', error);
        reject(new Error(`Search failed: ${error}`));
      };
    });
  }

  /**
   * Update a block
   * @param id Block id
   * @param updates Partial block data to update
   * @returns Updated block
   */
  async update(id: string, updates: Partial<Block>): Promise<Block> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      // First, read the existing block
      this.read(id).then((existing) => {
        if (!existing) {
          reject(new Error(`Block not found: ${id}`));
          return;
        }

        // Merge updates
        const updated: Block = {
          ...existing,
          ...updates,
          id, // Ensure id doesn't change
          updatedAt: new Date().toISOString(),
        };

        const transaction = db.transaction([STORES.BLOCKS], 'readwrite');
        const store = transaction.objectStore(STORES.BLOCKS);

        const request = store.put(updated);

        request.onsuccess = () => resolve(updated);
        request.onerror = () => {
          const error = request.error;
          console.error('[DB] Failed to update block:', error);
          reject(new Error(`Failed to update block: ${error}`));
        };
      }).catch(reject);
    });
  }

  /**
   * Delete a block
   * @param id Block id
   */
  async delete(id: string): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readwrite');
      const store = transaction.objectStore(STORES.BLOCKS);

      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = request.error;
        console.error('[DB] Failed to delete block:', error);
        reject(new Error(`Failed to delete block: ${error}`));
      };
    });
  }

  /**
   * Delete multiple blocks
   * @param ids Array of block ids
   * @returns Number of deleted blocks
   */
  async deleteMany(ids: string[]): Promise<number> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readwrite');
      const store = transaction.objectStore(STORES.BLOCKS);

      let deleted = 0;

      transaction.oncomplete = () => resolve(deleted);
      transaction.onerror = () => {
        const error = transaction.error;
        console.error('[DB] Failed to delete blocks:', error);
        reject(new Error(`Failed to delete blocks: ${error}`));
      };

      for (const id of ids) {
        const request = store.delete(id);

        request.onsuccess = () => {
          deleted++;
        };

        request.onerror = () => {
          console.warn(`[DB] Failed to delete block ${id}`);
        };
      }
    });
  }

  private async addBlock(block: Block): Promise<void> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readwrite');
      const store = transaction.objectStore(STORES.BLOCKS);
      const request = store.add(block);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to import block: ${request.error}`));
    });
  }

  async isDuplicateImportRecord(record: ImportRecord): Promise<boolean> {
    const db = await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.BLOCKS], 'readonly');
      const store = transaction.objectStore(STORES.BLOCKS);
      const sourceIndex = store.index(INDEXES.BY_SOURCE);
      const range = IDBKeyRange.only(record.source.url);
      const request = sourceIndex.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;

        if (!cursor) {
          resolve(false);
          return;
        }

        const existing = cursor.value as Block;
        const isDuplicate =
          existing.content === record.content
          && existing.source.url === record.source.url
          && existing.createdAt === record.createdAt;

        if (isDuplicate) {
          resolve(true);
          return;
        }

        cursor.continue();
      };

      request.onerror = () => reject(new Error(`Failed duplicate check: ${request.error}`));
    });
  }

  async importRecords(records: ImportRecord[], batchSize = 50): Promise<ImportSummary> {
    const summary: ImportSummary = {
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      for (const record of batch) {
        try {
          const isDuplicate = await this.isDuplicateImportRecord(record);
          if (isDuplicate) {
            summary.skipped++;
            continue;
          }

          const block: Block = {
            id: generateUUID(),
            type: record.type,
            content: record.content,
            metadata: record.metadata || {},
            source: record.source,
            createdAt: record.createdAt,
            updatedAt: record.createdAt,
          };

          await this.addBlock(block);
          summary.imported++;
        } catch (error) {
          summary.failed++;
          summary.errors.push(error instanceof Error ? error.message : 'Unknown import error');
        }
      }
    }

    return summary;
  }

  /**
   * Get storage usage information
   * @returns Storage usage data
   */
  async getUsage(): Promise<StorageUsage> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (usage / quota) * 100 : 0;

        // Check quota threshold
        if (percentage > 80) {
          this.emit('quota-warning', { usage, quota, percentage });
        }

        return {
          bytes: usage,
          percentage,
          quota,
        };
      } catch (error) {
        console.error('[DB] Failed to get storage estimate:', error);
      }
    }

    // Fallback: return zeros
    return {
      bytes: 0,
      percentage: 0,
      quota: 0,
    };
  }

  /**
   * Add event listener
   * @param type Event type
   * @param listener Event listener function
   */
  on(type: StorageEventType, listener: StorageEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  /**
   * Remove event listener
   * @param type Event type
   * @param listener Event listener function
   */
  off(type: StorageEventType, listener: StorageEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit event to listeners
   * @param type Event type
   * @param data Event data
   */
  private emit(type: StorageEventType, data?: unknown): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const event: StorageEvent = { type, data };
      listeners.forEach((listener) => listener(event));
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initializing = null;
    }
  }
}

/**
 * Singleton instance of StorageService
 */
let storageServiceInstance: StorageService | null = null;

/**
 * Get or create the StorageService singleton instance
 * @returns StorageService instance
 */
export function getStorageService(): StorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new StorageService();
  }
  return storageServiceInstance;
}

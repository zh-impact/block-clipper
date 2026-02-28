/**
 * IndexedDB schema for Block Clipper
 * @description Database name, version, and object store definitions
 */

import type { Block } from '../block-model';

/**
 * Database configuration
 */
export const DB_CONFIG = {
  name: 'block-clipper-db',
  version: 1,
} as const;

/**
 * Object store names
 */
export const STORES = {
  BLOCKS: 'blocks',
} as const;

/**
 * Index names
 */
export const INDEXES = {
  BY_CREATED: 'by-created',
  BY_TYPE: 'by-type',
  BY_SOURCE: 'by-source',
} as const;

/**
 * Database schema definition
 */
export interface BlockClipperDBSchema {
  [STORES.BLOCKS]: {
    key: string;
    value: Block;
    indexes: {
      [INDEXES.BY_CREATED]: string;
      [INDEXES.BY_TYPE]: Block['type'];
      [INDEXES.BY_SOURCE]: string;
    };
  };
}

/**
 * Create object stores and indexes for database initialization
 * @param db IDBDatabase instance
 * @param oldVersion Previous database version
 */
export function createObjectStores(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    // Create blocks object store
    const blockStore = db.createObjectStore(STORES.BLOCKS, { keyPath: 'id' });

    // Create indexes
    blockStore.createIndex(INDEXES.BY_CREATED, 'createdAt', { unique: false });
    blockStore.createIndex(INDEXES.BY_TYPE, 'type', { unique: false });
    blockStore.createIndex(INDEXES.BY_SOURCE, 'source.url', { unique: false });
  }
}

/**
 * Database migration handlers for Block Clipper
 * @description Handles version upgrades and data migrations
 */

import type { BlockClipperDBSchema } from './schema';
import { STORES, DB_CONFIG } from './schema';

/**
 * Handle database upgrade events
 * @param event IDBVersionChangeEvent
 * @param db IDBDatabase instance
 */
export function handleDatabaseUpgrade(
  event: IDBVersionChangeEvent,
  db: IDBDatabase
): void {
  const oldVersion = event.oldVersion;

  console.log(`[DB] Upgrading from version ${oldVersion} to ${db.version}`);

  // Version 1 schema
  if (oldVersion < 1) {
    migrateToVersion1(db);
  }

  // Future migrations can be added here
  // if (oldVersion < 2) {
  //   migrateToVersion2(db);
  // }
}

/**
 * Migrate to version 1 schema
 * @param db IDBDatabase instance
 */
function migrateToVersion1(db: IDBDatabase): void {
  console.log('[DB] Creating version 1 schema');

  // Create blocks object store
  const blockStore = db.createObjectStore(STORES.BLOCKS, { keyPath: 'id' });

  // Create indexes
  blockStore.createIndex('by-created', 'createdAt', { unique: false });
  blockStore.createIndex('by-type', 'type', { unique: false });
  blockStore.createIndex('by-source', 'source.url', { unique: false });
}

/**
 * Future migration: Add tags support (example)
 * @param db IDBDatabase instance
 */
// function migrateToVersion2(db: IDBDatabase): void {
//   console.log('[DB] Migrating to version 2 (adding tags)');
//   const transaction = db.transaction([STORES.BLOCKS], 'versionchange');
//   const blockStore = transaction.objectStore(STORES.BLOCKS);
//
//   // Add new index for tags
//   if (!blockStore.indexNames.contains('by-tags')) {
//     blockStore.createIndex('by-tags', 'metadata.tags', { multi: true });
//   }
// }

/**
 * Validate database schema
 * @param db IDBDatabase instance
 * @returns true if schema is valid
 */
export function validateSchema(db: IDBDatabase): boolean {
  try {
    // Check if blocks store exists
    if (!db.objectStoreNames.contains(STORES.BLOCKS)) {
      console.error('[DB] Blocks store not found');
      return false;
    }

    // Check if indexes exist (in a transaction)
    const transaction = db.transaction([STORES.BLOCKS], 'readonly');
    const blockStore = transaction.objectStore(STORES.BLOCKS);

    const requiredIndexes = ['by-created', 'by-type', 'by-source'];
    for (const indexName of requiredIndexes) {
      if (!blockStore.indexNames.contains(indexName)) {
        console.error(`[DB] Index ${indexName} not found`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[DB] Schema validation failed:', error);
    return false;
  }
}

/**
 * Storage module exports
 */

export { StorageService, getStorageService } from './StorageService';
export * from './schema';
export { handleDatabaseUpgrade, validateSchema } from './migrations';

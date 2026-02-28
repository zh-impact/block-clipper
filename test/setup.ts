/**
 * Vitest setup file
 * @description Global test configuration and mocks
 */

// Mock crypto.randomUUID for environments that don't support it
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = {} as Crypto;
}

if (!globalThis.crypto.randomUUID) {
  globalThis.crypto.randomUUID = (() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }) as unknown as () => `${string}-${string}-${string}-${string}-${string}`;
}

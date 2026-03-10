import { describe, expect, it, vi } from 'vitest';
import { getImportFileSizeError, runImportFlow } from '../../../entrypoints/sidepanel/importFlow';

describe('sidepanel import flow', () => {
  it('handles successful import flow', async () => {
    const storage = {
      importRecords: vi.fn(async () => ({
        imported: 1,
        skipped: 0,
        failed: 0,
        errors: [],
      })),
    };

    const content = JSON.stringify([
      {
        type: 'text',
        content: 'hello',
        source: { url: 'https://example.com', title: 'Example' },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const result = await runImportFlow(content, storage);

    expect(storage.importRecords).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('throws on invalid file-level JSON', async () => {
    const storage = {
      importRecords: vi.fn(),
    };

    await expect(runImportFlow('not json', storage)).rejects.toThrow('Import file is not valid JSON');
    expect(storage.importRecords).not.toHaveBeenCalled();
  });

  it('combines parse failures with storage failures for partial outcomes', async () => {
    const storage = {
      importRecords: vi.fn(async () => ({
        imported: 1,
        skipped: 0,
        failed: 1,
        errors: ['storage failed'],
      })),
    };

    const content = JSON.stringify([
      {
        type: 'text',
        content: 'ok',
        source: { url: 'https://example.com', title: 'Example' },
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        type: 'text',
        source: { url: 'https://example.com', title: 'Missing content' },
      },
    ]);

    const result = await runImportFlow(content, storage);

    expect(result.imported).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.errors.length).toBe(2);
    expect(result.parseFailures.length).toBe(1);
  });

  it('returns oversized file error', () => {
    expect(getImportFileSizeError(11 * 1024 * 1024)).toContain('Maximum supported size');
  });

  it('supports markdown import flow', async () => {
    const storage = {
      importRecords: vi.fn(async () => ({
        imported: 1,
        skipped: 0,
        failed: 0,
        errors: [],
      })),
    };

    const content = `---
type: text
created_at: 2026-01-01T00:00:00.000Z
source_url: https://example.com
source_title: Example
---

Hello markdown`; 

    const result = await runImportFlow(content, storage, 'markdown');

    expect(storage.importRecords).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(1);
  });
});

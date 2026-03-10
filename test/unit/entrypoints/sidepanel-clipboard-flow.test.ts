import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Block } from '../../../utils/block-model';

vi.mock('../../../utils/clipboard', () => ({
  readTextFromClipboard: vi.fn(),
}));

vi.mock('../../../utils/exporter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/exporter')>();
  return {
    ...actual,
    exportBlocksToClipboard: vi.fn(),
  };
});

import { readTextFromClipboard } from '../../../utils/clipboard';
import { exportBlocksToClipboard as exportBlocksByFormat } from '../../../utils/exporter';
import { exportBlocksToClipboard, importFromClipboard } from '../../../entrypoints/sidepanel/clipboardFlow';

const blocks: Block[] = [
  {
    id: '1',
    type: 'text',
    content: 'a',
    metadata: {},
    source: { url: 'https://example.com', title: 'Example' },
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  },
];

describe('sidepanel clipboard flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('exports blocks through shared exporter helper', async () => {
    vi.mocked(exportBlocksByFormat).mockResolvedValue({ ok: true, content: 'json-content' });

    const result = await exportBlocksToClipboard(blocks, 'json');

    expect(exportBlocksByFormat).toHaveBeenCalledWith(blocks, 'json');
    expect(result.ok).toBe(true);
    expect(result.copiedText).toBe('json-content');
  });

  it('imports from clipboard via import pipeline', async () => {
    vi.mocked(readTextFromClipboard).mockResolvedValue({
      ok: true,
      text: JSON.stringify([
        {
          type: 'text',
          content: 'from clipboard',
          source: { url: 'https://example.com', title: 'Example' },
          createdAt: '2026-03-10T00:00:00.000Z',
        },
      ]),
    });

    const storage = {
      importRecords: vi.fn(async () => ({ imported: 1, skipped: 0, failed: 0, errors: [] })),
    };

    const result = await importFromClipboard(storage, 'json');

    expect(storage.importRecords).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(1);
  });

  it('passes markdown format to exporter helper', async () => {
    vi.mocked(exportBlocksByFormat).mockResolvedValue({ ok: true, content: 'markdown-content' });

    const result = await exportBlocksToClipboard(blocks, 'markdown');

    expect(exportBlocksByFormat).toHaveBeenCalledWith(blocks, 'markdown');
    expect(result.ok).toBe(true);
  });

  it('surfaces clipboard read failures', async () => {
    vi.mocked(readTextFromClipboard).mockResolvedValue({ ok: false, error: 'permission denied' });

    const storage = {
      importRecords: vi.fn(async () => ({ imported: 0, skipped: 0, failed: 0, errors: [] })),
    };

    await expect(importFromClipboard(storage, 'json')).rejects.toThrow('permission denied');
    expect(storage.importRecords).not.toHaveBeenCalled();
  });
});

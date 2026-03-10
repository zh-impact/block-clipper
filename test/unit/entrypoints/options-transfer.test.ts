import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../utils/clipboard', () => ({
  readTextFromClipboard: vi.fn(),
}));

vi.mock('../../../utils/exporter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../utils/exporter')>();
  return {
    ...actual,
    downloadFile: vi.fn(),
    exportBlocksToClipboard: vi.fn(),
  };
});

vi.mock('../../../entrypoints/sidepanel/importFlow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../entrypoints/sidepanel/importFlow')>();
  return {
    ...actual,
    runImportFlow: vi.fn(),
  };
});

import { readTextFromClipboard } from '../../../utils/clipboard';
import { downloadFile, exportBlocksToClipboard } from '../../../utils/exporter';
import { runImportFlow } from '../../../entrypoints/sidepanel/importFlow';
import { exportToClipboard, exportToFile, getEffectiveFormat, getImportAcceptByFormat, importFromClipboard } from '../../../entrypoints/options-page/transfer';

describe('options transfer helpers', () => {
  const blocks = [
    {
      id: '1',
      type: 'text',
      content: 'hello',
      metadata: {},
      source: { url: 'https://example.com', title: 'Example' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ] as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('uses compact mode as JSON default format', () => {
    expect(getEffectiveFormat('compact', 'markdown')).toBe('json');
    expect(getEffectiveFormat('standard', 'markdown')).toBe('markdown');
  });

  it('returns expected import accept by format', () => {
    expect(getImportAcceptByFormat('json')).toContain('.json');
    expect(getImportAcceptByFormat('markdown')).toContain('.md');
  });

  it('exports to file with selected format', () => {
    const result = exportToFile(blocks, 'markdown');
    expect(result.filename).toContain('.md');
    expect(downloadFile).toHaveBeenCalledTimes(1);
  });

  it('exports to clipboard with selected format', async () => {
    vi.mocked(exportBlocksToClipboard).mockResolvedValue({ ok: true, content: 'x' });

    await exportToClipboard(blocks, 'json');
    expect(exportBlocksToClipboard).toHaveBeenCalledWith(blocks, 'json');
  });

  it('imports from clipboard through shared import flow', async () => {
    vi.mocked(readTextFromClipboard).mockResolvedValue({ ok: true, text: '[]' });
    vi.mocked(runImportFlow).mockResolvedValue({ imported: 1, skipped: 0, failed: 0, parseFailures: [], errors: [] } as any);

    const storage = { importRecords: vi.fn() };
    await importFromClipboard('json', storage as any);

    expect(runImportFlow).toHaveBeenCalledWith('[]', storage, 'json');
  });
});

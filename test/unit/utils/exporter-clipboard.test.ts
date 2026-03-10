import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Block } from '../../../utils/block-model';
import { exportBlocksJSONToClipboard, exportBlocksToClipboard, exportBlocksToJSON, exportBlocksToMarkdown } from '../../../utils/exporter';

const sampleBlocks: Block[] = [
  {
    id: '1',
    type: 'text',
    content: 'hello world',
    metadata: {},
    source: { url: 'https://example.com', title: 'Example' },
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-03-10T00:00:00.000Z',
  },
];

describe('exporter clipboard parity', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
          readText: vi.fn(),
        },
      },
      configurable: true,
    });
  });

  it('uses same JSON contract as file export', async () => {
    const fileContent = exportBlocksToJSON(sampleBlocks);
    const clipboardResult = await exportBlocksJSONToClipboard(sampleBlocks);

    expect(clipboardResult.ok).toBe(true);
    expect(clipboardResult.content).toBe(fileContent);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(fileContent);
  });

  it('returns error when clipboard write fails', async () => {
    (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('clipboard blocked'));

    const result = await exportBlocksJSONToClipboard(sampleBlocks);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('clipboard blocked');
  });

  it('supports markdown clipboard export with markdown contract', async () => {
    const markdown = exportBlocksToMarkdown(sampleBlocks);
    const result = await exportBlocksToClipboard(sampleBlocks, 'markdown');

    expect(result.ok).toBe(true);
    expect(result.content).toBe(markdown);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(markdown);
  });
});

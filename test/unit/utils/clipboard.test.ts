import { describe, expect, it, vi, beforeEach } from 'vitest';
import { copyTextToClipboard, readTextFromClipboard } from '../../../utils/clipboard';

describe('clipboard utils', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
          readText: vi.fn().mockResolvedValue('clipboard-content'),
        },
      },
      configurable: true,
    });
  });

  it('copies text successfully', async () => {
    const result = await copyTextToClipboard('hello');
    expect(result.ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('returns normalized error when copy fails', async () => {
    (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error('permission denied'));

    const result = await copyTextToClipboard('hello');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('permission denied');
  });

  it('reads clipboard successfully', async () => {
    const result = await readTextFromClipboard();
    expect(result.ok).toBe(true);
    expect(result.text).toBe('clipboard-content');
  });

  it('returns normalized error when read fails', async () => {
    (navigator.clipboard.readText as any).mockRejectedValueOnce(new Error('read denied'));

    const result = await readTextFromClipboard();
    expect(result.ok).toBe(false);
    expect(result.error).toContain('read denied');
  });
});

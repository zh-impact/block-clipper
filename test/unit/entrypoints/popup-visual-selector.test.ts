import { describe, it, expect, vi } from 'vitest';
import { requestVisualSelectorStart } from '../../../entrypoints/popup/visualSelector';

describe('popup visual selector request', () => {
  it('sends OPEN_VISUAL_SELECTOR and returns ok on success', async () => {
    const sendMessage = vi.fn((message, callback) => {
      callback({ type: 'VISUAL_SELECTOR_STARTED' });
    });

    const result = await requestVisualSelectorStart(sendMessage);

    expect(sendMessage).toHaveBeenCalledWith({ type: 'OPEN_VISUAL_SELECTOR' }, expect.any(Function));
    expect(result).toEqual({ ok: true });
  });

  it('returns error on failure response', async () => {
    const sendMessage = vi.fn((_message, callback) => {
      callback({ type: 'VISUAL_SELECTOR_ERROR', data: { error: 'Cannot reach tab' } });
    });

    const result = await requestVisualSelectorStart(sendMessage);

    expect(result).toEqual({ ok: false, error: 'Cannot reach tab' });
  });
});

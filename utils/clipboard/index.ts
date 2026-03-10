export interface ClipboardResult {
  ok: boolean;
  error?: string;
  text?: string;
}

function getClipboardApi(): Clipboard | null {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return null;
  }

  return navigator.clipboard;
}

export async function copyTextToClipboard(text: string): Promise<ClipboardResult> {
  const clipboard = getClipboardApi();
  if (!clipboard) {
    return {
      ok: false,
      error: 'Clipboard API is not available. Please use file export instead.',
    };
  }

  try {
    await clipboard.writeText(text);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to copy data to clipboard. Check clipboard permissions.',
    };
  }
}

export async function readTextFromClipboard(): Promise<ClipboardResult> {
  const clipboard = getClipboardApi();
  if (!clipboard) {
    return {
      ok: false,
      error: 'Clipboard API is not available. Please use file import instead.',
    };
  }

  try {
    const text = await clipboard.readText();
    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error
        ? error.message
        : 'Failed to read clipboard. Check clipboard permissions.',
    };
  }
}

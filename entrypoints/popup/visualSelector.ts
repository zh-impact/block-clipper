interface VisualSelectorResponse {
  type?: string;
  data?: { error?: string };
}

export async function requestVisualSelectorStart(
  sendMessage: (message: { type: string }, callback: (response: VisualSelectorResponse) => void) => void
): Promise<{ ok: boolean; error?: string }> {
  const response = await new Promise<VisualSelectorResponse>((resolve) => {
    sendMessage({ type: 'OPEN_VISUAL_SELECTOR' }, resolve);
  });

  if (response?.type === 'VISUAL_SELECTOR_STARTED') {
    return { ok: true };
  }

  return {
    ok: false,
    error: response?.data?.error || 'Failed to start visual selector. Try refreshing the page.',
  };
}

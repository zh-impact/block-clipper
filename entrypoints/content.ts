/**
 * Content Script for Block Clipper
 * @description Captures user-selected content from web pages and sends to background for storage
 */

import type { Block, CreateBlockInput, BlockSource } from '../utils/block-model';
import { convertHTMLtoMarkdownSafe } from '../utils/converter';

/**
 * Message types for content script communication
 */
type MessageType = 'TRIGGER_CLIP' | 'CLIP_CONTENT' | 'CLIP_SUCCESS' | 'CLIP_ERROR';

/**
 * Message payload
 */
interface MessagePayload {
  type: MessageType;
  data?: CreateBlockInput | { error: string };
}

/**
 * Extract metadata from current page
 * @returns BlockSource metadata
 */
function extractMetadata(): BlockSource {
  return {
    url: window.location.href,
    title: document.title,
    favicon:
      document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      document.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') ||
      undefined,
  };
}

/**
 * Get user's selected content
 * @returns Selected HTML content or null
 */
function getSelectedContent(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const div = document.createElement('div');
  div.appendChild(range.cloneContents());

  return div.innerHTML;
}

/**
 * Detect block type from HTML content
 * @param html HTML content
 * @returns Detected block type
 */
function detectBlockType(html: string): Block['type'] {
  // Check for code blocks
  if (html.includes('<pre') || html.includes('<code')) {
    return 'code';
  }

  // Check for headings
  if (/<h[1-6]/i.test(html)) {
    return 'heading';
  }

  // Check for blockquotes
  if (html.includes('<blockquote')) {
    return 'quote';
  }

  // Check for lists
  if (/<[uo]l/i.test(html)) {
    return 'list';
  }

  // Default to text
  return 'text';
}

/**
 * Flag to prevent duplicate notifications
 */
let isClippingInProgress = false;

/**
 * Clip selected content
 * @returns Promise resolving when clip is complete
 */
async function clipContent(): Promise<void> {
  // Prevent concurrent clipping
  if (isClippingInProgress) {
    console.log('[Content Script] Clipping already in progress, ignoring duplicate request');
    return;
  }

  isClippingInProgress = true;

  try {
    // Get selected content
    const selectedHTML = getSelectedContent();

    if (!selectedHTML || selectedHTML.trim().length === 0) {
      showNotification('No content selected', 'Please select some text or content before clipping.');
      return;
    }

    // Check content size
    const contentLength = selectedHTML.length;
    if (contentLength > 50000) {
      const shouldContinue = confirm(
        `The selected content is very large (${Math.round(contentLength / 1000)}KB). This may take a moment. Continue?`
      );
      if (!shouldContinue) {
        return;
      }
    }

    // Show loading indicator for large content
    if (contentLength > 5000) {
      showNotification('Clipping...', 'Processing large content, please wait...');
    }

    // Extract metadata
    const source = extractMetadata();

    // Convert to Markdown
    const markdown = convertHTMLtoMarkdownSafe(selectedHTML);

    // Detect block type
    const type = detectBlockType(selectedHTML);

    // Create block input
    const input: CreateBlockInput = {
      type,
      content: markdown,
      metadata: {
        htmlLength: contentLength,
        selectedAt: new Date().toISOString(),
      },
      source,
    };

    // Send to background service worker
    const response = await sendMessage('CLIP_CONTENT', input);

    // Handle response
    if (response) {
      if (response.type === 'CLIP_SUCCESS') {
        console.log('[Content Script] Clipping successful');
        showNotification('✓ Content clipped!', 'Saved to Block Clipper');
      } else if (response.type === 'CLIP_ERROR') {
        console.error('[Content Script] Clipping failed (error response):', response.data);
        const errorMsg = (response.data as { error: string })?.error || 'Unknown error';
        showNotification('✗ Clipping failed', errorMsg);
      } else {
        console.warn('[Content Script] Unexpected response type:', response.type);
      }
    } else {
      console.warn('[Content Script] No response received from background');
    }
  } catch (error) {
    console.error('[Content Script] Clipping failed (exception):', error);
    showNotification('✗ Clipping failed', error instanceof Error ? error.message : 'Unknown error');
  } finally {
    // Reset flag to allow next clipping
    isClippingInProgress = false;
  }
}

/**
 * Send message to background service worker
 * @param type Message type
 * @param data Message data
 * @returns Promise resolving with response
 */
function sendMessage<T = unknown>(type: MessageType, data?: CreateBlockInput): Promise<MessagePayload | null> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Show notification to user
 * @param title Notification title
 * @param message Notification message
 */
function showNotification(title: string, message: string): void {
  chrome.runtime.sendMessage({
    type: 'SHOW_NOTIFICATION',
    data: { title, message },
  });
}

/**
 * Handle messages from background service worker
 * @returns true if we will send a response asynchronously, false otherwise
 */
function handleMessages(message: MessagePayload, sendResponse?: (response?: unknown) => void): boolean {
  if (message.type === 'TRIGGER_CLIP') {
    // Background is requesting a clip (e.g., from keyboard shortcut or context menu)
    // Send immediate response, then execute clipping asynchronously
    sendResponse?.({}); // Send empty response to prevent port closed error
    void clipContent();
    return false; // Response already sent
  }
  return false; // Not handling this message
}

/**
 * Initialize content script
 */
function initialize(): void {
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
    const willRespondAsync = handleMessages(message, sendResponse);

    // Only return true if we will send an async response
    return willRespondAsync;
  });

  console.log('[Content Script] Block Clipper content script loaded');
}

// Export for type checking (WXT uses this)
export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    initialize();
  },
});

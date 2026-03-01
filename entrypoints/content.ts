/**
 * Content Script for Block Clipper
 * @description Captures user-selected content from web pages and sends to background for storage
 */

import type { Block, CreateBlockInput, BlockSource } from '../utils/block-model';
import { convertHTMLtoMarkdownSafe } from '../utils/converter';

/**
 * Message types for content script communication
 */
type MessageType = 'TRIGGER_CLIP' | 'CLIP_CONTENT' | 'CLIP_SUCCESS' | 'CLIP_ERROR' | 'PING';

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
 * Check if selected content is empty or contains only whitespace
 * @param html HTML content to check
 * @returns true if content is empty or whitespace-only
 */
function isEmptyContent(html: string): boolean {
  // Create a temporary element to extract text content
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Get text content and check if it's empty or only whitespace
  const textContent = temp.textContent || temp.innerText || '';
  return textContent.trim().length === 0;
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
 * Clipping request queue to handle concurrent requests
 */
interface ClippingRequest {
  id: number;
  timestamp: number;
}

let isClippingInProgress = false;
let clippingQueue: ClippingRequest[] = [];
let requestIdCounter = 0;
const QUEUE_TIMEOUT = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 5; // Prevent queue from growing indefinitely

/**
 * Process the next clipping request from the queue
 */
async function processNextRequest(): Promise<void> {
  // Remove expired requests
  const now = Date.now();
  clippingQueue = clippingQueue.filter((req) => now - req.timestamp < QUEUE_TIMEOUT);

  if (clippingQueue.length === 0) {
    isClippingInProgress = false;
    return;
  }

  // Get the next request
  const nextRequest = clippingQueue.shift();
  if (!nextRequest) {
    isClippingInProgress = false;
    return;
  }

  console.log(`[Content Script] Processing queued request ${nextRequest.id}`);

  try {
    await executeClip();
  } catch (error) {
    console.error('[Content Script] Queued request failed:', error);
  }

  // Process next request in queue
  await processNextRequest();
}

/**
 * Execute the actual clipping operation
 * @returns Promise resolving when clip is complete
 */
async function executeClip(): Promise<void> {
  // Get selected content
  const selectedHTML = getSelectedContent();

  // Check for empty or whitespace-only content
  if (!selectedHTML || isEmptyContent(selectedHTML)) {
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
}

/**
 * Clip selected content with queue management
 * @returns Promise resolving when clip is complete
 */
async function clipContent(): Promise<void> {
  // Create a new request
  const request: ClippingRequest = {
    id: ++requestIdCounter,
    timestamp: Date.now(),
  };

  // Check if queue is full
  if (clippingQueue.length >= MAX_QUEUE_SIZE) {
    console.warn('[Content Script] Clipping queue is full, please wait');
    showNotification('Please wait...', 'Too many requests queued. Wait for current clips to finish.');
    return;
  }

  // Add to queue or execute immediately
  if (!isClippingInProgress) {
    isClippingInProgress = true;
    console.log(`[Content Script] Starting clipping request ${request.id}`);
    try {
      await executeClip();
      await processNextRequest();
    } catch (error) {
      console.error('[Content Script] Clipping failed:', error);
      showNotification('✗ Clipping failed', error instanceof Error ? error.message : 'Unknown error');
      await processNextRequest();
    }
  } else {
    console.log(`[Content Script] Queueing clipping request ${request.id}`);
    clippingQueue.push(request);
    showNotification(
      'Queued...',
      `Your clip is queued (#${clippingQueue.length} in queue). It will be processed automatically.`
    );
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
  if (message.type === 'PING') {
    // Background is checking if content script is ready
    sendResponse?.({ ready: true });
    return false; // Response already sent
  }

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

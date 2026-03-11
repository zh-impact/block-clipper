/**
 * Content Script for Block Clipper
 * @description Captures user-selected content from web pages and sends to background for storage
 */

import type { Block, CreateBlockInput, BlockSource } from '../utils/block-model';
import { convertHTMLtoMarkdownSafe } from '../utils/converter';
import { extractVisibleTextFromElement, findBestCandidateFromElement } from '../utils/visual-selector';
import { generateAITitle, isAIAvailable } from '../utils/ai/aiTitleGenerator';

/**
 * Message types for content script communication
 */
type MessageType =
  | 'TRIGGER_CLIP'
  | 'START_VISUAL_SELECTOR'
  | 'CLIP_CONTENT'
  | 'CLIP_SUCCESS'
  | 'CLIP_ERROR'
  | 'PING'
  | 'UPDATE_BLOCK_TITLE';

/**
 * Message payload
 */
interface MessagePayload {
  type: MessageType;
  data?: CreateBlockInput | { error: string } | { blockId: string; title: string; aiGenerated: boolean };
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

      // Extract block ID from response data if available
      const blockId = (response.data as { blockId?: string })?.blockId;
      if (blockId) {
        // Trigger async AI title generation
        void generateAndUpdateTitle(blockId, markdown);
      }

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
 * Generate AI title and update the block asynchronously
 * @param blockId - ID of the block to update
 * @param content - Content to generate title from
 */
async function generateAndUpdateTitle(blockId: string, content: string): Promise<void> {
  try {
    // Check if AI is available
    if (!(await isAIAvailable())) {
      console.log('[Content Script] AI not available, skipping title generation');
      return;
    }

    // Check content length (AI API has limits)
    const maxContentLength = 10000;
    const truncatedContent = content.length > maxContentLength
      ? content.substring(0, maxContentLength)
      : content;

    // Generate AI title
    console.log('[Content Script] Generating AI title for block:', blockId);
    const aiTitle = await generateAITitle(truncatedContent);

    // Validate generated title
    if (!aiTitle || aiTitle.trim().length === 0) {
      console.warn('[Content Script] AI generated empty title, skipping update');
      return;
    }

    // Update block with AI-generated title
    const updateResponse = await sendMessage('UPDATE_BLOCK_TITLE', {
      blockId,
      title: aiTitle,
      aiGenerated: true,
    } as { blockId: string; title: string; aiGenerated: boolean });

    if (updateResponse?.type === 'CLIP_SUCCESS') {
      console.log('[Content Script] AI title updated successfully:', aiTitle);
    } else {
      console.warn('[Content Script] Failed to update AI title');
    }
  } catch (error) {
    // Log error but don't show notification (silent fallback)
    console.warn('[Content Script] AI title generation failed:', error);
    // Fallback: block will use original title from metadata or empty string
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

const SELECTOR_UI_CLASS = 'bc-visual-selector-ui';
const CANDIDATE_MIN_TEXT_LENGTH = 20;

let isVisualSelectorActive = false;
let highlightedCandidate: HTMLElement | null = null;
let pendingHoverTarget: HTMLElement | null = null;
let hoverRafId: number | null = null;

let selectorHighlightElement: HTMLDivElement | null = null;
let selectorHintElement: HTMLDivElement | null = null;
let selectorPreviewElement: HTMLDivElement | null = null;

function createSelectorHighlight(): HTMLDivElement {
  const highlight = document.createElement('div');
  highlight.className = SELECTOR_UI_CLASS;
  highlight.style.position = 'fixed';
  highlight.style.pointerEvents = 'none';
  highlight.style.border = '2px solid #3b82f6';
  highlight.style.background = 'rgba(59, 130, 246, 0.15)';
  highlight.style.zIndex = '2147483645';
  highlight.style.borderRadius = '6px';
  highlight.style.boxSizing = 'border-box';
  highlight.style.display = 'none';
  document.body.appendChild(highlight);
  return highlight;
}

function createSelectorHint(): HTMLDivElement {
  const hint = document.createElement('div');
  hint.className = SELECTOR_UI_CLASS;
  hint.style.position = 'fixed';
  hint.style.top = '12px';
  hint.style.right = '12px';
  hint.style.padding = '8px 12px';
  hint.style.background = 'rgba(17, 24, 39, 0.92)';
  hint.style.color = '#fff';
  hint.style.fontSize = '12px';
  hint.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  hint.style.borderRadius = '8px';
  hint.style.zIndex = '2147483646';
  hint.style.pointerEvents = 'none';
  hint.textContent = 'Visual Select: hover content, click to preview, Esc to cancel';
  document.body.appendChild(hint);
  return hint;
}

function updateHighlightPosition(element: HTMLElement | null): void {
  if (!selectorHighlightElement) {
    return;
  }

  if (!element) {
    selectorHighlightElement.style.display = 'none';
    return;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) {
    selectorHighlightElement.style.display = 'none';
    return;
  }

  selectorHighlightElement.style.display = 'block';
  selectorHighlightElement.style.left = `${rect.left}px`;
  selectorHighlightElement.style.top = `${rect.top}px`;
  selectorHighlightElement.style.width = `${rect.width}px`;
  selectorHighlightElement.style.height = `${rect.height}px`;
}

function teardownSelectorUI(): void {
  selectorHighlightElement?.remove();
  selectorHintElement?.remove();
  selectorPreviewElement?.remove();

  selectorHighlightElement = null;
  selectorHintElement = null;
  selectorPreviewElement = null;
}

function cleanupSelectorMode(): void {
  document.removeEventListener('mousemove', handleSelectorMouseMove, true);
  document.removeEventListener('click', handleSelectorClick, true);
  document.removeEventListener('keydown', handleSelectorKeyDown, true);

  if (hoverRafId !== null) {
    cancelAnimationFrame(hoverRafId);
    hoverRafId = null;
  }

  highlightedCandidate = null;
  pendingHoverTarget = null;
  isVisualSelectorActive = false;

  teardownSelectorUI();
}

function exitSelectorMode(showCancelledMessage = false): void {
  cleanupSelectorMode();
  if (showCancelledMessage) {
    showNotification('Visual selector canceled', 'Selection mode has been closed.');
  }
}

function openSelectorPreview(candidate: HTMLElement): void {
  selectorPreviewElement?.remove();

  const extractedText = extractVisibleTextFromElement(candidate);

  const modal = document.createElement('div');
  modal.className = SELECTOR_UI_CLASS;
  modal.style.position = 'fixed';
  modal.style.right = '12px';
  modal.style.bottom = '12px';
  modal.style.width = 'min(420px, calc(100vw - 24px))';
  modal.style.maxHeight = 'min(60vh, 520px)';
  modal.style.display = 'flex';
  modal.style.flexDirection = 'column';
  modal.style.gap = '10px';
  modal.style.padding = '12px';
  modal.style.background = '#ffffff';
  modal.style.border = '1px solid #d1d5db';
  modal.style.borderRadius = '10px';
  modal.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
  modal.style.zIndex = '2147483647';
  modal.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const title = document.createElement('div');
  title.textContent = 'Confirm capture';
  title.style.fontSize = '14px';
  title.style.fontWeight = '600';

  const preview = document.createElement('pre');
  preview.textContent = extractedText || '[No visible text detected]';
  preview.style.margin = '0';
  preview.style.padding = '10px';
  preview.style.background = '#f9fafb';
  preview.style.border = '1px solid #e5e7eb';
  preview.style.borderRadius = '8px';
  preview.style.maxHeight = '260px';
  preview.style.overflow = 'auto';
  preview.style.whiteSpace = 'pre-wrap';
  preview.style.fontSize = '12px';
  preview.style.lineHeight = '1.5';
  preview.style.color = '#111827';

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';

  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '6px 10px';
  cancelButton.style.border = '1px solid #d1d5db';
  cancelButton.style.borderRadius = '6px';
  cancelButton.style.background = '#fff';
  cancelButton.style.cursor = 'pointer';

  const confirmButton = document.createElement('button');
  confirmButton.textContent = 'Confirm Save';
  confirmButton.style.padding = '6px 10px';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '6px';
  confirmButton.style.background = '#2563eb';
  confirmButton.style.color = '#fff';
  confirmButton.style.cursor = 'pointer';

  cancelButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    exitSelectorMode();
  });

  confirmButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void confirmSelectorCapture(candidate);
  });

  actions.appendChild(cancelButton);
  actions.appendChild(confirmButton);

  modal.appendChild(title);
  modal.appendChild(preview);
  modal.appendChild(actions);

  document.body.appendChild(modal);
  selectorPreviewElement = modal;
}

async function confirmSelectorCapture(candidate: HTMLElement): Promise<void> {
  const text = extractVisibleTextFromElement(candidate);

  if (!text.trim()) {
    showNotification('No text to capture', 'The selected area has no visible text. Choose another area.');
    return;
  }

  const source = extractMetadata();
  const input: CreateBlockInput = {
    type: 'text',
    content: text,
    metadata: {
      htmlLength: text.length,
      selectedAt: new Date().toISOString(),
      captureMode: 'visual-selector',
      selectedTag: candidate.tagName.toLowerCase(),
    },
    source,
  };

  try {
    const response = await sendMessage('CLIP_CONTENT', input);
    if (response?.type === 'CLIP_SUCCESS') {
      // Extract block ID from response data if available
      const blockId = (response.data as { blockId?: string })?.blockId;
      if (blockId) {
        // Trigger async AI title generation
        void generateAndUpdateTitle(blockId, text);
      }

      showNotification('✓ Content clipped!', 'Visual selection saved to Block Clipper');
    } else {
      const error = (response?.data as { error?: string } | undefined)?.error || 'Failed to save visual selection';
      showNotification('✗ Clipping failed', error);
    }
  } catch (error) {
    showNotification('✗ Clipping failed', error instanceof Error ? error.message : 'Failed to save visual selection');
  } finally {
    exitSelectorMode();
  }
}

function handleSelectorMouseMove(event: MouseEvent): void {
  if (!isVisualSelectorActive || selectorPreviewElement) {
    return;
  }

  let eventTarget = event.target as HTMLElement | null;
  if (eventTarget?.closest(`.${SELECTOR_UI_CLASS}`)) {
    eventTarget = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
  }

  pendingHoverTarget = eventTarget;

  if (hoverRafId !== null) {
    return;
  }

  hoverRafId = requestAnimationFrame(() => {
    hoverRafId = null;

    const bestCandidate = findBestCandidateFromElement(pendingHoverTarget, {
      minTextLength: CANDIDATE_MIN_TEXT_LENGTH,
      overlayClassName: SELECTOR_UI_CLASS,
    });

    highlightedCandidate = bestCandidate;
    updateHighlightPosition(bestCandidate);
  });
}

function handleSelectorClick(event: MouseEvent): void {
  if (!isVisualSelectorActive) {
    return;
  }

  const target = event.target as HTMLElement | null;
  if (target?.closest(`.${SELECTOR_UI_CLASS}`)) {
    return;
  }

  if (!highlightedCandidate) {
    showNotification('No area selected', 'Move your mouse over page content and click again.');
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  openSelectorPreview(highlightedCandidate);
}

function handleSelectorKeyDown(event: KeyboardEvent): void {
  if (!isVisualSelectorActive) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    exitSelectorMode(true);
  }
}

function startVisualSelectorMode(): void {
  if (isVisualSelectorActive) {
    return;
  }

  isVisualSelectorActive = true;
  highlightedCandidate = null;

  selectorHighlightElement = createSelectorHighlight();
  selectorHintElement = createSelectorHint();

  document.addEventListener('mousemove', handleSelectorMouseMove, true);
  document.addEventListener('click', handleSelectorClick, true);
  document.addEventListener('keydown', handleSelectorKeyDown, true);
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

  if (message.type === 'START_VISUAL_SELECTOR') {
    sendResponse?.({});
    startVisualSelectorMode();
    return false;
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

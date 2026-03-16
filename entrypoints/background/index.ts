/**
 * Background Service Worker for Block Clipper
 * @description Handles storage operations and manages extension lifecycle
 */

import type { CreateBlockInput, Block } from '../../utils/block-model';
import { getStorageService, type StorageService } from '../../utils/storage';
import { getPageSaverScript } from '../../utils/pageSaverScript';

/**
 * Message types for background service worker
 */
type MessageType =
  | 'TRIGGER_CLIP'
  | 'CLIP_CONTENT'
  | 'CLIP_SUCCESS'
  | 'CLIP_ERROR'
  | 'OPEN_VISUAL_SELECTOR'
  | 'START_VISUAL_SELECTOR'
  | 'VISUAL_SELECTOR_STARTED'
  | 'VISUAL_SELECTOR_ERROR'
  | 'SHOW_NOTIFICATION'
  | 'GET_STORAGE_USAGE'
  | 'GET_CLIP_COUNT'
  | 'OPEN_SIDE_PANEL'
  | 'NEW_CLIP_ADDED'
  | 'BLOCK_UPDATED'
  | 'BLOCK_DELETED'
  | 'BLOCKS_RELOADED'
  | 'IMPORT_COMPLETED'
  | 'UPDATE_BLOCK_TITLE'
  | 'SAVE_PAGE'
  | 'PAGE_CONTENT_EXTRACTED'
  | 'PAGE_CONTENT_EXTRACTION_FAILED'
  | 'PING';

/**
 * Message payload
 */
interface MessagePayload {
  type: MessageType;
  data?: CreateBlockInput
    | { error: string }
    | { title: string; message: string }
    | { blockId: string }
    | { blockId: string; title: string; aiGenerated: boolean }
    | { block: Block }
    | { deletedBlockId: string }
    | { timestamp: number }
    | { count: number };
}

/**
 * Storage service instance
 */
let storageService: StorageService | null = null;

/**
 * Initialize storage service
 */
async function initializeStorage(): Promise<void> {
  if (!storageService) {
    storageService = getStorageService();
    await storageService.initialize();

    // Listen for quota warnings
    storageService.on('quota-warning', (event) => {
      const { usage, quota, percentage } = event.data as {
        usage: number;
        quota: number;
        percentage: number;
      };

      console.warn(`[Background] Storage quota warning: ${percentage.toFixed(1)}% used`);

      // Show notification to user
      showNotification(
        getMessage('background_storageQuotaWarningTitle'),
        getMessage('background_storageQuotaWarningMessage', [percentage.toFixed(0)])
      );
    });

    console.log('[Background] Storage service initialized');
  }
}

/**
 * Show notification to user
 * @param title Notification title
 * @param message Notification message
 */
function showNotification(title: string, message: string): void {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon/128.png',
      title,
      message,
      priority: 2,
    });
  }
}

/**
 * Get translated message
 * @param key i18n message key
 * @param substitutions Optional substitutions
 * @returns Translated message
 */
function getMessage(key: string, substitutions?: string | number | (string | number)[]): string {
  return chrome.i18n.getMessage(key, substitutions as string | (string | number)[] | undefined) || key;
}

/**
 * Handle clip content message
 * @param data Block data to save
 * @param sender Message sender info
 * @returns Response message
 */
async function handleClipContent(
  data: CreateBlockInput,
  sender: chrome.runtime.MessageSender
): Promise<MessagePayload> {
  try {
    await initializeStorage();

    if (!storageService) {
      throw new Error('Storage service not initialized');
    }

    // Create block with retry logic
    let retries = 3;
    let block;

    while (retries > 0) {
      try {
        block = await storageService.create(data);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) {
          throw error;
        }
        console.warn(`[Background] Create failed, ${retries} retries remaining...`);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Check if block was created successfully
    if (!block) {
      throw new Error('Failed to create block after retries');
    }

    // Notify sidepanel about new clip (if it's open)
    // We try to send a message, but don't care if it fails (panel might not be open)
    try {
      // Check if sender is content script (not sidepanel)
      if (sender.tab?.id) {
        // Send message to sidepanel
        chrome.runtime.sendMessage({
          type: 'NEW_CLIP_ADDED',
          data: { block },
        }).catch(() => {
          // Ignore errors - sidepanel might not be open
          console.log('[Background] Sidepanel not open or not listening');
        });
      }
    } catch (error) {
      // Ignore - sidepanel might not be open
    }

    // Show system notification for content script context
    // (sidepanel will show its own toast)
    if (sender.tab?.id) {
      showNotification(getMessage('background_clipSuccess'), getMessage('background_clipSuccessMessage'));
    }

    // Return block ID in response for AI title generation
    return { type: 'CLIP_SUCCESS', data: { blockId: block.id } };
  } catch (error) {
    console.error('[Background] Failed to clip content:', error);

    return {
      type: 'CLIP_ERROR',
      data: { error: error instanceof Error ? error.message : 'Failed to clip content' },
    };
  }
}

/**
 * Handle update block title message
 * @param data Title update data
 * @returns Response message
 */
async function handleUpdateBlockTitle(
  data: { blockId: string; title: string; aiGenerated: boolean }
): Promise<MessagePayload> {
  try {
    await initializeStorage();

    if (!storageService) {
      throw new Error('Storage service not initialized');
    }

    // Update block title
    await storageService.updateBlockTitle(data.blockId, data.title, data.aiGenerated);

    // Read the updated block
    const updatedBlock = await storageService.read(data.blockId);

    if (updatedBlock) {
      console.log('[Background] Block title updated:', data.blockId, data.title);

      // Notify sidepanel and options about the block update
      try {
        chrome.runtime.sendMessage({
          type: 'BLOCK_UPDATED',
          data: { block: updatedBlock },
        }).catch(() => {
          // Ignore errors - sidepanel/options might not be open
          console.log('[Background] Sidepanel/options not open or not listening');
        });
      } catch (error) {
        // Ignore - sidepanel/options might not be open
      }
    }

    return { type: 'CLIP_SUCCESS' };
  } catch (error) {
    console.error('[Background] Failed to update block title:', error);

    return {
      type: 'CLIP_ERROR',
      data: { error: error instanceof Error ? error.message : 'Failed to update block title' },
    };
  }
}

/**
 * Handle save page message
 * @description Extracts page content using Readability and saves it as a block
 * @returns Response message
 */
async function handleSavePage(): Promise<MessagePayload> {
  try {
    console.log('[Background] ===== SAVE_PAGE: Starting =====');

    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[Background] Active tab:', activeTab?.id, activeTab?.url);

    if (!activeTab?.id) {
      console.error('[Background] No active tab found');
      showNotification(
        getMessage('background_savePageFailed'),
        getMessage('background_noActivePage')
      );
      return {
        type: 'CLIP_ERROR',
        data: { error: getMessage('background_noActivePage') },
      };
    }

    // Check storage quota before extraction
    await initializeStorage();
    if (!storageService) {
      throw new Error('Storage service not initialized');
    }

    const usage = await storageService.getUsage();
    console.log('[Background] Storage usage:', usage.percentage.toFixed(1) + '%');
    if (usage.percentage > 90) {
      showNotification(
        getMessage('background_storageQuotaWarningTitle'),
        getMessage('background_storageQuotaWarningMessage', [usage.percentage.toFixed(0)])
      );
      return {
        type: 'CLIP_ERROR',
        data: { error: getMessage('background_storageQuotaExceeded') },
      };
    }

    // Request content extraction from content script
    console.log('[Background] Requesting content extraction from tab:', activeTab.id);

    // Set up timeout for extraction (10 seconds)
    const EXTRACTION_TIMEOUT = 10000;
    let extractionResolved = false;

    const extractionPromise = new Promise<{ title: string; content: string }>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!extractionResolved) {
          console.error('[Background] Extraction timed out after', EXTRACTION_TIMEOUT, 'ms');
          reject(new Error('Content extraction timed out'));
        }
      }, EXTRACTION_TIMEOUT);

      // Listen for extraction result
      const messageListener = (message: MessagePayload) => {
        console.log('[Background] Received message:', message.type);

        if (message.type === 'PAGE_CONTENT_EXTRACTED') {
          extractionResolved = true;
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);
          console.log('[Background] ✓ Extraction successful, content length:', (message.data as { content: string })?.content?.length);
          resolve(message.data as { title: string; content: string });
        } else if (message.type === 'PAGE_CONTENT_EXTRACTION_FAILED') {
          extractionResolved = true;
          clearTimeout(timeoutId);
          chrome.runtime.onMessage.removeListener(messageListener);
          const errorMsg = message.error as string || 'Failed to extract page content';
          console.error('[Background] ✗ Extraction failed:', errorMsg);
          reject(new Error(errorMsg));
        }
      };

      chrome.runtime.onMessage.addListener(messageListener);
      console.log('[Background] Message listener registered');
    });

    // Send extraction request to the content script
    // Content script is auto-loaded on all pages, just send message
    try {
      console.log('[Background] Sending EXTRACT_PAGE_CONTENT message to tab:', activeTab.id);
      chrome.tabs.sendMessage(
        activeTab.id,
        { type: 'EXTRACT_PAGE_CONTENT' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Failed to send extraction request:', chrome.runtime.lastError.message);
            // Don't throw here, let the timeout handle it
          }
        }
      );
    } catch (error) {
      console.error('[Background] Failed to send message:', error);
      throw new Error('Cannot communicate with this page. Try refreshing the page.');
    }

    // Wait for extraction result
    console.log('[Background] Waiting for extraction result...');
    const extractedContent = await extractionPromise;
    console.log('[Background] Extraction received:', { title: extractedContent.title, contentLength: extractedContent.content.length });

    // Create block with extracted content
    const blockData: CreateBlockInput = {
      type: 'text',
      content: extractedContent.content,
      source: {
        url: activeTab.url || '',
        title: extractedContent.title,
        contentSource: 'full-page',
      },
    };

    console.log('[Background] Creating block...');
    const block = await storageService.create(blockData);
    console.log('[Background] ✓ Block created successfully:', block.id);

    // Broadcast block update to all pages
    try {
      chrome.runtime.sendMessage({
        type: 'BLOCK_UPDATED',
        data: { block },
      }).catch(() => {
        console.log('[Background] No other pages open');
      });
    } catch (error) {
      console.log('[Background] Failed to broadcast BLOCK_UPDATED');
    }

    // Show success notification
    showNotification(
      getMessage('background_savePageSuccess'),
      getMessage('background_savePageSuccessMessage')
    );

    console.log('[Background] ===== SAVE_PAGE: Complete =====');
    return { type: 'CLIP_SUCCESS', data: { blockId: block.id } };
  } catch (error) {
    console.error('[Background] ===== SAVE_PAGE: Failed =====');
    console.error('[Background] Error details:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to extract page content';

    // Show error notification
    showNotification(
      getMessage('background_savePageFailed'),
      errorMessage
    );

    return {
      type: 'CLIP_ERROR',
      data: { error: errorMessage },
    };
  }
}

/**
 * Handle notification request
 * @param data Notification data
 */
function handleNotification(data: { title: string; message: string }): void {
  showNotification(data.title, data.message);
}

/**
 * Handle request to start visual selector mode from popup
 */
async function handleOpenVisualSelector(): Promise<MessagePayload> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab?.id) {
      return {
        type: 'VISUAL_SELECTOR_ERROR',
        data: { error: 'No active tab found to start visual selector.' },
      };
    }

    await ensureContentScriptReady(activeTab);

    await new Promise<void>((resolve, reject) => {
      chrome.tabs.sendMessage(activeTab.id!, { type: 'START_VISUAL_SELECTOR' }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });

    return { type: 'VISUAL_SELECTOR_STARTED' };
  } catch (error) {
    return {
      type: 'VISUAL_SELECTOR_ERROR',
      data: {
        error: error instanceof Error
          ? error.message
          : 'Failed to start visual selector. Try refreshing the page.',
      },
    };
  }
}

/**
 * Check if content script is injected in a tab
 * @param tabId Tab ID
 * @returns Promise resolving to true if content script is ready
 */
async function isContentScriptReady(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Ensure content script is injected and ready
 * @param tab Tab to inject content script into
 */
async function ensureContentScriptReady(tab: chrome.tabs.Tab): Promise<void> {
  if (!tab.id) return;

  // First try to ping the content script
  const isReady = await isContentScriptReady(tab.id);
  if (isReady) {
    return;
  }

  // Content script not ready, try to inject it
  console.log('[Background] Content script not ready, injecting...');

  try {
    // Inject content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-scripts/content.js'],
    });

    // Wait for the script to initialize with retry
    let retries = 10;
    while (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const ready = await isContentScriptReady(tab.id);
      if (ready) {
        console.log('[Background] Content script injected and ready');
        return;
      }
      retries--;
    }

    throw new Error('Content script did not respond after injection');
  } catch (error) {
    console.error('[Background] Failed to inject content script:', error);
    throw new Error('Failed to prepare page for clipping. Please refresh the page and try again.');
  }
}

/**
 * Handle keyboard shortcut command
 * @param command Command name
 * @param tab Tab where command was triggered
 */
async function handleCommand(command: string, tab?: chrome.tabs.Tab): Promise<void> {
  if (command === 'clip-selection' && tab?.id) {
    try {
      // Ensure content script is ready
      await ensureContentScriptReady(tab);

      // Send message to content script to trigger clipping
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_CLIP' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Failed to trigger clip:', chrome.runtime.lastError.message);
          showNotification(getMessage('background_clipFailed'), getMessage('background_clipFailedMessage'));
        }
      });
    } catch (error) {
      console.error('[Background] Failed to trigger clip:', error);
      showNotification(
        getMessage('background_clipFailed'),
        error instanceof Error ? error.message : getMessage('background_clipFailedMessage')
      );
    }
  } else if (command === 'open-sidepanel') {
    try {
      // Open side panel (no close functionality due to Chrome API limitations)
      if (chrome.sidePanel && tab?.windowId) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('[Background] Side panel opened for window:', tab.windowId);
      }
    } catch (error) {
      console.error('[Background] Failed to open side panel:', error);
    }
  }
}

/**
 * Create context menu on install
 */
async function createContextMenus(): Promise<void> {
  // Skip during pre-rendering (when indexedDB is not available)
  if (typeof indexedDB === 'undefined') {
    return;
  }

  try {
    await chrome.contextMenus.removeAll();

    await chrome.contextMenus.create({
      id: 'clip-selection',
      title: getMessage('background_contextMenuTitle'),
      contexts: ['selection', 'page'],
    });

    console.log('[Background] Context menu created');
  } catch (error) {
    // Ignore fake-browser errors during pre-rendering
    if (error instanceof Error && error.message.includes('not implemented')) {
      return;
    }
    console.error('[Background] Failed to create context menu:', error);
  }
}

/**
 * Handle context menu click
 */
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  if (info.menuItemId === 'clip-selection' && tab?.id) {
    try {
      // Ensure content script is ready
      await ensureContentScriptReady(tab);

      // Send message to content script to trigger clipping
      chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_CLIP' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Failed to trigger clip from context menu:', chrome.runtime.lastError.message);
          showNotification(getMessage('background_clipFailed'), getMessage('background_clipFailedMessage'));
        }
      });
    } catch (error) {
      console.error('[Background] Failed to trigger clip from context menu:', error);
      showNotification(
        getMessage('background_clipFailed'),
        error instanceof Error ? error.message : getMessage('background_clipFailedMessage')
      );
    }
  }
}

/**
 * Initialize background service worker
 */
async function initialize(): Promise<void> {
  console.log('[Background] Block Clipper background service worker starting...');

  // Initialize storage
  await initializeStorage();

  // Create context menu (will remove existing first to avoid duplicates)
  if (chrome.contextMenus) {
    await createContextMenus();
  }

  // Set up event listeners
  chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
    (async () => {
      try {
        let response: MessagePayload | null = null;

        switch (message.type) {
          case 'TRIGGER_CLIP':
            // This message is from background to content script to trigger clipping
            // Don't handle it here - content script will handle it
            break;

          case 'CLIP_CONTENT':
            response = await handleClipContent(message.data as CreateBlockInput, sender);
            break;

          case 'UPDATE_BLOCK_TITLE':
            response = await handleUpdateBlockTitle(message.data as { blockId: string; title: string; aiGenerated: boolean });
            break;

          case 'SAVE_PAGE':
            response = await handleSavePage();
            break;

          case 'OPEN_VISUAL_SELECTOR':
            response = await handleOpenVisualSelector();
            break;

          case 'SHOW_NOTIFICATION':
            handleNotification(message.data as { title: string; message: string });
            break;

          case 'OPEN_SIDE_PANEL':
            // Open side panel (no response needed)
            if (chrome.sidePanel) {
              // Get current window and open side panel for it
              const window = await chrome.windows.getCurrent();
              if (window.id !== undefined) {
                await chrome.sidePanel.open({ windowId: window.id });
              }
            }
            break;

          case 'BLOCKS_RELOADED':
            // Only process if this message is from an external page
            if (sender.tab) {
              // Broadcast blocks reloaded message to all pages
              try {
                chrome.runtime.sendMessage({
                  type: 'BLOCKS_RELOADED',
                  data: message.data || { timestamp: Date.now() },
                }).catch(() => {
                  console.log('[Background] No other pages open');
                });
              } catch (error) {
                console.log('[Background] Failed to broadcast BLOCKS_RELOADED');
              }
            }
            break;

          case 'BLOCK_DELETED':
            // Only process if this message is from an external page
            if (sender.tab) {
              // Broadcast block deleted message to all pages
              try {
                const deletedId = (message.data as { deletedBlockId?: string })?.deletedBlockId || '';
                chrome.runtime.sendMessage({
                  type: 'BLOCK_DELETED',
                  data: { deletedBlockId: deletedId },
                }).catch(() => {
                  console.log('[Background] No other pages open');
                });
              } catch (error) {
                console.log('[Background] Failed to broadcast BLOCK_DELETED');
              }
            }
            break;

          case 'IMPORT_COMPLETED':
            // Only process if this message is from an external page (not from background itself)
            if (sender.tab) {
              // Show system notification for the importer
              const count = (message.data as { count?: number })?.count || 0
              if (count > 0) {
                showNotification(
                  getMessage('import_importSuccess', [count.toString()]),
                  getMessage('import_importSuccessMessage', [count.toString()])
                )
              }
              // Broadcast import completed message to all other pages
              try {
                chrome.runtime.sendMessage({
                  type: 'IMPORT_COMPLETED',
                  data: message.data || { count: 0 },
                }).catch(() => {
                  console.log('[Background] No other pages open');
                });
              } catch (error) {
                console.log('[Background] Failed to broadcast IMPORT_COMPLETED');
              }
            }
            break;

          default:
            console.warn('[Background] Unknown message type:', message.type);
        }

        sendResponse(response);
      } catch (error) {
        console.error('[Background] Message handling failed:', error);
        sendResponse({
          type: 'CLIP_ERROR',
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      }
    })();

    // Return true for async response
    return true;
  });

  // Listen for keyboard shortcuts
  if (typeof indexedDB !== 'undefined' && chrome.commands) {
    chrome.commands.onCommand.addListener((command, tab) => {
      void handleCommand(command, tab);
    });
  }

  // Listen for context menu clicks
  if (typeof indexedDB !== 'undefined' && chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      void handleContextMenuClick(info, tab);
    });
  }

  // Listen for extension install/update
  chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('[Background] Extension installed/updated:', details.reason);

    // Always recreate context menu on install/update
    await createContextMenus();

    if (details.reason === 'install') {
      // Show welcome notification for new installs only
      showNotification(
        getMessage('background_extensionInstalled'),
        getMessage('background_extensionInstalledMessage')
      );
    }
  });

  console.log('[Background] Block Clipper background service worker ready');
}

// Export for WXT
export default defineBackground(() => {
  void initialize();
});

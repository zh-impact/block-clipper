/**
 * Background Service Worker for Block Clipper
 * @description Handles storage operations and manages extension lifecycle
 */

import type { CreateBlockInput } from '../utils/block-model';
import { getStorageService, type StorageService } from '../utils/storage';

/**
 * Message types for background service worker
 */
type MessageType =
  | 'TRIGGER_CLIP'
  | 'CLIP_CONTENT'
  | 'CLIP_SUCCESS'
  | 'CLIP_ERROR'
  | 'SHOW_NOTIFICATION'
  | 'GET_STORAGE_USAGE'
  | 'GET_CLIP_COUNT'
  | 'OPEN_SIDE_PANEL'
  | 'NEW_CLIP_ADDED'
  | 'PING';

/**
 * Message payload
 */
interface MessagePayload {
  type: MessageType;
  data?: CreateBlockInput | { error: string } | { title: string; message: string };
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
        'Storage almost full',
        `You're using ${percentage.toFixed(0)}% of available storage. Consider exporting or deleting old clips.`
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
      showNotification('✓ Content clipped!', 'Saved to Block Clipper');
    }

    return { type: 'CLIP_SUCCESS', data: block };
  } catch (error) {
    console.error('[Background] Failed to clip content:', error);

    return {
      type: 'CLIP_ERROR',
      data: { error: error instanceof Error ? error.message : 'Failed to clip content' },
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
          showNotification('✗ Clipping failed', 'Could not communicate with the page. Try refreshing.');
        }
      });
    } catch (error) {
      console.error('[Background] Failed to trigger clip:', error);
      showNotification(
        '✗ Clipping failed',
        error instanceof Error ? error.message : 'Could not communicate with the page. Try refreshing.'
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
      title: 'Clip Selection',
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
          showNotification('✗ Clipping failed', 'Could not communicate with the page. Try refreshing.');
        }
      });
    } catch (error) {
      console.error('[Background] Failed to trigger clip from context menu:', error);
      showNotification(
        '✗ Clipping failed',
        error instanceof Error ? error.message : 'Could not communicate with the page. Try refreshing.'
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

          case 'SHOW_NOTIFICATION':
            handleNotification(message.data as { title: string; message: string });
            break;

          case 'OPEN_SIDE_PANEL':
            // Open side panel (no response needed)
            if (chrome.sidePanel) {
              // Get current window and open side panel for it
              const window = await chrome.windows.getCurrent();
              await chrome.sidePanel.open({ windowId: window.id });
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
        'Block Clipper installed!',
        'Select text and press Ctrl+Shift+Y (or Cmd+Shift+Y on Mac) to clip content.'
      );
    }
  });

  console.log('[Background] Block Clipper background service worker ready');
}

// Export for WXT
export default defineBackground(() => {
  void initialize();
});

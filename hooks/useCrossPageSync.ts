/**
 * useCrossPageSync Hook
 * @description Manages cross-page synchronization via chrome.runtime.onMessage
 */

import { useEffect, useCallback, useRef } from "react";
import type { Block } from "../utils/block-model";

export type SyncMessageType =
  | "NEW_CLIP_ADDED"
  | "BLOCK_UPDATED"
  | "BLOCK_DELETED"
  | "BLOCKS_RELOADED"
  | "IMPORT_COMPLETED";

export interface SyncMessage {
  type: SyncMessageType;
  data?: {
    block?: Block;
    deletedBlockId?: string;
    timestamp?: number;
    count?: number;
  };
}

export interface UseCrossPageSyncOptions {
  onNewClip?: () => void;
  onBlockUpdated?: (block: Block) => void;
  onBlockDeleted?: (blockId: string) => void;
  onBlocksReloaded?: (timestamp?: number) => void;
  onImportCompleted?: (count: number) => void;
  onMessage?: (message: SyncMessage) => void;
}

export interface UseCrossPageSyncResult {
  isConnected: boolean;
}

/**
 * Hook for managing cross-page synchronization
 */
export function useCrossPageSync(
  options: UseCrossPageSyncOptions = {},
): UseCrossPageSyncResult {
  // Use refs to store callbacks to avoid listener re-registration
  const callbacksRef = useRef(options);

  // Update refs when options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  const isConnectedRef = useRef(true);

  /**
   * Handle incoming sync messages
   */
  const handleMessage = useCallback((message: any) => {
    console.log("[useCrossPageSync] Received message:", message.type);

    const callbacks = callbacksRef.current;

    // Call general message handler first
    if (callbacks.onMessage) {
      callbacks.onMessage(message as SyncMessage);
    }

    // Handle specific message types
    switch (message.type) {
      case "NEW_CLIP_ADDED":
        if (callbacks.onNewClip) {
          callbacks.onNewClip();
        }
        break;

      case "BLOCK_UPDATED":
        if (callbacks.onBlockUpdated && message.data?.block) {
          callbacks.onBlockUpdated(message.data.block as Block);
        }
        break;

      case "BLOCK_DELETED":
        if (callbacks.onBlockDeleted && message.data?.deletedBlockId) {
          callbacks.onBlockDeleted(message.data.deletedBlockId);
        }
        break;

      case "BLOCKS_RELOADED":
        if (callbacks.onBlocksReloaded) {
          callbacks.onBlocksReloaded(message.data?.timestamp);
        }
        break;

      case "IMPORT_COMPLETED":
        console.log("[useCrossPageSync] Processing IMPORT_COMPLETED, count:", message.data?.count);
        if (callbacks.onImportCompleted && message.data?.count !== undefined) {
          callbacks.onImportCompleted(message.data.count);
        }
        break;

      default:
        // Unknown message type, ignore
        break;
    }
  }, []); // Empty deps - callbacks are accessed via ref

  /**
   * Register message listener on mount
   */
  useEffect(() => {
    // Register message listener
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      // Unregister message listener on unmount
      chrome.runtime.onMessage.removeListener(handleMessage);
      isConnectedRef.current = false;
    };
  }, [handleMessage]);

  return {
    isConnected: isConnectedRef.current,
  };
}

/**
 * Broadcast a sync message to all other pages
 */
export function broadcastSyncMessage(message: SyncMessage): void {
  try {
    chrome.runtime.sendMessage(message).catch(() => {
      console.log("[useCrossPageSync] No other pages open");
    });
  } catch (error) {
    // Ignore - other pages might not be open
    console.log("[useCrossPageSync] Failed to broadcast message:", error);
  }
}

/**
 * Throttled message broadcaster to prevent message flooding
 */
export class MessageBroadcaster {
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private pendingMessages: Map<string, SyncMessage> = new Map();

  /**
   * Broadcast a message with throttling (500ms window)
   */
  broadcast(key: string, message: SyncMessage, delay = 500): void {
    // Store the message
    this.pendingMessages.set(key, message);

    // Clear existing timeout for this key
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      const pendingMessage = this.pendingMessages.get(key);
      if (pendingMessage) {
        broadcastSyncMessage(pendingMessage);
        this.pendingMessages.delete(key);
        this.timeouts.delete(key);
      }
    }, delay);

    this.timeouts.set(key, timeout);
  }

  /**
   * Immediately broadcast all pending messages
   */
  flush(): void {
    for (const [key, message] of this.pendingMessages) {
      broadcastSyncMessage(message);
      this.pendingMessages.delete(key);
    }

    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }

  /**
   * Clear all pending messages
   */
  clear(): void {
    this.pendingMessages.clear();

    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
  }
}

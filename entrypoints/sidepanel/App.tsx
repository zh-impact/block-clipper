/**
 * Sidebar App Root Component
 * @description Main entry point for the Block Clipper sidebar UI
 */

import { type JSX, useState, useEffect, useRef } from 'react';
import { getStorageService } from '../../utils/storage';
import type { Block } from '../../utils/block-model';

/**
 * View types for routing
 */
type ViewType = 'list' | 'detail' | 'empty';

/**
 * Toast notification
 */
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

/**
 * App state
 */
interface AppState {
  currentView: ViewType;
  selectedBlock: Block | null;
  searchQuery: string;
  blocks: Block[];
  isLoading: boolean;
  isComposing: boolean; // Track IME composition (Chinese input method)
  currentPage: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  selectedIndex: number; // For keyboard navigation
  isSearchMode: boolean; // Track if we're in search mode
  toasts: Toast[]; // Toast notifications
  isSearching: boolean; // Show loading indicator during search
  storageQuotaWarning: boolean; // Show storage quota warning
  totalCount: number; // Total number of clips in storage
}

/**
 * Sidebar App Component
 */
export default function App(): JSX.Element {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<AppState>({
    currentView: 'empty',
    selectedBlock: null,
    searchQuery: '',
    blocks: [],
    isLoading: true,
    isComposing: false,
    currentPage: 1,
    hasMore: false,
    isLoadingMore: false,
    selectedIndex: -1,
    isSearchMode: false,
    toasts: [],
    isSearching: false,
    storageQuotaWarning: false,
    totalCount: 0,
  });

  // Initialize storage and load blocks
  useEffect(() => {
    const storageService = getStorageService();

    const loadBlocks = async (page = 1, append = false) => {
      try {
        await storageService.initialize();

        // Load blocks with pagination
        const result = await storageService.query({ page, limit: 50 });

        // Sort by createdAt descending (newest first) to ensure correct order
        const sortedItems = result.items.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setState((prev) => ({
          ...prev,
          blocks: append ? [...prev.blocks, ...sortedItems] : sortedItems,
          currentView: sortedItems.length > 0 ? 'list' : 'empty',
          isLoading: false,
          currentPage: page,
          hasMore: sortedItems.length === 50, // If we got 50 items, there might be more
          isLoadingMore: false,
          selectedIndex: -1, // Reset selection when data changes
          totalCount: result.total,
        }));
      } catch (error) {
        console.error('[Sidebar App] Failed to load blocks:', error);
        setState((prev) => ({ ...prev, isLoading: false, isLoadingMore: false }));
      }
    };

    void loadBlocks();
  }, []);

  // Listen for messages from background (new clip added, etc.)
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('[Sidebar App] Received message:', message);

      if (message.type === 'NEW_CLIP_ADDED') {
        // Show success notification
        showToast('New clip added!', 'success');

        // Reload blocks to show the new clip
        const reloadBlocks = async () => {
          try {
            const storageService = getStorageService();
            const result = await storageService.query({ page: 1, limit: 50 });

            // Sort by createdAt descending (newest first) to ensure correct order
            const sortedItems = result.items.sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setState((prev) => ({
              ...prev,
              blocks: sortedItems,
              currentView: 'list',
              totalCount: result.total,
            }));
          } catch (error) {
            console.error('[Sidebar App] Failed to reload blocks:', error);
          }
        };

        void reloadBlocks();
      }
    };

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Add keyboard event listener for navigation
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.currentView, state.blocks, state.selectedIndex]);

  // Check storage quota periodically
  useEffect(() => {
    const checkStorageQuota = async () => {
      try {
        const storageService = getStorageService();
        const usage = await storageService.getUsage();

        // Check if usage exceeds 80% threshold
        if (usage.quota > 0) {
          const usagePercent = usage.bytes / usage.quota;
          setState((prev) => ({
            ...prev,
            storageQuotaWarning: usagePercent > 0.8,
          }));
        }
      } catch (error) {
        console.error('[Sidebar App] Failed to check storage quota:', error);
      }
    };

    // Check immediately
    void checkStorageQuota();

    // Check every 30 seconds
    const interval = setInterval(checkStorageQuota, 30000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Navigate to detail view
   */
  const openDetailView = (block: Block): void => {
    setState((prev) => ({
      ...prev,
      currentView: 'detail',
      selectedBlock: block,
      selectedIndex: -1, // Reset selection when opening detail
    }));
  };

  /**
   * Navigate back to list view
   */
  const closeDetailView = (): void => {
    setState((prev) => ({
      ...prev,
      currentView: 'list',
      selectedBlock: null,
      selectedIndex: -1, // Reset selection when returning to list
    }));
  };

  /**
   * Handle search query change with debouncing
   */
  const handleSearchChange = async (query: string): Promise<void> => {
    // Update search query immediately for UI responsiveness
    setState((prev) => ({ ...prev, searchQuery: query }));

    // Don't search while IME is composing (e.g., typing Pinyin)
    if (state.isComposing) {
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid excessive API calls during typing
    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(query);
    }, 300); // 300ms debounce
  };

  /**
   * Perform the actual search operation
   */
  const performSearch = async (query: string): Promise<void> => {
    if (query.trim()) {
      // Set searching state
      setState((prev) => ({ ...prev, isSearching: true }));

      // Perform search
      try {
        const storageService = getStorageService();
        const results = await storageService.search({ query, limit: 50 });

        // Sort by createdAt descending (newest first) to ensure correct order
        const sortedResults = results.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setState((prev) => ({
          ...prev,
          blocks: sortedResults,
          currentView: sortedResults.length > 0 ? 'list' : 'empty',
          isSearchMode: true,
          hasMore: false, // Search doesn't support pagination yet
          selectedIndex: -1,
          isSearching: false,
        }));
      } catch (error) {
        console.error('[Sidebar App] Search failed:', error);
        setState((prev) => ({ ...prev, isSearching: false }));
      }
    } else {
      // Load all blocks when query is empty
      setState((prev) => ({ ...prev, isSearching: true }));

      try {
        const storageService = getStorageService();
        const result = await storageService.query({ page: 1, limit: 50 });

        // Sort by createdAt descending (newest first) to ensure correct order
        const sortedItems = result.items.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setState((prev) => ({
          ...prev,
          blocks: sortedItems,
          currentView: sortedItems.length > 0 ? 'list' : 'empty',
          isSearchMode: false,
          currentPage: 1,
          hasMore: sortedItems.length === 50,
          selectedIndex: -1,
          isSearching: false,
          totalCount: result.total,
        }));
      } catch (error) {
        console.error('[Sidebar App] Failed to load blocks:', error);
        setState((prev) => ({ ...prev, isSearching: false }));
      }
    }
  };

  /**
   * Handle IME composition start (e.g., Chinese input method)
   */
  const handleCompositionStart = (): void => {
    setState((prev) => ({ ...prev, isComposing: true }));
  };

  /**
   * Handle IME composition end
   */
  const handleCompositionEnd = (event: React.CompositionEvent<HTMLInputElement>): void => {
    // Update state first
    setState((prev) => ({ ...prev, isComposing: false }));

    // Then immediately perform search with the final composed text
    // Don't use handleSearchChange to avoid debounce delay after composition
    const query = event.currentTarget.value;
    setState((prev) => ({ ...prev, searchQuery: query }));
    void performSearch(query);
  };

  /**
   * Show a toast notification
   */
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void => {
    const id = `${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, message, type, duration };

    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, newToast],
    }));

    // Auto-remove toast after duration
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        toasts: prev.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  };

  /**
   * Delete a block
   */
  const handleDelete = async (blockId: string): Promise<void> => {
    try {
      const storageService = getStorageService();
      await storageService.delete(blockId);

      // Show success notification
      showToast('Clip deleted successfully', 'success');

      // Refresh the list from page 1
      const result = await storageService.query({ page: 1, limit: 50 });

      // Sort by createdAt descending (newest first) to ensure correct order
      const sortedItems = result.items.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setState((prev) => ({
        ...prev,
        blocks: sortedItems,
        currentView: sortedItems.length > 0 ? 'list' : 'empty',
        selectedBlock: null,
        currentPage: 1,
        hasMore: sortedItems.length === 50,
        isSearchMode: false,
        selectedIndex: -1,
        searchQuery: '',
        totalCount: result.total,
      }));
    } catch (error) {
      console.error('[Sidebar App] Failed to delete block:', error);
      showToast('Failed to delete clip', 'error');
    }
  };

  /**
   * Load more blocks (pagination)
   */
  const loadMore = async (): Promise<void> => {
    if (state.isLoadingMore || !state.hasMore || state.isSearchMode) {
      return;
    }

    setState((prev) => ({ ...prev, isLoadingMore: true }));
    const nextPage = state.currentPage + 1;
    const storageService = getStorageService();

    try {
      const result = await storageService.query({ page: nextPage, limit: 50 });

      // Sort by createdAt descending (newest first) to ensure correct order
      const sortedItems = result.items.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setState((prev) => ({
        ...prev,
        blocks: [...prev.blocks, ...sortedItems],
        currentPage: nextPage,
        hasMore: sortedItems.length === 50,
        isLoadingMore: false,
        selectedIndex: -1,
      }));
    } catch (error) {
      console.error('[Sidebar App] Failed to load more blocks:', error);
      setState((prev) => ({ ...prev, isLoadingMore: false }));
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Only handle keyboard navigation in list view
    if (state.currentView !== 'list' || state.blocks.length === 0) {
      return;
    }

    // Ignore if user is typing in the search box
    if ((event.target as HTMLElement).tagName === 'INPUT') {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.blocks.length - 1),
        }));
        break;

      case 'ArrowUp':
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1),
        }));
        break;

      case 'Enter':
        if (state.selectedIndex >= 0 && state.selectedIndex < state.blocks.length) {
          event.preventDefault();
          openDetailView(state.blocks[state.selectedIndex]);
        }
        break;

      case 'Home':
        event.preventDefault();
        setState((prev) => ({ ...prev, selectedIndex: 0 }));
        break;

      case 'End':
        event.preventDefault();
        setState((prev) => ({ ...prev, selectedIndex: prev.blocks.length - 1 }));
        break;
    }
  };

  /**
   * Format relative timestamp
   */
  const formatRelativeTime = (timestamp: string): string => {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  /**
   * Get preview text from content
   */
  const getContentPreview = (content: string, maxLength = 100): string => {
    // Remove markdown syntax for preview
    const plainText = content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  };

  /**
   * Get title from block metadata or content
   */
  const getBlockTitle = (block: Block): string => {
    const metadataTitle = (block.metadata.title as string | undefined)?.trim();
    if (metadataTitle) {
      return metadataTitle;
    }

    // Use first line of content or first 50 chars
    const firstLine = block.content.split('\n')[0].trim();
    const withoutMarkdown = firstLine
      .replace(/#{1,6}\s/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .trim();

    return withoutMarkdown.substring(0, 50) || 'Untitled Clip';
  };

  /**
   * Render loading state
   */
  if (state.isLoading) {
    return (
      <div className="sidebar-container">
        <div className="loading-spinner">
          <div className="spinner" />
          <p>Loading clips...</p>
        </div>
        <style>{`
          .sidebar-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .loading-spinner {
            text-align: center;
            color: #666;
          }
          .spinner {
            width: 32px;
            height: 32px;
            margin: 0 auto 16px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (state.currentView === 'empty') {
    return (
      <div className="sidebar-container">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No clips yet</h2>
          <p>Select some text on a webpage and use the keyboard shortcut or context menu to clip it.</p>
          <div className="shortcut-hint">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Y</kbd>
          </div>
        </div>
        <style>{`
          .sidebar-container {
            padding: 24px;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .empty-state {
            text-align: center;
            margin-top: 80px;
            color: #666;
          }
          .empty-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }
          .empty-state h2 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
          }
          .empty-state p {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .shortcut-hint {
            display: inline-flex;
            gap: 4px;
            padding: 8px 16px;
            background: #f5f5f5;
            border-radius: 6px;
            font-size: 12px;
          }
          kbd {
            padding: 2px 6px;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 3px;
            font-family: monospace;
            font-weight: 600;
          }
        `}</style>
      </div>
    );
  }

  /**
   * Render list view
   */
  if (state.currentView === 'list') {
    return (
      <div className="sidebar-container">
        <header className="sidebar-header">
          <h1>Block Clipper</h1>
          <div className="block-count">
            {state.isSearchMode
              ? `${state.blocks.length} results`
              : `${state.blocks.length}${state.hasMore ? '+' : ''} clips`}
          </div>
        </header>

        {/* Storage Quota Warning */}
        {state.storageQuotaWarning && (
          <div className="quota-warning">
            ⚠️ Storage almost full. Consider exporting or deleting old clips.
          </div>
        )}

        <div className="search-bar" role="search">
          <label htmlFor="search-input" className="sr-only">Search clips</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search clips..."
            value={state.searchQuery}
            onChange={(e) => void handleSearchChange(e.target.value)}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="search-input"
            disabled={state.isSearching}
            aria-label="Search clips"
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            Type to search through your clipped content
          </span>
          {state.isSearching ? (
            <div className="search-loading" aria-label="Searching" role="status">
              <div className="search-spinner" aria-hidden="true" />
            </div>
          ) : state.searchQuery ? (
            <button
              onClick={() => void handleSearchChange('')}
              className="clear-button"
              aria-label="Clear search"
              type="button"
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="blocks-list" role="list" aria-label="Clipped items">
          {state.blocks.map((block, index) => (
            <div
              key={block.id}
              onClick={() => openDetailView(block)}
              className={`block-card ${state.selectedIndex === index ? 'selected' : ''}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${getBlockTitle(block)}, clipped ${formatRelativeTime(block.createdAt)} from ${block.source.title}`}
              aria-selected={state.selectedIndex === index}
              onKeyPress={(e) => {
                if (e.key === 'Enter') openDetailView(block);
              }}
            >
              <div className="block-header">
                <h3 className="block-title">{getBlockTitle(block)}</h3>
                <span className="block-time" aria-label={`Clipped ${formatRelativeTime(block.createdAt)}`}>
                  {formatRelativeTime(block.createdAt)}
                </span>
              </div>
              <p className="block-preview">{getContentPreview(block.content)}</p>
              <div className="block-source">
                <span className="source-favicon" aria-hidden="true">
                  {block.source.favicon ? (
                    <img src={block.source.favicon} alt="" />
                  ) : (
                    <span>📄</span>
                  )}
                </span>
                <span className="source-title" aria-label={`From ${block.source.title}`}>
                  {block.source.title}
                </span>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {state.hasMore && !state.isSearchMode && (
            <button
              onClick={() => void loadMore()}
              disabled={state.isLoadingMore}
              className="load-more-button"
              aria-label="Load more clips"
            >
              {state.isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>

        <style>{`
          .sidebar-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
          }
          .sidebar-header {
            padding: 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          .sidebar-header h1 {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          .block-count {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }
          .quota-warning {
            padding: 10px 16px;
            background: #fff3cd;
            border-bottom: 1px solid #ffc107;
            font-size: 12px;
            color: #856404;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .search-bar {
            position: relative;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          .search-input {
            width: calc(100% - 24px);
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
          }
          .search-input:focus {
            outline: none;
            border-color: #3498db;
          }
          .search-input:disabled {
            background: #f5f5f5;
            cursor: wait;
          }
          .clear-button {
            position: absolute;
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            font-size: 16px;
            color: #999;
            cursor: pointer;
            padding: 4px;
          }
          .clear-button:hover {
            color: #666;
          }
          .search-loading {
            position: absolute;
            right: 24px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            align-items: center;
          }
          .search-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .blocks-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
          }
          .block-card {
            padding: 12px;
            margin-bottom: 8px;
            background: #f9f9f9;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.15s;
          }
          .block-card:hover {
            background: #f0f0f0;
          }
          .block-card:focus {
            outline: 2px solid #3498db;
            outline-offset: -2px;
          }
          .block-card:focus-visible {
            outline: 2px solid #3498db;
            outline-offset: -2px;
          }
          .block-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .block-title {
            font-size: 14px;
            font-weight: 500;
            margin: 0;
            flex: 1;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .block-time {
            font-size: 11px;
            color: #999;
            margin-left: 8px;
            white-space: nowrap;
          }
          .block-preview {
            font-size: 12px;
            color: #666;
            margin: 0 0 8px 0;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .block-source {
            display: flex;
            align-items: center;
            font-size: 11px;
            color: #999;
          }
          .source-favicon {
            width: 14px;
            height: 14px;
            margin-right: 6px;
            display: flex;
            align-items: center;
          }
          .source-favicon img {
            width: 14px;
            height: 14px;
          }
          .source-title {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          /* Screen reader only content */
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          }
          .block-card.selected {
            background: #e8f4fd;
            border: 1px solid #3498db;
          }
          .load-more-button {
            width: calc(100% - 16px);
            margin: 8px;
            padding: 10px;
            background: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 13px;
            color: #333;
            cursor: pointer;
            transition: background 0.15s;
          }
          .load-more-button:hover:not(:disabled) {
            background: #e8e8e8;
          }
          .load-more-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Toast Notifications */
          .toast-container {
            position: fixed;
            bottom: 16px;
            right: 16px;
            left: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            pointer-events: none;
            z-index: 1000;
          }
          .toast {
            padding: 12px 16px;
            border-radius: 8px;
            background: #333;
            color: #fff;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .toast.success {
            background: #10b981;
          }
          .toast.error {
            background: #ef4444;
          }
          .toast.info {
            background: #3b82f6;
          }
          @keyframes slideIn {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>

        {/* Toast Notifications */}
        {state.toasts.length > 0 && (
          <div className="toast-container">
            {state.toasts.map((toast) => (
              <div key={toast.id} className={`toast ${toast.type}`}>
                {toast.type === 'success' && '✓ '}
                {toast.type === 'error' && '✗ '}
                {toast.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /**
   * Render detail view
   */
  if (state.currentView === 'detail' && state.selectedBlock) {
    const block = state.selectedBlock;

    return (
      <div className="sidebar-container">
        <header className="detail-header">
          <button
            onClick={closeDetailView}
            className="back-button"
            aria-label="Back to list"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this clip?')) {
                void handleDelete(block.id);
              }
            }}
            className="delete-button"
            aria-label="Delete clip"
          >
            🗑️ Delete
          </button>
        </header>

        <div className="detail-content">
          <div className="detail-metadata">
            <a
              href={block.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-link"
            >
              <span className="source-favicon">
                {block.source.favicon ? (
                  <img src={block.source.favicon} alt="" />
                ) : (
                  <span>📄</span>
                )}
              </span>
              <span>{block.source.title}</span>
            </a>
            <span className="detail-time">
              {new Date(block.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="markdown-content">
            <pre>{block.content}</pre>
          </div>
        </div>

        <style>{`
          .sidebar-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #fff;
          }
          .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e5e5;
          }
          .back-button {
            background: none;
            border: none;
            font-size: 14px;
            color: #333;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 6px;
          }
          .back-button:hover {
            background: #f5f5f5;
          }
          .delete-button {
            background: none;
            border: none;
            font-size: 14px;
            color: #dc3545;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 6px;
          }
          .delete-button:hover {
            background: #fff5f5;
          }
          .detail-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
          }
          .detail-metadata {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e5e5;
          }
          .source-link {
            display: flex;
            align-items: center;
            color: #3498db;
            text-decoration: none;
            font-size: 13px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          .source-link:hover {
            text-decoration: underline;
          }
          .source-favicon {
            width: 16px;
            height: 16px;
            margin-right: 6px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }
          .source-favicon img {
            width: 16px;
            height: 16px;
          }
          .detail-time {
            font-size: 11px;
            color: #999;
            margin-left: 12px;
            white-space: nowrap;
          }
          .markdown-content {
            font-size: 14px;
            line-height: 1.6;
          }
          .markdown-content pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="error-state">Error: Unknown state</div>
    </div>
  );
}

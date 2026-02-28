/**
 * Sidebar App Root Component
 * @description Main entry point for the Block Clipper sidebar UI
 */

import { type JSX, useState, useEffect } from 'react';
import { getStorageService } from '../../utils/storage';
import type { Block } from '../../utils/block-model';

/**
 * View types for routing
 */
type ViewType = 'list' | 'detail' | 'empty';

/**
 * App state
 */
interface AppState {
  currentView: ViewType;
  selectedBlock: Block | null;
  searchQuery: string;
  blocks: Block[];
  isLoading: boolean;
}

/**
 * Sidebar App Component
 */
export default function App(): JSX.Element {
  const [state, setState] = useState<AppState>({
    currentView: 'empty',
    selectedBlock: null,
    searchQuery: '',
    blocks: [],
    isLoading: true,
  });

  // Initialize storage and load blocks
  useEffect(() => {
    const storageService = getStorageService();

    const loadBlocks = async () => {
      try {
        await storageService.initialize();

        // Load first page of blocks
        const result = await storageService.query({ page: 1, limit: 50 });

        setState((prev) => ({
          ...prev,
          blocks: result.items,
          currentView: result.items.length > 0 ? 'list' : 'empty',
          isLoading: false,
        }));
      } catch (error) {
        console.error('[Sidebar App] Failed to load blocks:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    void loadBlocks();

    // Listen for new blocks being added
    const handleNewBlock = () => {
      void loadBlocks();
    };

    storageService.on('ready', handleNewBlock);

    return () => {
      storageService.off('ready', handleNewBlock);
    };
  }, []);

  /**
   * Navigate to detail view
   */
  const openDetailView = (block: Block): void => {
    setState((prev) => ({
      ...prev,
      currentView: 'detail',
      selectedBlock: block,
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
    }));
  };

  /**
   * Handle search query change
   */
  const handleSearchChange = async (query: string): Promise<void> => {
    setState((prev) => ({ ...prev, searchQuery: query }));

    if (query.trim()) {
      // Perform search
      try {
        const storageService = getStorageService();
        const results = await storageService.search({ query, limit: 50 });

        setState((prev) => ({
          ...prev,
          blocks: results,
          currentView: results.length > 0 ? 'list' : 'empty',
        }));
      } catch (error) {
        console.error('[Sidebar App] Search failed:', error);
      }
    } else {
      // Load all blocks
      try {
        const storageService = getStorageService();
        const result = await storageService.query({ page: 1, limit: 50 });

        setState((prev) => ({
          ...prev,
          blocks: result.items,
          currentView: result.items.length > 0 ? 'list' : 'empty',
        }));
      } catch (error) {
        console.error('[Sidebar App] Failed to load blocks:', error);
      }
    }
  };

  /**
   * Delete a block
   */
  const handleDelete = async (blockId: string): Promise<void> => {
    try {
      const storageService = getStorageService();
      await storageService.delete(blockId);

      // Refresh the list
      const result = await storageService.query({ page: 1, limit: 50 });

      setState((prev) => ({
        ...prev,
        blocks: result.items,
        currentView: result.items.length > 0 ? 'list' : 'empty',
        selectedBlock: null,
      }));
    } catch (error) {
      console.error('[Sidebar App] Failed to delete block:', error);
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
          <div className="block-count">{state.blocks.length} clips</div>
        </header>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search clips..."
            value={state.searchQuery}
            onChange={(e) => void handleSearchChange(e.target.value)}
            className="search-input"
          />
          {state.searchQuery && (
            <button
              onClick={() => void handleSearchChange('')}
              className="clear-button"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="blocks-list">
          {state.blocks.map((block) => (
            <div
              key={block.id}
              onClick={() => openDetailView(block)}
              className="block-card"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') openDetailView(block);
              }}
            >
              <div className="block-header">
                <h3 className="block-title">{getBlockTitle(block)}</h3>
                <span className="block-time">{formatRelativeTime(block.createdAt)}</span>
              </div>
              <p className="block-preview">{getContentPreview(block.content)}</p>
              <div className="block-source">
                <span className="source-favicon">
                  {block.source.favicon ? (
                    <img src={block.source.favicon} alt="" />
                  ) : (
                    <span>📄</span>
                  )}
                </span>
                <span className="source-title">{block.source.title}</span>
              </div>
            </div>
          ))}
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
        `}</style>
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

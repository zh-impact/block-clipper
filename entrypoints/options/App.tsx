/**
 * Options/Full View Page
 * @description Full page view for all clipped content
 */

import { type JSX, useState, useEffect } from 'react';
import { getStorageService } from '../../utils/storage';
import type { Block } from '../../utils/block-model';
import './App.css';

/**
 * Format relative timestamp
 */
function formatRelativeTime(timestamp: string): string {
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
}

/**
 * Get preview text from content
 */
function getContentPreview(content: string, maxLength = 100): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + '...'
    : plainText;
}

/**
 * Get title from block
 */
function getBlockTitle(block: Block): string {
  const metadataTitle = (block.metadata.title as string | undefined)?.trim();
  if (metadataTitle) {
    return metadataTitle;
  }

  const firstLine = block.content.split('\n')[0].trim();
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim();

  return withoutMarkdown.substring(0, 50) || 'Untitled Clip';
}

function App(): JSX.Element {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    try {
      const storageService = getStorageService();
      await storageService.initialize();
      const result = await storageService.query({ page: 1, limit: 100 });
      setBlocks(result.items);
    } catch (error) {
      console.error('[Options] Failed to load blocks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const storageService = getStorageService();
      const results = await storageService.search({ query, limit: 100 });
      setBlocks(results);
    } else {
      loadBlocks();
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!confirm('Delete this clip?')) return;

    try {
      const storageService = getStorageService();
      await storageService.delete(blockId);
      if (selectedBlock?.id === blockId) {
        setSelectedBlock(null);
      }
      loadBlocks();
    } catch (error) {
      console.error('[Options] Failed to delete block:', error);
    }
  };

  return (
    <div className="options-container">
      <header className="options-header">
        <h1>📋 Block Clipper</h1>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search clips..."
            value={searchQuery}
            onChange={(e) => void handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <main className="options-main">
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {blocks.length === 0 ? (
              <div className="empty-state">
                <h2>No clips yet</h2>
                <p>Select text on a webpage and use <strong>Ctrl+Shift+Y</strong> to clip content.</p>
              </div>
            ) : selectedBlock ? (
              <div className="detail-view">
                <button onClick={() => setSelectedBlock(null)} className="back-button">
                  ← Back to list
                </button>
                <div className="detail-content">
                  <h2>{getBlockTitle(selectedBlock)}</h2>
                  <div className="detail-meta">
                    <a href={selectedBlock.source.url} target="_blank" rel="noopener noreferrer">
                      {selectedBlock.source.title}
                    </a>
                    <span>{new Date(selectedBlock.createdAt).toLocaleString()}</span>
                  </div>
                  <pre className="markdown-content">{selectedBlock.content}</pre>
                </div>
                <div className="detail-actions">
                  <button
                    onClick={() => void handleDelete(selectedBlock.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="blocks-list">
                {blocks.map((block) => (
                  <div key={block.id} onClick={() => setSelectedBlock(block)} className="block-card">
                    <div className="block-header">
                      <h3>{getBlockTitle(block)}</h3>
                      <span className="block-time">{formatRelativeTime(block.createdAt)}</span>
                    </div>
                    <p className="block-preview">{getContentPreview(block.content)}</p>
                    <div className="block-source">{block.source.title}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .options-container {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .options-header {
          padding: 24px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .options-header h1 {
          font-size: 24px;
          margin: 0 0 16px 0;
        }

        .search-input {
          width: 100%;
          max-width: 400px;
          padding: 10px 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .options-main {
          padding: 24px;
          max-width: 900px;
          margin: 0 auto;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: #666;
        }

        .blocks-list {
          display: grid;
          gap: 12px;
        }

        .block-card {
          padding: 16px;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 8px;
          cursor: pointer;
          transition: box-shadow 0.15s;
        }

        .block-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .block-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .block-header h3 {
          font-size: 16px;
          margin: 0;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .block-time {
          font-size: 12px;
          color: #999;
          margin-left: 12px;
          white-space: nowrap;
        }

        .block-preview {
          font-size: 14px;
          color: #666;
          margin: 0 0 8px 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .block-source {
          font-size: 12px;
          color: #999;
        }

        .detail-view {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
        }

        .back-button {
          padding: 12px 24px;
          background: none;
          border: none;
          border-bottom: 1px solid #e5e5e5;
          cursor: pointer;
          font-size: 14px;
          color: #3498db;
        }

        .back-button:hover {
          background: #f9f9f9;
        }

        .detail-content {
          padding: 24px;
        }

        .detail-content h2 {
          margin-top: 0;
        }

        .detail-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #666;
        }

        .detail-meta a {
          color: #3498db;
        }

        .markdown-content {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .detail-actions {
          padding: 16px 24px;
          border-top: 1px solid #e5e5e5;
        }

        .delete-button {
          padding: 8px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .delete-button:hover {
          background: #c82333;
        }
      `}</style>
    </div>
  );
}

export default App;

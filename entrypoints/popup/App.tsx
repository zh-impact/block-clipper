/**
 * Popup App Component
 * @description Quick access to Block Clipper features
 */

import { type JSX, useState, useEffect } from "react";
import { getStorageService } from "../../utils/storage";
import type { Block } from "../../utils/block-model";
import { requestVisualSelectorStart } from "./visualSelector";
import "./App.css";

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

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/**
 * Get preview text from content
 */
function getContentPreview(content: string, maxLength = 60): string {
  const plainText = content
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\n+/g, " ")
    .trim();

  return plainText.length > maxLength
    ? plainText.substring(0, maxLength) + "..."
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

  const firstLine = block.content.split("\n")[0].trim();
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .trim();

  return withoutMarkdown.substring(0, 30) || "Untitled Clip";
}

/**
 * Open extension options page
 */
function openOptionsPage(): void {
  chrome.runtime.openOptionsPage();
}

/**
 * Open side panel and close popup
 */
async function openSidePanel(): Promise<void> {
  try {
    if (chrome.sidePanel) {
      // Get current window and open side panel directly
      const chromeWindow = await chrome.windows.getCurrent();
      if (chromeWindow.id === undefined) {
        throw new Error("No active browser window found");
      }

      await chrome.sidePanel.open({ windowId: chromeWindow.id });
      // Close popup using JavaScript's window.close()
      window.close();
    }
  } catch (error) {
    console.error("[Popup] Failed to open side panel:", error);
  }
}

/**
 * Start visual selector mode on active tab
 */
async function startVisualSelector(): Promise<void> {
  try {
    const result = await requestVisualSelectorStart(chrome.runtime.sendMessage);
    if (result.ok) {
      window.close();
      return;
    }

    alert(result.error || "Failed to start visual selector.");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to start visual selector.",
    );
  }
}

/**
 * Open documentation/help
 */
function openDocumentation(): void {
  chrome.tabs.create({
    url: "https://github.com/zh-impact/block-clipper#readme",
  });
  window.close();
}

function App(): JSX.Element {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clipCount, setClipCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const storageService = getStorageService();
        await storageService.initialize();

        // Get recent blocks
        const result = await storageService.query({ page: 1, limit: 5 });
        setBlocks(result.items);
        setClipCount(result.total);
      } catch (error) {
        console.error("[Popup] Failed to load blocks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo-section">
          <span className="logo">📋</span>
          <h1>Block Clipper</h1>
        </div>
        <div className="clip-count">{clipCount} clips</div>
      </header>

      <div className="quick-action-row">
        <button
          onClick={() => void startVisualSelector()}
          className="visual-selector-button"
        >
          Visual Select Tool
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">Loading...</div>
      ) : blocks.length === 0 ? (
        <div className="empty-state">
          <p>No clips yet</p>
          <div className="hint">
            Select text on a webpage and use:
            <br />
            <kbd>Ctrl+Shift+Y</kbd>
          </div>
        </div>
      ) : (
        <>
          <div className="recent-clips">
            <div className="section-title">Recent Clips</div>
            {blocks.slice(0, 3).map((block) => (
              <div key={block.id} className="clip-item">
                <div className="clip-title">{getBlockTitle(block)}</div>
                <div className="clip-preview">
                  {getContentPreview(block.content)}
                </div>
                <div className="clip-meta">
                  <span className="clip-time">
                    {formatRelativeTime(block.createdAt)}
                  </span>
                  <span className="clip-source">{block.source.title}</span>
                </div>
              </div>
            ))}
          </div>

          {clipCount > 0 && (
            <div className="view-all-section">
              <div className="button-row">
                <button
                  onClick={openOptionsPage}
                  className="view-all-button secondary"
                >
                  📋 Options
                </button>
                <button
                  onClick={openSidePanel}
                  className="view-all-button primary"
                >
                  🔲 Side Panel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="help-section">
        <div className="help-title">How to clip:</div>
        <ol className="help-list">
          <li>Select text on any webpage</li>
          <li>
            Right-click and choose <strong>"Clip Selection"</strong>
          </li>
          <li>
            Or use shortcut: <kbd>Ctrl+Shift+Y</kbd>
          </li>
        </ol>
        <button onClick={openDocumentation} className="help-link">
          📖 Documentation & Help
        </button>
      </div>

      <style>{`
        .popup-container {
          width: 320px;
          max-height: 500px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fff;
          display: flex;
          flex-direction: column;
        }

        .popup-header {
          padding: 10px 14px;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .logo {
          font-size: 16px;
        }

        .popup-header h1 {
          font-size: 14px;
          font-weight: 600;
          margin: 0;
        }

        .clip-count {
          font-size: 11px;
          color: #888;
          background: #f5f5f5;
          padding: 2px 8px;
          border-radius: 10px;
        }

        .loading-state,
        .empty-state {
          padding: 20px 16px;
          text-align: center;
          color: #666;
          font-size: 13px;
          flex: 1;
        }

        .quick-action-row {
          padding: 10px 14px 0;
        }

        .visual-selector-button {
          width: 100%;
          border: 1px solid #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .visual-selector-button:hover {
          background: #dbeafe;
        }

        .hint {
          margin-top: 10px;
          padding: 6px 8px;
          background: #f9f9f9;
          border-radius: 4px;
          font-size: 11px;
          text-align: left;
        }

        .hint kbd {
          padding: 1px 4px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 2px;
          font-family: monospace;
          font-weight: 600;
          font-size: 10px;
        }

        .recent-clips {
          padding: 10px 14px;
          border-bottom: 1px solid #e5e5e5;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #888;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .clip-item {
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .clip-item:last-child {
          border-bottom: none;
        }

        .clip-title {
          font-size: 12px;
          font-weight: 500;
          color: #333;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .clip-preview {
          font-size: 11px;
          color: #666;
          margin-bottom: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .clip-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clip-time {
          font-size: 10px;
          color: #999;
        }

        .clip-source {
          font-size: 10px;
          color: #999;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 150px;
        }

        .view-all-section {
          padding: 8px 14px;
          text-align: center;
        }

        .button-row {
          display: flex;
          gap: 8px;
        }

        .view-all-button {
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          flex: 1;
          transition: opacity 0.15s;
        }

        .view-all-button.primary {
          background: #3498db;
          color: white;
        }

        .view-all-button.primary:hover {
          background: #2980b9;
        }

        .view-all-button.secondary {
          background: #f0f0f0;
          color: #333;
        }

        .view-all-button.secondary:hover {
          background: #e0e0e0;
        }

        .help-section {
          padding: 10px 14px;
          background: #f9f9f9;
          font-size: 11px;
        }

        .help-title {
          font-weight: 600;
          margin-bottom: 6px;
          color: #333;
          font-size: 11px;
        }

        .help-list {
          margin: 0;
          padding-left: 18px;
          color: #555;
        }

        .help-list li {
          margin-bottom: 3px;
        }

        .help-link {
          margin-top: 10px;
          width: 100%;
          padding: 8px;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 11px;
          color: #3498db;
          cursor: pointer;
          transition: all 0.15s;
        }

        .help-link:hover {
          background: #f0f8ff;
          border-color: #3498db;
        }

        kbd {
          padding: 2px 4px;
          background: #fff;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-family: monospace;
          font-size: 11px;
        }
      `}</style>
    </div>
  );
}

export default App;

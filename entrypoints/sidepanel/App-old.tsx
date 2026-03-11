/**
 * Sidebar App Root Component
 * @description Main entry point for the Block Clipper sidebar UI
 */

import { type JSX, type ChangeEvent, useState, useEffect, useRef } from "react";
import {
  IconClipboardCopy,
  IconClipboardPlus,
  IconFileExport,
  IconFileImport,
  IconRefresh,
} from "@tabler/icons-react";
import { getStorageService } from "../../utils/storage";
import type { Block } from "../../utils/block-model";
import type { ImportSummary } from "../../utils/storage";
import {
  downloadFile,
  exportBlocksToJSON,
  exportBlocksToMarkdown,
  generateExportFilename,
} from "../../utils/exporter";
import type { ExportFormat } from "../../utils/exporter";
import { getImportFileSizeError, runImportFlow } from "./importFlow";
import { exportBlocksToClipboard, importFromClipboard } from "./clipboardFlow";
import type { ImportFormat } from "../../utils/importer";
import {
  generateAITitle,
  isAIAvailable,
} from "../../utils/ai/aiTitleGenerator";

/**
 * View types for routing
 */
type ViewType = "list" | "detail" | "empty";

/**
 * Toast notification
 */
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

interface ImportReport extends ImportSummary {
  parseFailures: string[];
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
  isImporting: boolean;
  isExporting: boolean;
  exportFormat: ExportFormat;
  importFormat: ImportFormat;
  density: "standard" | "compact";
  lastImportReport: ImportReport | null;
  aiAvailable: boolean; // AI title generation availability
  isRegeneratingTitle: boolean; // AI title regeneration in progress
}

/**
 * Sidebar App Component
 */
export default function App(): JSX.Element {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<AppState>({
    currentView: "empty",
    selectedBlock: null,
    searchQuery: "",
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
    isImporting: false,
    isExporting: false,
    exportFormat: "json",
    importFormat: "json",
    density: "standard",
    lastImportReport: null,
    aiAvailable: false,
    isRegeneratingTitle: false,
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
        const sortedItems = result.items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setState((prev) => ({
          ...prev,
          blocks: append ? [...prev.blocks, ...sortedItems] : sortedItems,
          currentView: sortedItems.length > 0 ? "list" : "empty",
          isLoading: false,
          currentPage: page,
          hasMore: sortedItems.length === 50, // If we got 50 items, there might be more
          isLoadingMore: false,
          selectedIndex: -1, // Reset selection when data changes
          totalCount: result.total,
        }));
      } catch (error) {
        console.error("[Sidebar App] Failed to load blocks:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
        }));
      }
    };

    void loadBlocks();

    // Check AI availability
    void (async () => {
      const available = await isAIAvailable();
      setState((prev) => ({ ...prev, aiAvailable: available }));
      console.log("[Sidebar App] AI available:", available);
    })();
  }, []);

  // Listen for messages from background (new clip added, etc.)
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log("[Sidebar App] Received message:", message);

      if (message.type === "NEW_CLIP_ADDED") {
        // Show success notification
        showToast("New clip added!", "success");

        // Reload blocks to show the new clip
        const reloadBlocks = async () => {
          try {
            const storageService = getStorageService();
            const result = await storageService.query({ page: 1, limit: 50 });

            // Sort by createdAt descending (newest first) to ensure correct order
            const sortedItems = result.items.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            );

            setState((prev) => ({
              ...prev,
              blocks: sortedItems,
              currentView: "list",
              totalCount: result.total,
            }));
          } catch (error) {
            console.error("[Sidebar App] Failed to reload blocks:", error);
          }
        };

        void reloadBlocks();
      } else if (message.type === "BLOCK_UPDATED") {
        // Update specific block in the list
        const updatedBlock = message.data.block as Block;

        setState((prev) => ({
          ...prev,
          blocks: prev.blocks.map((block) =>
            block.id === updatedBlock.id ? updatedBlock : block,
          ),
          selectedBlock:
            prev.selectedBlock?.id === updatedBlock.id
              ? updatedBlock
              : prev.selectedBlock,
        }));
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
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
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
        console.error("[Sidebar App] Failed to check storage quota:", error);
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
      currentView: "detail",
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
      currentView: "list",
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
        const sortedResults = results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setState((prev) => ({
          ...prev,
          blocks: sortedResults,
          currentView: sortedResults.length > 0 ? "list" : "empty",
          isSearchMode: true,
          hasMore: false, // Search doesn't support pagination yet
          selectedIndex: -1,
          isSearching: false,
        }));
      } catch (error) {
        console.error("[Sidebar App] Search failed:", error);
        setState((prev) => ({ ...prev, isSearching: false }));
      }
    } else {
      // Load all blocks when query is empty
      setState((prev) => ({ ...prev, isSearching: true }));

      try {
        const storageService = getStorageService();
        const result = await storageService.query({ page: 1, limit: 50 });

        // Sort by createdAt descending (newest first) to ensure correct order
        const sortedItems = result.items.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setState((prev) => ({
          ...prev,
          blocks: sortedItems,
          currentView: sortedItems.length > 0 ? "list" : "empty",
          isSearchMode: false,
          currentPage: 1,
          hasMore: sortedItems.length === 50,
          selectedIndex: -1,
          isSearching: false,
          totalCount: result.total,
        }));
      } catch (error) {
        console.error("[Sidebar App] Failed to load blocks:", error);
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
  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLInputElement>,
  ): void => {
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
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration = 3000,
  ): void => {
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

  const reloadFirstPage = async (): Promise<void> => {
    const storageService = getStorageService();
    const result = await storageService.query({ page: 1, limit: 50 });

    const sortedItems = result.items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setState((prev) => ({
      ...prev,
      blocks: sortedItems,
      currentView: sortedItems.length > 0 ? "list" : "empty",
      isSearchMode: false,
      currentPage: 1,
      hasMore: sortedItems.length === 50,
      selectedIndex: -1,
      searchQuery: "",
      totalCount: result.total,
    }));
  };

  const loadAllBlocksForExport = async (): Promise<Block[]> => {
    const storageService = getStorageService();
    const allBlocks: Block[] = [];
    let page = 1;
    const limit = 200;

    while (true) {
      const result = await storageService.query({ page, limit });
      allBlocks.push(...result.items);

      if (page >= result.totalPages || result.items.length === 0) {
        break;
      }

      page++;
    }

    return allBlocks.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  const getImportAcceptByFormat = (): string => {
    const format = state.density === "compact" ? "json" : state.importFormat;

    if (format === "markdown") {
      return "text/markdown,.md,.markdown,text/plain";
    }

    return "application/json,.json";
  };

  const setImportFailureReport = (message: string): void => {
    setState((prev) => ({
      ...prev,
      isImporting: false,
      lastImportReport: {
        imported: 0,
        skipped: 0,
        failed: 1,
        parseFailures: [message],
        errors: [message],
      },
    }));
  };

  const importContent = async (
    content: string,
    format: ImportFormat,
    sourceLabel: "File" | "Clipboard",
  ): Promise<void> => {
    const storageService = getStorageService();
    const report = await runImportFlow(content, storageService, format);

    setState((prev) => ({
      ...prev,
      isImporting: false,
      lastImportReport: report,
    }));

    if (report.imported > 0) {
      await reloadFirstPage();
    }

    showToast(
      `${sourceLabel} import (${format.toUpperCase()}): ${report.imported} imported, ${report.skipped} skipped, ${report.failed} failed`,
      report.failed > 0 ? "info" : "success",
      4500,
    );
  };

  const handleExportFileClick = async (
    format: ExportFormat = state.exportFormat,
  ): Promise<void> => {
    if (state.isExporting) {
      return;
    }

    setState((prev) => ({ ...prev, isExporting: true }));

    try {
      const blocks = await loadAllBlocksForExport();
      if (blocks.length === 0) {
        showToast("No clips to export", "info");
        return;
      }

      const content =
        format === "json"
          ? exportBlocksToJSON(blocks)
          : exportBlocksToMarkdown(blocks);
      const filename = generateExportFilename(format, blocks.length);
      downloadFile(content, filename);
      showToast(
        `Exported ${blocks.length} clips to ${format.toUpperCase()} file`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to export file",
        "error",
      );
    } finally {
      setState((prev) => ({ ...prev, isExporting: false }));
    }
  };

  const handleExportClipboardClick = async (
    format: ExportFormat = state.exportFormat,
  ): Promise<void> => {
    if (state.isExporting) {
      return;
    }

    setState((prev) => ({ ...prev, isExporting: true }));

    try {
      const blocks = await loadAllBlocksForExport();
      if (blocks.length === 0) {
        showToast("No clips to export", "info");
        return;
      }

      const result = await exportBlocksToClipboard(blocks, format);
      if (!result.ok) {
        throw new Error(
          result.error || "Failed to copy export data to clipboard",
        );
      }

      showToast(
        `Copied ${blocks.length} ${format.toUpperCase()} clips to clipboard`,
        "success",
      );
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Clipboard export failed",
        "error",
      );
    } finally {
      setState((prev) => ({ ...prev, isExporting: false }));
    }
  };

  const handleImportClick = (): void => {
    if (state.isImporting) {
      return;
    }

    importInputRef.current?.setAttribute("accept", getImportAcceptByFormat());
    importInputRef.current?.click();
  };

  const handleImportClipboardClick = async (
    format: ImportFormat = state.importFormat,
  ): Promise<void> => {
    if (state.isImporting) {
      return;
    }

    setState((prev) => ({ ...prev, isImporting: true }));

    try {
      const storageService = getStorageService();
      const report = await importFromClipboard(storageService, format);

      setState((prev) => ({
        ...prev,
        isImporting: false,
        lastImportReport: report,
      }));

      if (report.imported > 0) {
        await reloadFirstPage();
      }

      showToast(
        `Clipboard import (${format.toUpperCase()}): ${report.imported} imported, ${report.skipped} skipped, ${report.failed} failed`,
        report.failed > 0 ? "info" : "success",
        4500,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Clipboard import failed";
      setImportFailureReport(message);
      showToast(message, "error");
    }
  };

  const handleImportFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    event.currentTarget.value = "";

    const sizeError = getImportFileSizeError(file.size);
    if (sizeError) {
      showToast(sizeError, "error");
      setState((prev) => ({
        ...prev,
        lastImportReport: {
          imported: 0,
          skipped: 0,
          failed: 1,
          parseFailures: [sizeError],
          errors: [sizeError],
        },
      }));
      return;
    }

    setState((prev) => ({ ...prev, isImporting: true }));

    try {
      const content = await file.text();
      const format = state.density === "compact" ? "json" : state.importFormat;
      await importContent(content, format, "File");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      setImportFailureReport(message);
      showToast(message, "error");
    }
  };

  /**
   * Delete a block
   */
  const handleDelete = async (blockId: string): Promise<void> => {
    try {
      const storageService = getStorageService();
      await storageService.delete(blockId);

      // Show success notification
      showToast("Clip deleted successfully", "success");

      await reloadFirstPage();
      setState((prev) => ({
        ...prev,
        selectedBlock: null,
      }));
    } catch (error) {
      console.error("[Sidebar App] Failed to delete block:", error);
      showToast("Failed to delete clip", "error");
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
      const sortedItems = result.items.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
      console.error("[Sidebar App] Failed to load more blocks:", error);
      setState((prev) => ({ ...prev, isLoadingMore: false }));
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Only handle keyboard navigation in list view
    if (state.currentView !== "list" || state.blocks.length === 0) {
      return;
    }

    // Ignore if user is typing in the search box
    if ((event.target as HTMLElement).tagName === "INPUT") {
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.min(
            prev.selectedIndex + 1,
            prev.blocks.length - 1,
          ),
        }));
        break;

      case "ArrowUp":
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, -1),
        }));
        break;

      case "Enter":
        if (
          state.selectedIndex >= 0 &&
          state.selectedIndex < state.blocks.length
        ) {
          event.preventDefault();
          openDetailView(state.blocks[state.selectedIndex]);
        }
        break;

      case "Home":
        event.preventDefault();
        setState((prev) => ({ ...prev, selectedIndex: 0 }));
        break;

      case "End":
        event.preventDefault();
        setState((prev) => ({
          ...prev,
          selectedIndex: prev.blocks.length - 1,
        }));
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

    if (diffMins < 1) return "just now";
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
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n+/g, " ")
      .trim();

    return plainText.length > maxLength
      ? plainText.substring(0, maxLength) + "..."
      : plainText;
  };

  /**
   * Get title from block title field, metadata, or content
   */
  const getBlockTitle = (block: Block): string => {
    // First, check if block has a title field
    if (block.title && block.title.trim()) {
      return block.title.trim();
    }

    // Fall back to metadata.title for backward compatibility
    const metadataTitle = (block.metadata.title as string | undefined)?.trim();
    if (metadataTitle) {
      return metadataTitle;
    }

    // Use first line of content or first 50 chars
    const firstLine = block.content.split("\n")[0].trim();
    const withoutMarkdown = firstLine
      .replace(/#{1,6}\s/, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`/g, "")
      .trim();

    return withoutMarkdown.substring(0, 50) || "Untitled Clip";
  };

  /**
   * Handle AI title regeneration
   */
  const handleRegenerateTitle = async (block: Block): Promise<void> => {
    if (!state.aiAvailable || state.isRegeneratingTitle) {
      return;
    }

    setState((prev) => ({ ...prev, isRegeneratingTitle: true }));

    try {
      // Generate new AI title
      const aiTitle = await generateAITitle(block.content);

      // Update block in storage
      const storageService = getStorageService();
      await storageService.updateBlockTitle(block.id, aiTitle, true);

      // Update local state
      setState((prev) => ({
        ...prev,
        selectedBlock: prev.selectedBlock
          ? { ...prev.selectedBlock, title: aiTitle, aiGenerated: true }
          : null,
        blocks: prev.blocks.map((b) =>
          b.id === block.id ? { ...b, title: aiTitle, aiGenerated: true } : b,
        ),
        isRegeneratingTitle: false,
      }));

      showToast("AI title regenerated!", "success");
    } catch (error) {
      console.error("[Sidebar App] Failed to regenerate AI title:", error);
      setState((prev) => ({ ...prev, isRegeneratingTitle: false }));
      showToast("Failed to regenerate AI title", "error");
    }
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
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (state.currentView === "empty") {
    return (
      <div className="sidebar-container">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No clips yet</h2>
          <p>
            Select some text on a webpage and use the keyboard shortcut or
            context menu to clip it.
          </p>
          <div className="shortcut-hint">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Y</kbd>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Render list view
   */
  if (state.currentView === "list") {
    return (
      <div className={`sidebar-container density-${state.density}`}>
        <header className="sidebar-header">
          <div className="header-title-row">
            <h1>Block Clipper</h1>
            <div className="header-meta">
              <div className="block-count">
                {state.isSearchMode
                  ? `${state.blocks.length} results`
                  : `${state.blocks.length}${state.hasMore ? "+" : ""} clips`}
              </div>
              <button
                className="density-toggle-button"
                type="button"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    density:
                      prev.density === "standard" ? "compact" : "standard",
                  }));
                }}
                aria-label={`Switch to ${state.density === "standard" ? "compact" : "standard"} layout`}
              >
                {state.density === "standard" ? "Compact" : "Standard"}
              </button>
            </div>
          </div>

          <div className="transfer-grid">
            <section className="transfer-group" aria-label="Export controls">
              <div className="transfer-group-label">Export</div>
              {state.density === "standard" && (
                <select
                  className="format-select"
                  value={state.exportFormat}
                  onChange={(event) => {
                    const nextFormat = event.target.value as ExportFormat;
                    setState((prev) => ({ ...prev, exportFormat: nextFormat }));
                  }}
                  aria-label="Export format"
                  disabled={state.isExporting}
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              )}
              <button
                onClick={() =>
                  void handleExportFileClick(
                    state.density === "compact" ? "json" : state.exportFormat,
                  )
                }
                className="icon-action-button"
                disabled={state.isExporting}
                type="button"
                aria-label={`Export ${(state.density === "compact" ? "json" : state.exportFormat).toUpperCase()} to file`}
                title={`Export ${(state.density === "compact" ? "json" : state.exportFormat).toUpperCase()} to file`}
              >
                <IconFileExport size={16} stroke={2} aria-hidden="true" />
              </button>
              <button
                onClick={() =>
                  void handleExportClipboardClick(
                    state.density === "compact" ? "json" : state.exportFormat,
                  )
                }
                className="icon-action-button"
                disabled={state.isExporting}
                type="button"
                aria-label={`Copy ${(state.density === "compact" ? "json" : state.exportFormat).toUpperCase()} to clipboard`}
                title={`Copy ${(state.density === "compact" ? "json" : state.exportFormat).toUpperCase()} to clipboard`}
              >
                <IconClipboardCopy size={16} stroke={2} aria-hidden="true" />
              </button>
            </section>

            <section className="transfer-group" aria-label="Import controls">
              <div className="transfer-group-label">Import</div>
              {state.density === "standard" && (
                <select
                  className="format-select"
                  value={state.importFormat}
                  onChange={(event) => {
                    const nextFormat = event.target.value as ImportFormat;
                    setState((prev) => ({ ...prev, importFormat: nextFormat }));
                  }}
                  aria-label="Import format"
                  disabled={state.isImporting}
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              )}
              <button
                onClick={handleImportClick}
                className="icon-action-button"
                disabled={state.isImporting}
                type="button"
                aria-label={`Import ${(state.density === "compact" ? "json" : state.importFormat).toUpperCase()} from file`}
                title={`Import ${(state.density === "compact" ? "json" : state.importFormat).toUpperCase()} from file`}
              >
                <IconFileImport size={16} stroke={2} aria-hidden="true" />
              </button>
              <button
                onClick={() =>
                  void handleImportClipboardClick(
                    state.density === "compact" ? "json" : state.importFormat,
                  )
                }
                className="icon-action-button"
                disabled={state.isImporting}
                type="button"
                aria-label={`Import ${(state.density === "compact" ? "json" : state.importFormat).toUpperCase()} from clipboard`}
                title={`Import ${(state.density === "compact" ? "json" : state.importFormat).toUpperCase()} from clipboard`}
              >
                <IconClipboardPlus size={16} stroke={2} aria-hidden="true" />
              </button>
            </section>
          </div>

          {state.density === "standard" && (
            <div className="transfer-hint">
              File and clipboard actions use the currently selected format.
            </div>
          )}

          <input
            ref={importInputRef}
            type="file"
            accept={getImportAcceptByFormat()}
            style={{ display: "none" }}
            onChange={(e) => void handleImportFileChange(e)}
          />
        </header>

        {state.lastImportReport && (
          <div className="import-report" role="status" aria-live="polite">
            <div className="import-summary">
              Imported: {state.lastImportReport.imported} · Skipped:{" "}
              {state.lastImportReport.skipped} · Failed:{" "}
              {state.lastImportReport.failed}
            </div>
            {state.lastImportReport.errors.length > 0 && (
              <ul className="import-errors">
                {state.lastImportReport.errors
                  .slice(0, 3)
                  .map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {/* Storage Quota Warning */}
        {state.storageQuotaWarning && (
          <div className="quota-warning">
            ⚠️ Storage almost full. Consider exporting or deleting old clips.
          </div>
        )}

        <div className="search-bar" role="search">
          <label htmlFor="search-input" className="sr-only">
            Search clips
          </label>
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
            <div
              className="search-loading"
              aria-label="Searching"
              role="status"
            >
              <div className="search-spinner" aria-hidden="true" />
            </div>
          ) : state.searchQuery ? (
            <button
              onClick={() => void handleSearchChange("")}
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
              className={`block-card ${state.selectedIndex === index ? "selected" : ""}`}
              role="listitem"
              tabIndex={0}
              aria-label={`${getBlockTitle(block)}, clipped ${formatRelativeTime(block.createdAt)} from ${block.source.title}`}
              aria-selected={state.selectedIndex === index}
              onKeyPress={(e) => {
                if (e.key === "Enter") openDetailView(block);
              }}
            >
              <div className="block-header">
                <h3 className="block-title">{getBlockTitle(block)}</h3>
                <span
                  className="block-time"
                  aria-label={`Clipped ${formatRelativeTime(block.createdAt)}`}
                >
                  {formatRelativeTime(block.createdAt)}
                </span>
              </div>
              <p className="block-preview">
                {getContentPreview(block.content)}
              </p>
              <div className="block-source">
                <span className="source-favicon" aria-hidden="true">
                  {block.source.favicon ? (
                    <img src={block.source.favicon} alt="" />
                  ) : (
                    <span>📄</span>
                  )}
                </span>
                <span
                  className="source-title"
                  aria-label={`From ${block.source.title}`}
                >
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
              {state.isLoadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>

        {/* Toast Notifications */}
        {state.toasts.length > 0 && (
          <div className="toast-container">
            {state.toasts.map((toast) => (
              <div key={toast.id} className={`toast ${toast.type}`}>
                {toast.type === "success" && "✓ "}
                {toast.type === "error" && "✗ "}
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
  if (state.currentView === "detail" && state.selectedBlock) {
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
          <div className="detail-header-actions">
            {/* AI Title Regenerate Button */}
            {state.aiAvailable && (
              <button
                onClick={() => void handleRegenerateTitle(block)}
                disabled={state.isRegeneratingTitle}
                className="regenerate-button"
                aria-label="Regenerate AI title"
                title="Regenerate AI title"
              >
                <IconRefresh size={16} stroke={2} aria-hidden="true" />
                {state.isRegeneratingTitle
                  ? " Generating..."
                  : " Regenerate Title"}
              </button>
            )}
            <button
              onClick={() => {
                if (confirm("Delete this clip?")) {
                  void handleDelete(block.id);
                }
              }}
              className="delete-button"
              aria-label="Delete clip"
            >
              🗑️ Delete
            </button>
          </div>
        </header>

        <div className="detail-content">
          {/* Title Display */}
          <div className="detail-title-section">
            {/* AI Generated Indicator */}
            {block.aiGenerated && (
              <div
                className="ai-indicator-inline"
                role="status"
                aria-label="AI generated title"
              >
                ✨ AI-generated
              </div>
            )}
            <h1 className="detail-title">{getBlockTitle(block)}</h1>
          </div>

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
      </div>
    );
  }

  return (
    <div className="sidebar-container">
      <div className="error-state">Error: Unknown state</div>
    </div>
  );
}

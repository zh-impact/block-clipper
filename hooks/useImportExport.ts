/**
 * useImportExport Hook
 * @description Manages file and clipboard import/export operations
 */

import { useState, useCallback } from "react";
import { getStorageService } from "../utils/storage";
import type { Block } from "../utils/block-model";
import type { ImportSummary } from "../utils/storage";
import {
  downloadFile,
  exportBlocksToJSON,
  exportBlocksToMarkdown,
  generateExportFilename,
} from "../utils/exporter";
import type { ExportFormat } from "../utils/exporter";
import type { ImportFormat } from "../utils/importer";
import { exportBlocksToClipboard, importFromClipboard } from "../entrypoints/sidepanel/clipboardFlow";
import { runImportFlow } from "../entrypoints/sidepanel/importFlow";

export interface ImportReport extends ImportSummary {
  parseFailures: string[];
}

export interface UseImportExportOptions {
  onImportComplete?: (count: number) => void;
}

export interface UseImportExportResult {
  isImporting: boolean;
  isExporting: boolean;
  exportFormat: ExportFormat;
  importFormat: ImportFormat;
  lastImportReport: ImportReport | null;
  setExportFormat: (format: ExportFormat) => void;
  setImportFormat: (format: ImportFormat) => void;
  exportToFile: (format?: ExportFormat) => Promise<void>;
  exportToClipboard: (format?: ExportFormat) => Promise<void>;
  importFromFile: (file: File) => Promise<void>;
  importFromClipboard: (format?: ImportFormat) => Promise<void>;
  getImportAcceptByFormat: () => string;
}

/**
 * Sort blocks by createdAt descending (newest first)
 */
function sortBlocks(blocks: Block[]): Block[] {
  return blocks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Hook for managing import/export operations
 */
export function useImportExport(
  showToast: (message: string, type: "success" | "error" | "info", duration?: number) => void,
  options: UseImportExportOptions = {},
): UseImportExportResult {
  const { onImportComplete } = options;

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [importFormat, setImportFormat] = useState<ImportFormat>("json");
  const [lastImportReport, setLastImportReport] = useState<ImportReport | null>(null);

  /**
   * Load all blocks for export
   */
  const loadAllBlocks = useCallback(async (): Promise<Block[]> => {
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

    return sortBlocks(allBlocks);
  }, []);

  /**
   * Export blocks to file
   */
  const exportToFile = useCallback(async (format: ExportFormat = exportFormat) => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const blocks = await loadAllBlocks();
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
      setIsExporting(false);
    }
  }, [isExporting, exportFormat, loadAllBlocks, showToast]);

  /**
   * Export blocks to clipboard
   */
  const exportToClipboard = useCallback(async (format: ExportFormat = exportFormat) => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const blocks = await loadAllBlocks();
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
      setIsExporting(false);
    }
  }, [isExporting, exportFormat, loadAllBlocks, showToast]);

  /**
   * Get accept attribute for file input
   */
  const getImportAcceptByFormat = useCallback((): string => {
    if (importFormat === "markdown") {
      return "text/markdown,.md,.markdown,text/plain";
    }

    return "application/json,.json";
  }, [importFormat]);

  /**
   * Set import failure report
   */
  const setImportFailureReport = useCallback((message: string) => {
    setIsImporting(false);
    setLastImportReport({
      imported: 0,
      skipped: 0,
      failed: 1,
      parseFailures: [message],
      errors: [message],
    });
  }, []);

  /**
   * Import content from string
   */
  const importContent = useCallback(async (
    content: string,
    format: ImportFormat,
    sourceLabel: "File" | "Clipboard",
  ) => {
    const storageService = getStorageService();
    const report = await runImportFlow(content, storageService, format);

    setIsImporting(false);
    setLastImportReport(report);

    if (report.imported > 0 && onImportComplete) {
      onImportComplete(report.imported);
    }

    showToast(
      `${sourceLabel} import (${format.toUpperCase()}): ${report.imported} imported, ${report.skipped} skipped, ${report.failed} failed`,
      report.failed > 0 ? "info" : "success",
      4500,
    );
  }, [showToast, onImportComplete]);

  /**
   * Import from file
   */
  const importFromFile = useCallback(async (file: File) => {
    if (isImporting) {
      return;
    }

    try {
      const content = await file.text();
      await importContent(content, importFormat, "File");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      setImportFailureReport(message);
      showToast(message, "error");
    }
  }, [isImporting, importFormat, importContent, setImportFailureReport, showToast]);

  /**
   * Import from clipboard
   */
  const importFromClipboardHandler = useCallback(async (format: ImportFormat = importFormat) => {
    if (isImporting) {
      return;
    }

    setIsImporting(true);

    try {
      const storageService = getStorageService();
      const report = await importFromClipboard(storageService, format);

      setIsImporting(false);
      setLastImportReport(report);

      if (report.imported > 0 && onImportComplete) {
        onImportComplete(report.imported);
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
  }, [isImporting, importFormat, onImportComplete, setImportFailureReport, showToast]);

  return {
    isImporting,
    isExporting,
    exportFormat,
    importFormat,
    lastImportReport,
    setExportFormat,
    setImportFormat,
    exportToFile,
    exportToClipboard,
    importFromFile,
    importFromClipboard: importFromClipboardHandler,
    getImportAcceptByFormat,
  };
}

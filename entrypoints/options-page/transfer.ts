import { readTextFromClipboard } from '../../utils/clipboard';
import type { Block } from '../../utils/block-model';
import { downloadFile, exportBlocksToClipboard, exportBlocksToJSON, exportBlocksToMarkdown, generateExportFilename } from '../../utils/exporter';
import type { ExportFormat } from '../../utils/exporter';
import { getImportFileSizeError, runImportFlow } from '../sidepanel/importFlow';
import type { ImportFlowResult } from '../sidepanel/importFlow';
import type { ImportFormat } from '../../utils/importer';

export type DensityMode = 'standard' | 'compact';

export function getEffectiveFormat<T extends ExportFormat | ImportFormat>(density: DensityMode, selected: T): T | 'json' {
  return density === 'compact' ? 'json' : selected;
}

export function getImportAcceptByFormat(format: ImportFormat): string {
  if (format === 'markdown') {
    return 'text/markdown,.md,.markdown,text/plain';
  }

  return 'application/json,.json';
}

export function buildExportContent(blocks: Block[], format: ExportFormat): string {
  return format === 'json' ? exportBlocksToJSON(blocks) : exportBlocksToMarkdown(blocks);
}

export function exportToFile(blocks: Block[], format: ExportFormat): { filename: string } {
  const content = buildExportContent(blocks, format);
  const filename = generateExportFilename(format, blocks.length);
  downloadFile(content, filename);
  return { filename };
}

export async function exportToClipboard(blocks: Block[], format: ExportFormat): Promise<void> {
  const result = await exportBlocksToClipboard(blocks, format);
  if (!result.ok) {
    throw new Error(result.error || 'Failed to copy data to clipboard.');
  }
}

export async function importFromText(
  content: string,
  format: ImportFormat,
  storageService: Parameters<typeof runImportFlow>[1]
): Promise<ImportFlowResult> {
  return runImportFlow(content, storageService, format);
}

export async function importFromClipboard(
  format: ImportFormat,
  storageService: Parameters<typeof runImportFlow>[1]
): Promise<ImportFlowResult> {
  const clipboardResult = await readTextFromClipboard();
  if (!clipboardResult.ok) {
    throw new Error(clipboardResult.error || 'Failed to read clipboard.');
  }

  const text = clipboardResult.text || '';
  const sizeError = getImportFileSizeError(new Blob([text]).size);
  if (sizeError) {
    throw new Error(sizeError);
  }

  return runImportFlow(text, storageService, format);
}

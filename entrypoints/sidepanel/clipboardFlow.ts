import type { Block } from '../../utils/block-model';
import { readTextFromClipboard } from '../../utils/clipboard';
import { exportBlocksToClipboard as exportByFormat } from '../../utils/exporter';
import type { ExportFormat } from '../../utils/exporter';
import { getImportFileSizeError, runImportFlow } from './importFlow';
import type { ImportFormat } from '../../utils/importer';

export async function exportBlocksToClipboard(
  blocks: Block[],
  format: ExportFormat
): Promise<{ ok: boolean; error?: string; copiedText?: string }> {
  const result = await exportByFormat(blocks, format);
  return {
    ok: result.ok,
    error: result.error,
    copiedText: result.content,
  };
}

export async function importFromClipboard(
  storageService: {
    importRecords: Parameters<typeof runImportFlow>[1]['importRecords'];
  },
  format: ImportFormat
) {
  const clipboardResult = await readTextFromClipboard();
  if (!clipboardResult.ok) {
    throw new Error(clipboardResult.error || 'Failed to read clipboard.');
  }

  const clipboardText = clipboardResult.text || '';
  const sizeError = getImportFileSizeError(new Blob([clipboardText]).size);
  if (sizeError) {
    throw new Error(sizeError);
  }

  return runImportFlow(clipboardText, storageService, format);
}

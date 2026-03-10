/**
 * Export utilities for Block Clipper
 * @description Export blocks to various formats (JSON, Markdown)
 */

import type { Block } from '../block-model';
import { copyTextToClipboard } from '../clipboard';

/**
 * Export format type
 */
export type ExportFormat = 'json' | 'markdown';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  separator?: string; // For Markdown: separator between items
}

/**
 * Export a single block to JSON string
 * @param block Block to export
 * @param options Export options
 * @returns JSON string
 */
export function exportBlockToJSON(block: Block, options: ExportOptions = { format: 'json' }): string {
  const data = options.includeMetadata
    ? block
    : {
        type: block.type,
        content: block.content,
        source: block.source,
        createdAt: block.createdAt,
      };

  return JSON.stringify(data, null, 2);
}

/**
 * Export multiple blocks to JSON string
 * @param blocks Array of blocks to export
 * @param options Export options
 * @returns JSON string
 */
export function exportBlocksToJSON(blocks: Block[], options: ExportOptions = { format: 'json' }): string {
  const data = options.includeMetadata
    ? blocks
    : blocks.map((block) => ({
        type: block.type,
        content: block.content,
        source: block.source,
        createdAt: block.createdAt,
      }));

  return JSON.stringify(data, null, 2);
}

/**
 * Export a single block to Markdown string
 * @param block Block to export
 * @param options Export options
 * @returns Markdown string
 */
export function exportBlockToMarkdown(block: Block, options: ExportOptions = { format: 'markdown' }): string {
  const { includeMetadata = true, separator = '' } = options;

  const parts: string[] = [];

  // YAML frontmatter
  if (includeMetadata) {
    parts.push('---');
    parts.push(`type: ${block.type}`);
    parts.push(`created_at: ${block.createdAt}`);
    parts.push(`updated_at: ${block.updatedAt}`);
    parts.push(`source_url: ${block.source.url}`);
    parts.push(`source_title: ${block.source.title}`);
    parts.push('---');
    parts.push('');
  }

  // Content
  parts.push(block.content);

  // Source reference
  if (includeMetadata) {
    parts.push('');
    parts.push('');
    parts.push(`*From: [${block.source.title}](${block.source.url})*`);
    parts.push(`*Saved: ${new Date(block.createdAt).toLocaleString()}*`);
  }

  return parts.join('\n') + separator;
}

/**
 * Export multiple blocks to Markdown string
 * @param blocks Array of blocks to export
 * @param options Export options
 * @returns Markdown string
 */
export function exportBlocksToMarkdown(blocks: Block[], options: ExportOptions = { format: 'markdown' }): string {
  const { separator = '\n\n---\n\n' } = options;

  return blocks
    .map((block) => exportBlockToMarkdown(block, { ...options, separator: '' }))
    .join(separator);
}

/**
 * Generate export filename
 * @param format Export format
 * @param count Number of items in export
 * @returns Filename with timestamp
 */
export function generateExportFilename(format: ExportFormat, count: number): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  const ext = format === 'json' ? 'json' : 'md';

  return `block-clipper-export_${dateStr}_${timeStr}_${count}-items.${ext}`;
}

/**
 * Trigger file download in browser
 * @param content File content
 * @param filename Filename
 */
export function downloadFile(content: string, filename: string): void {
  // Create blob with UTF-8 BOM for better compatibility
  const blob = new Blob(['\ufeff' + content], { type: 'text/plain;charset=utf-8' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export blocks and trigger download
 * @param blocks Blocks to export
 * @param format Export format
 */
export function exportAndDownload(blocks: Block[], format: ExportFormat): void {
  const filename = generateExportFilename(format, blocks.length);

  if (format === 'json') {
    const content = exportBlocksToJSON(blocks);
    downloadFile(content, filename);
  } else if (format === 'markdown') {
    const content = exportBlocksToMarkdown(blocks);
    downloadFile(content, filename);
  }
}

export async function exportBlocksJSONToClipboard(
  blocks: Block[],
  options: ExportOptions = { format: 'json' }
): Promise<{ ok: boolean; error?: string; content?: string }> {
  const content = exportBlocksToJSON(blocks, options);
  const result = await copyTextToClipboard(content);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, content };
}

export async function exportBlocksToClipboard(
  blocks: Block[],
  format: ExportFormat
): Promise<{ ok: boolean; error?: string; content?: string }> {
  const content = format === 'json'
    ? exportBlocksToJSON(blocks, { format: 'json' })
    : exportBlocksToMarkdown(blocks, { format: 'markdown' });

  const result = await copyTextToClipboard(content);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, content };
}

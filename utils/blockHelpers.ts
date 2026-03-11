/**
 * Block Helper Functions
 * @description Pure utility functions for working with blocks
 */

import type { Block } from './block-model';

/**
 * Format relative timestamp
 * @param timestamp ISO timestamp string
 * @returns Human-readable relative time (e.g., "just now", "5m ago", "2h ago")
 */
export function formatRelativeTime(timestamp: string): string {
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
 * @param content Block content (markdown)
 * @param maxLength Maximum length of preview
 * @returns Plain text preview without markdown formatting
 */
export function getContentPreview(content: string, maxLength = 100): string {
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
}

/**
 * Get title from block title field, metadata, or content
 * @param block Block object
 * @returns Block title, prioritizing title field > metadata.title > content
 */
export function getBlockTitle(block: Block): string {
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
  const firstLine = block.content.split('\n')[0].trim();
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim();

  return withoutMarkdown.substring(0, 50) || 'Untitled Clip';
}

/**
 * Format block creation date as localized string
 * @param timestamp ISO timestamp string
 * @returns Localized date string
 */
export function formatLocaleDate(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Get short title from block (for limited space displays)
 * @param block Block object
 * @param maxLength Maximum title length (default: 30)
 * @returns Shortened title
 */
export function getShortBlockTitle(block: Block, maxLength = 30): string {
  const title = getBlockTitle(block);
  return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
}

/**
 * Check if block has AI-generated title
 * @param block Block object
 * @returns True if title was AI-generated
 */
export function isAIGenerated(block: Block): boolean {
  return !!block.aiGenerated;
}

/**
 * Get favicon URL or fallback emoji
 * @param block Block object
 * @returns Favicon URL or emoji
 */
export function getFaviconOrEmoji(block: Block): string {
  return block.source.favicon || '📄';
}

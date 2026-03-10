import { describe, expect, it } from 'vitest';
import {
  normalizeImportTimestamp,
  parseImportContent,
  parseImportJsonContent,
  parseImportMarkdownContent,
  validateImportFileSize,
  MAX_IMPORT_FILE_BYTES,
} from '../../../utils/importer';

describe('importer utilities', () => {
  it('parses valid exported JSON records', () => {
    const content = JSON.stringify([
      {
        type: 'text',
        content: 'Sample block content',
        source: { url: 'https://example.com', title: 'Example' },
        createdAt: '2026-03-10T00:00:00.000Z',
      },
    ]);

    const result = parseImportJsonContent(content);

    expect(result.failures).toHaveLength(0);
    expect(result.validRecords).toHaveLength(1);
    expect(result.validRecords[0].content).toBe('Sample block content');
  });

  it('returns file-level error for invalid JSON', () => {
    const result = parseImportJsonContent('{not-json');
    expect(result.validRecords).toHaveLength(0);
    expect(result.failures[0].index).toBeNull();
  });

  it('returns record-level error for missing required fields', () => {
    const content = JSON.stringify([
      {
        type: 'text',
        source: { url: 'https://example.com', title: 'Example' },
      },
    ]);

    const result = parseImportJsonContent(content);
    expect(result.validRecords).toHaveLength(0);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0].index).toBe(0);
  });

  it('parses markdown exports with frontmatter', () => {
    const content = `---
type: text
created_at: 2026-03-10T00:00:00.000Z
source_url: https://example.com
source_title: Example
---

Markdown content body

*From: [Example](https://example.com)*
*Saved: 3/10/2026, 8:00:00 AM*`;

    const result = parseImportMarkdownContent(content);

    expect(result.failures).toHaveLength(0);
    expect(result.validRecords).toHaveLength(1);
    expect(result.validRecords[0].content).toBe('Markdown content body');
    expect(result.validRecords[0].source.url).toBe('https://example.com');
  });

  it('dispatches parser by format', () => {
    const jsonContent = JSON.stringify([
      {
        type: 'text',
        content: 'json text',
        source: { url: 'https://example.com', title: 'Example' },
        createdAt: '2026-03-10T00:00:00.000Z',
      },
    ]);

    const result = parseImportContent(jsonContent, 'json');
    expect(result.validRecords).toHaveLength(1);
  });

  it('normalizes invalid timestamps to ISO strings', () => {
    const normalized = normalizeImportTimestamp('invalid-date');
    expect(new Date(normalized).toISOString()).toBe(normalized);
  });

  it('validates file size guard', () => {
    expect(validateImportFileSize(MAX_IMPORT_FILE_BYTES + 1)).toContain('Maximum supported size');
    expect(validateImportFileSize(MAX_IMPORT_FILE_BYTES - 1)).toBeNull();
  });
});

import type { BlockType, BlockSource } from '../block-model';

const SUPPORTED_TYPES: BlockType[] = ['text', 'heading', 'code', 'quote', 'list'];
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;
export type ImportFormat = 'json' | 'markdown';

export interface ImportRecord {
  type: BlockType;
  content: string;
  source: BlockSource;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ImportParseFailure {
  index: number | null;
  reason: string;
}

export interface ImportParseResult {
  validRecords: ImportRecord[];
  failures: ImportParseFailure[];
}

interface ExportLikeRecord {
  type?: unknown;
  content?: unknown;
  source?: {
    url?: unknown;
    title?: unknown;
    favicon?: unknown;
  };
  createdAt?: unknown;
  metadata?: unknown;
}

interface MarkdownFrontmatter {
  type?: string;
  created_at?: string;
  source_url?: string;
  source_title?: string;
}

export function normalizeImportTimestamp(input: unknown): string {
  if (typeof input !== 'string') {
    return new Date().toISOString();
  }

  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function validateAndNormalizeRecord(record: unknown, index: number): { value?: ImportRecord; error?: string } {
  if (typeof record !== 'object' || record === null) {
    return { error: `Record ${index + 1}: must be an object` };
  }

  const candidate = record as ExportLikeRecord;

  if (typeof candidate.type !== 'string' || !SUPPORTED_TYPES.includes(candidate.type as BlockType)) {
    return { error: `Record ${index + 1}: unsupported or missing block type` };
  }

  if (typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
    return { error: `Record ${index + 1}: content is required` };
  }

  if (!candidate.source || typeof candidate.source !== 'object') {
    return { error: `Record ${index + 1}: source is required` };
  }

  if (typeof candidate.source.url !== 'string' || typeof candidate.source.title !== 'string') {
    return { error: `Record ${index + 1}: source.url and source.title are required` };
  }

  const normalized: ImportRecord = {
    type: candidate.type as BlockType,
    content: candidate.content,
    source: {
      url: candidate.source.url,
      title: candidate.source.title,
      favicon: typeof candidate.source.favicon === 'string' ? candidate.source.favicon : undefined,
    },
    createdAt: normalizeImportTimestamp(candidate.createdAt),
    metadata: typeof candidate.metadata === 'object' && candidate.metadata !== null
      ? (candidate.metadata as Record<string, unknown>)
      : {},
  };

  return { value: normalized };
}

export function parseImportJsonContent(content: string): ImportParseResult {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return {
      validRecords: [],
      failures: [{ index: null, reason: 'Import file is empty' }],
    };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      validRecords: [],
      failures: [{ index: null, reason: 'Import file is not valid JSON' }],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      validRecords: [],
      failures: [{ index: null, reason: 'Import JSON must be an array of records' }],
    };
  }

  const validRecords: ImportRecord[] = [];
  const failures: ImportParseFailure[] = [];

  parsed.forEach((item, index) => {
    const result = validateAndNormalizeRecord(item, index);
    if (result.value) {
      validRecords.push(result.value);
      return;
    }

    failures.push({
      index,
      reason: result.error || `Record ${index + 1}: invalid format`,
    });
  });

  return { validRecords, failures };
}

function parseMarkdownFrontmatter(frontmatter: string): MarkdownFrontmatter {
  const result: MarkdownFrontmatter = {};
  const lines = frontmatter.split('\n');

  lines.forEach((line) => {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      return;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key === 'type' || key === 'created_at' || key === 'source_url' || key === 'source_title') {
      result[key] = value;
    }
  });

  return result;
}

function normalizeMarkdownBody(body: string): string {
  const lines = body.trim().split('\n');
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  const maybeSavedLine = lines[lines.length - 1] || '';
  if (maybeSavedLine.startsWith('*Saved:')) {
    lines.pop();
  }

  const maybeFromLine = lines[lines.length - 1] || '';
  if (maybeFromLine.startsWith('*From:')) {
    lines.pop();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}

function parseMarkdownDocument(doc: string, index: number): { value?: ImportRecord; error?: string } {
  const match = doc.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { error: `Record ${index + 1}: markdown block is missing frontmatter` };
  }

  const [, frontmatterRaw, bodyRaw] = match;
  const frontmatter = parseMarkdownFrontmatter(frontmatterRaw);
  const content = normalizeMarkdownBody(bodyRaw);

  return validateAndNormalizeRecord(
    {
      type: frontmatter.type,
      content,
      source: {
        url: frontmatter.source_url,
        title: frontmatter.source_title,
      },
      createdAt: frontmatter.created_at,
      metadata: {},
    },
    index
  );
}

export function parseImportMarkdownContent(content: string): ImportParseResult {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return {
      validRecords: [],
      failures: [{ index: null, reason: 'Import file is empty' }],
    };
  }

  const documents = content
    .split(/\n\n---\n\n(?=---\n)/)
    .map((doc) => doc.trim())
    .filter(Boolean);

  if (documents.length === 0) {
    return {
      validRecords: [],
      failures: [{ index: null, reason: 'Import markdown format is invalid' }],
    };
  }

  const validRecords: ImportRecord[] = [];
  const failures: ImportParseFailure[] = [];

  documents.forEach((doc, index) => {
    const result = parseMarkdownDocument(doc, index);
    if (result.value) {
      validRecords.push(result.value);
      return;
    }

    failures.push({
      index,
      reason: result.error || `Record ${index + 1}: invalid markdown block`,
    });
  });

  return { validRecords, failures };
}

export function parseImportContent(content: string, format: ImportFormat): ImportParseResult {
  if (format === 'markdown') {
    return parseImportMarkdownContent(content);
  }

  return parseImportJsonContent(content);
}

export function validateImportFileSize(sizeInBytes: number): string | null {
  if (sizeInBytes > MAX_IMPORT_FILE_BYTES) {
    return `File is too large. Maximum supported size is ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))}MB.`;
  }

  return null;
}

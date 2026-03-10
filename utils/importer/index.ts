import type { BlockType, BlockSource } from '../block-model';

const SUPPORTED_TYPES: BlockType[] = ['text', 'heading', 'code', 'quote', 'list'];
export const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

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

export function validateImportFileSize(sizeInBytes: number): string | null {
  if (sizeInBytes > MAX_IMPORT_FILE_BYTES) {
    return `File is too large. Maximum supported size is ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))}MB.`;
  }

  return null;
}

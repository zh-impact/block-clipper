import { parseImportContent, validateImportFileSize } from '../../utils/importer';
import type { ImportRecord } from '../../utils/importer';
import type { ImportSummary } from '../../utils/storage';
import type { ImportFormat } from '../../utils/importer';

export interface ImportFlowResult extends ImportSummary {
  parseFailures: string[];
}

export async function runImportFlow(
  fileText: string,
  storageService: { importRecords: (records: ImportRecord[], batchSize?: number) => Promise<ImportSummary> },
  format: ImportFormat = 'json'
): Promise<ImportFlowResult> {
  const parseResult = parseImportContent(fileText, format);

  const fileLevelFailure = parseResult.failures.find((failure) => failure.index === null);
  if (fileLevelFailure) {
    throw new Error(fileLevelFailure.reason);
  }

  const importSummary = await storageService.importRecords(parseResult.validRecords, 50);

  return {
    ...importSummary,
    failed: importSummary.failed + parseResult.failures.length,
    parseFailures: parseResult.failures.map((failure) => failure.reason),
    errors: [...parseResult.failures.map((failure) => failure.reason), ...importSummary.errors],
  };
}

export function getImportFileSizeError(sizeInBytes: number): string | null {
  return validateImportFileSize(sizeInBytes);
}

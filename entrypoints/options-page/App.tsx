import { useEffect, useMemo, useRef, useState, type ChangeEvent, type JSX } from 'react';
import { IconClipboardCopy, IconClipboardPlus, IconFileExport, IconFileImport } from '@tabler/icons-react';
import type { Block } from '../../utils/block-model';
import { getStorageService } from '../../utils/storage';
import type { ExportFormat } from '../../utils/exporter';
import type { ImportFormat } from '../../utils/importer';
import { getImportFileSizeError } from '../sidepanel/importFlow';
import {
  type DensityMode,
  buildExportContent,
  exportToClipboard,
  exportToFile,
  getEffectiveFormat,
  getImportAcceptByFormat,
  importFromClipboard,
  importFromText,
} from './transfer';

type View = 'list' | 'detail';

interface ImportReport {
  imported: number;
  skipped: number;
  failed: number;
  errors: string[];
}

function formatRelativeTime(timestamp: string): string {
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

function getContentPreview(content: string, maxLength = 100): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText;
}

function getBlockTitle(block: Block): string {
  const metadataTitle = (block.metadata.title as string | undefined)?.trim();
  if (metadataTitle) return metadataTitle;

  const firstLine = block.content.split('\n')[0].trim();
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim();

  return withoutMarkdown.substring(0, 50) || 'Untitled Clip';
}

export default function App(): JSX.Element {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>('list');
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [importFormat, setImportFormat] = useState<ImportFormat>('json');
  const [density, setDensity] = useState<DensityMode>('standard');
  const [importReport, setImportReport] = useState<ImportReport | null>(null);

  const filteredBlocks = useMemo(() => {
    if (!query.trim()) return blocks;

    const keyword = query.toLowerCase();
    return blocks.filter((block) => block.content.toLowerCase().includes(keyword) || block.source.title.toLowerCase().includes(keyword));
  }, [blocks, query]);

  const loadBlocks = async (): Promise<void> => {
    setError(null);

    try {
      const storageService = getStorageService();
      await storageService.initialize();

      const all: Block[] = [];
      let page = 1;
      const limit = 200;

      while (true) {
        const result = await storageService.query({ page, limit });
        all.push(...result.items);
        if (page >= result.totalPages || result.items.length === 0) break;
        page += 1;
      }

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBlocks(all);
      if (selectedBlock) {
        const refreshed = all.find((item) => item.id === selectedBlock.id) ?? null;
        setSelectedBlock(refreshed);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clips');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBlocks();
  }, []);

  const handleDelete = async (block: Block): Promise<void> => {
    if (!confirm(`Delete "${getBlockTitle(block)}"?`)) {
      return;
    }

    try {
      const storageService = getStorageService();
      await storageService.delete(block.id);
      setView('list');
      setSelectedBlock(null);
      await loadBlocks();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete clip');
    }
  };

  const handleExportFile = async (): Promise<void> => {
    if (isExporting) return;
    if (blocks.length === 0) {
      alert('No clips to export');
      return;
    }

    setIsExporting(true);
    try {
      const effective = getEffectiveFormat(density, exportFormat);
      exportToFile(blocks, effective);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClipboard = async (): Promise<void> => {
    if (isExporting) return;
    if (blocks.length === 0) {
      alert('No clips to export');
      return;
    }

    setIsExporting(true);
    try {
      const effective = getEffectiveFormat(density, exportFormat);
      await exportToClipboard(blocks, effective);
      alert(`Copied ${blocks.length} ${effective.toUpperCase()} clips to clipboard.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to copy export');
    } finally {
      setIsExporting(false);
    }
  };

  const onImportButtonClick = (): void => {
    if (isImporting) return;

    const effective = getEffectiveFormat(density, importFormat);
    const accept = getImportAcceptByFormat(effective);
    importInputRef.current?.setAttribute('accept', accept);
    importInputRef.current?.click();
  };

  const handleImportResult = async (content: string): Promise<void> => {
    const effective = getEffectiveFormat(density, importFormat);
    const storageService = getStorageService();
    const result = await importFromText(content, effective, storageService);
    setImportReport({
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      errors: result.errors,
    });
    await loadBlocks();
  };

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    const sizeError = getImportFileSizeError(file.size);
    if (sizeError) {
      setImportReport({ imported: 0, skipped: 0, failed: 1, errors: [sizeError] });
      return;
    }

    setIsImporting(true);
    try {
      const content = await file.text();
      await handleImportResult(content);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Import failed';
      setImportReport({ imported: 0, skipped: 0, failed: 1, errors: [message] });
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClipboard = async (): Promise<void> => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const effective = getEffectiveFormat(density, importFormat);
      const storageService = getStorageService();
      const result = await importFromClipboard(effective, storageService);
      setImportReport({
        imported: result.imported,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors,
      });
      await loadBlocks();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Clipboard import failed';
      setImportReport({ imported: 0, skipped: 0, failed: 1, errors: [message] });
    } finally {
      setIsImporting(false);
    }
  };

  const renderList = (): JSX.Element => {
    if (isLoading) {
      return <div className="state-block">Loading clips...</div>;
    }

    if (error) {
      return <div className="state-block state-error">{error}</div>;
    }

    if (filteredBlocks.length === 0) {
      return <div className="state-block">No clips found.</div>;
    }

    return (
      <div id="clips" className="clips-grid">
        {filteredBlocks.map((block) => (
          <article className="clip-card" key={block.id} onClick={() => { setSelectedBlock(block); setView('detail'); }}>
            <div className="clip-header">
              <div className="clip-title">{getBlockTitle(block)}</div>
              <div className="clip-header-right">
                <div className="clip-time">{formatRelativeTime(block.createdAt)}</div>
                <button
                  className="delete-icon-button"
                  type="button"
                  title="Delete clip"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDelete(block);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
            <div className="clip-preview">{getContentPreview(block.content)}</div>
            <div className="clip-source">{block.source.title}</div>
          </article>
        ))}
      </div>
    );
  };

  const selectedExportContent = selectedBlock
    ? {
        json: buildExportContent([selectedBlock], 'json'),
        markdown: buildExportContent([selectedBlock], 'markdown'),
      }
    : null;

  return (
    <div className={`page ${density === 'compact' ? 'density-compact' : ''}`}>
      <header>
        <div className="header-top-row">
          <h1>📋 Block Clipper</h1>
          <button
            id="density-toggle"
            className="density-toggle"
            type="button"
            onClick={() => setDensity((prev) => (prev === 'standard' ? 'compact' : 'standard'))}
          >
            {density === 'standard' ? 'Compact' : 'Standard'}
          </button>
        </div>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clips..."
          aria-label="Search clips"
        />

        <div className="toolbar-grid">
          <section className="transfer-group" aria-label="Export controls">
            <span className="transfer-label">Export</span>
            {density === 'standard' && (
              <select className="format-select" value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            )}
            <button id="export-file" className="icon-button" type="button" aria-label="Export to file" onClick={() => void handleExportFile()} disabled={isExporting || blocks.length === 0}>
              <IconFileExport size={16} stroke={2} aria-hidden="true" />
            </button>
            <button id="export-clipboard" className="icon-button" type="button" aria-label="Copy to clipboard" onClick={() => void handleExportClipboard()} disabled={isExporting || blocks.length === 0}>
              <IconClipboardCopy size={16} stroke={2} aria-hidden="true" />
            </button>
          </section>

          <section className="transfer-group" aria-label="Import controls">
            <span className="transfer-label">Import</span>
            {density === 'standard' && (
              <select className="format-select" value={importFormat} onChange={(event) => setImportFormat(event.target.value as ImportFormat)}>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            )}
            <button id="import-file" className="icon-button" type="button" aria-label="Import from file" onClick={onImportButtonClick} disabled={isImporting}>
              <IconFileImport size={16} stroke={2} aria-hidden="true" />
            </button>
            <button id="import-clipboard" className="icon-button" type="button" aria-label="Import from clipboard" onClick={() => void handleImportClipboard()} disabled={isImporting}>
              <IconClipboardPlus size={16} stroke={2} aria-hidden="true" />
            </button>
          </section>
        </div>

        {density === 'standard' && <div className="toolbar-hint">File and clipboard actions use the selected format.</div>}

        <input ref={importInputRef} id="import-input" type="file" style={{ display: 'none' }} onChange={(event) => void handleImportFileChange(event)} />
      </header>

      <main>
        {importReport && (
          <div className="import-report" role="status">
            Imported: {importReport.imported} · Skipped: {importReport.skipped} · Failed: {importReport.failed}
            {importReport.errors.length > 0 && <div className="state-error">{importReport.errors.slice(0, 2).join(' | ')}</div>}
          </div>
        )}

        {view === 'list' && renderList()}

        {view === 'detail' && selectedBlock && (
          <div id="detail" className="detail active">
            <div className="detail-header">
              <button className="back-button" type="button" onClick={() => setView('list')}>← Back to list</button>
            </div>
            <div className="detail-content">
              <h2>{getBlockTitle(selectedBlock)}</h2>
              <div className="detail-meta">
                <a href={selectedBlock.source.url} target="_blank" rel="noreferrer">{selectedBlock.source.title}</a>
                <span>{new Date(selectedBlock.createdAt).toLocaleString()}</span>
              </div>
              <pre>{selectedBlock.content}</pre>
              <div className="detail-actions">
                <button className="export-single-button" type="button" onClick={() => exportToFile([selectedBlock], 'json')}>Export JSON</button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return;
                    void navigator.clipboard.writeText(selectedExportContent.json);
                  }}
                >
                  Copy JSON
                </button>
                <button className="export-single-button" type="button" onClick={() => exportToFile([selectedBlock], 'markdown')}>Export Markdown</button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return;
                    void navigator.clipboard.writeText(selectedExportContent.markdown);
                  }}
                >
                  Copy Markdown
                </button>
                <button className="delete-button" type="button" onClick={() => void handleDelete(selectedBlock)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; height: 100%; }
        .page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f5f5f5;
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }
        header {
          padding: 16px 24px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
        }
        .header-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        h1 { margin: 0; font-size: 20px; }
        .density-toggle {
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #334155;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          cursor: pointer;
        }
        input[type='text'] {
          width: 100%;
          max-width: 420px;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        .toolbar-grid {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .transfer-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border: 1px solid #2563eb;
          background: #f8fbff;
          border-radius: 8px;
        }
        .transfer-label {
          font-size: 11px;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
        }
        .format-select {
          border: 1px solid #cbd5e1;
          background: #fff;
          color: #1e293b;
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .icon-button {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #2563eb;
          background: #eff6ff;
          color: #1d4ed8;
          border-radius: 6px;
          cursor: pointer;
        }
        .icon-button:disabled,
        .format-select:disabled {
          opacity: .65;
          cursor: wait;
        }
        .toolbar-hint { margin-top: 8px; font-size: 11px; color: #64748b; }
        main { flex: 1; overflow-y: auto; padding: 16px 24px; }
        .import-report {
          margin-bottom: 12px;
          padding: 8px 10px;
          border: 1px solid #dbeafe;
          background: #f8fbff;
          border-radius: 8px;
          font-size: 12px;
        }
        .clips-grid { display: grid; gap: 10px; }
        .clip-card {
          padding: 12px 16px;
          background: #fff;
          border: 1px solid #e5e5e5;
          border-radius: 6px;
          cursor: pointer;
        }
        .clip-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
        .clip-title { font-weight: 500; font-size: 14px; color: #333; }
        .clip-header-right { display: flex; align-items: center; gap: 8px; }
        .clip-time, .clip-source { font-size: 11px; color: #999; }
        .clip-preview { font-size: 12px; color: #666; margin: 0 0 6px 0; }
        .delete-icon-button { background: none; border: none; cursor: pointer; }
        .state-block { text-align: center; padding: 40px 20px; color: #666; }
        .state-error { color: #991b1b; }
        .detail-content {
          background: #fff;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e5e5e5;
        }
        .detail-meta { margin-bottom: 12px; border-bottom: 1px solid #e5e5e5; padding-bottom: 12px; display: flex; gap: 16px; font-size: 12px; }
        pre { background: #f9f9f9; padding: 12px; border-radius: 4px; white-space: pre-wrap; }
        .detail-actions { margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
        .export-single-button, .delete-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          font-size: 13px;
        }
        .export-single-button { background: #3498db; }
        .delete-button { background: #dc3545; }
        .back-button { padding: 8px 0; border: none; background: none; color: #3498db; cursor: pointer; }

        .density-compact header { padding: 12px 16px; }
        .density-compact main { padding: 12px 16px; }
        .density-compact .transfer-label,
        .density-compact .format-select,
        .density-compact .toolbar-hint { display: none; }
        .density-compact .transfer-group { border: none; background: transparent; padding: 0; }
        .density-compact .icon-button { width: 26px; height: 26px; }
      `}</style>
    </div>
  );
}

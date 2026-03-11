import { useEffect, useMemo, useRef, useState, type ChangeEvent, type JSX } from 'react'
import {
  IconClipboardCopy,
  IconClipboardPlus,
  IconFileExport,
  IconFileImport,
} from '@tabler/icons-react'
import type { Block } from '../../utils/block-model'
import { getStorageService } from '../../utils/storage'
import type { ExportFormat } from '../../utils/exporter'
import type { ImportFormat } from '../../utils/importer'
import { getImportFileSizeError } from '../sidepanel/importFlow'
import './App.css'
import {
  type DensityMode,
  buildExportContent,
  exportToClipboard,
  exportToFile,
  getEffectiveFormat,
  getImportAcceptByFormat,
  importFromClipboard,
  importFromText,
} from './transfer'

type View = 'list' | 'detail'

interface ImportReport {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return new Date(timestamp).toLocaleDateString()
}

function getContentPreview(content: string, maxLength = 100): string {
  const plainText = content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, ' ')
    .trim()

  return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText
}

function getBlockTitle(block: Block): string {
  // First, check if block has a title field
  if (block.title && block.title.trim()) {
    return block.title.trim()
  }

  // Fall back to metadata.title for backward compatibility
  const metadataTitle = (block.metadata.title as string | undefined)?.trim()
  if (metadataTitle) return metadataTitle

  const firstLine = block.content.split('\n')[0].trim()
  const withoutMarkdown = firstLine
    .replace(/#{1,6}\s/, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')
    .trim()

  return withoutMarkdown.substring(0, 50) || 'Untitled Clip'
}

export default function App(): JSX.Element {
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('list')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [importFormat, setImportFormat] = useState<ImportFormat>('json')
  const [density, setDensity] = useState<DensityMode>('standard')
  const [importReport, setImportReport] = useState<ImportReport | null>(null)

  const filteredBlocks = useMemo(() => {
    if (!query.trim()) return blocks

    const keyword = query.toLowerCase()
    return blocks.filter(
      (block) =>
        block.content.toLowerCase().includes(keyword) ||
        block.source.title.toLowerCase().includes(keyword),
    )
  }, [blocks, query])

  const loadBlocks = async (): Promise<void> => {
    setError(null)

    try {
      const storageService = getStorageService()
      await storageService.initialize()

      const all: Block[] = []
      let page = 1
      const limit = 200

      while (true) {
        const result = await storageService.query({ page, limit })
        all.push(...result.items)
        if (page >= result.totalPages || result.items.length === 0) break
        page += 1
      }

      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setBlocks(all)
      if (selectedBlock) {
        const refreshed = all.find((item) => item.id === selectedBlock.id) ?? null
        setSelectedBlock(refreshed)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clips')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBlocks()
  }, [])

  // Listen for messages from background (new clip added, block updated, etc.)
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('[Options App] Received message:', message)

      if (message.type === 'NEW_CLIP_ADDED') {
        // Reload blocks to show the new clip
        void loadBlocks()
      } else if (message.type === 'BLOCK_UPDATED') {
        // Update specific block in the list
        const updatedBlock = message.data.block as Block
        setBlocks((prevBlocks) =>
          prevBlocks.map((block) => (block.id === updatedBlock.id ? updatedBlock : block)),
        )

        // Update selected block if it's the same one
        if (selectedBlock?.id === updatedBlock.id) {
          setSelectedBlock(updatedBlock)
        }
      }
    }

    // Listen for messages from background
    chrome.runtime.onMessage.addListener(handleMessage)

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage)
    }
  }, [selectedBlock])

  const handleDelete = async (block: Block): Promise<void> => {
    if (!confirm(`Delete "${getBlockTitle(block)}"?`)) {
      return
    }

    try {
      const storageService = getStorageService()
      await storageService.delete(block.id)
      setView('list')
      setSelectedBlock(null)
      await loadBlocks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete clip')
    }
  }

  const handleExportFile = async (): Promise<void> => {
    if (isExporting) return
    if (blocks.length === 0) {
      alert('No clips to export')
      return
    }

    setIsExporting(true)
    try {
      const effective = getEffectiveFormat(density, exportFormat)
      exportToFile(blocks, effective)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportClipboard = async (): Promise<void> => {
    if (isExporting) return
    if (blocks.length === 0) {
      alert('No clips to export')
      return
    }

    setIsExporting(true)
    try {
      const effective = getEffectiveFormat(density, exportFormat)
      await exportToClipboard(blocks, effective)
      alert(`Copied ${blocks.length} ${effective.toUpperCase()} clips to clipboard.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to copy export')
    } finally {
      setIsExporting(false)
    }
  }

  const onImportButtonClick = (): void => {
    if (isImporting) return

    const effective = getEffectiveFormat(density, importFormat)
    const accept = getImportAcceptByFormat(effective)
    importInputRef.current?.setAttribute('accept', accept)
    importInputRef.current?.click()
  }

  const handleImportResult = async (content: string): Promise<void> => {
    const effective = getEffectiveFormat(density, importFormat)
    const storageService = getStorageService()
    const result = await importFromText(content, effective, storageService)
    setImportReport({
      imported: result.imported,
      skipped: result.skipped,
      failed: result.failed,
      errors: result.errors,
    })
    await loadBlocks()
  }

  const handleImportFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    const sizeError = getImportFileSizeError(file.size)
    if (sizeError) {
      setImportReport({
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [sizeError],
      })
      return
    }

    setIsImporting(true)
    try {
      const content = await file.text()
      await handleImportResult(content)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Import failed'
      setImportReport({
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [message],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportClipboard = async (): Promise<void> => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const effective = getEffectiveFormat(density, importFormat)
      const storageService = getStorageService()
      const result = await importFromClipboard(effective, storageService)
      setImportReport({
        imported: result.imported,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors,
      })
      await loadBlocks()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Clipboard import failed'
      setImportReport({
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [message],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const renderList = (): JSX.Element => {
    if (isLoading) {
      return <div className="state-block">Loading clips...</div>
    }

    if (error) {
      return <div className="state-block state-error">{error}</div>
    }

    if (filteredBlocks.length === 0) {
      return <div className="state-block">No clips found.</div>
    }

    return (
      <div id="clips" className="clips-grid">
        {filteredBlocks.map((block) => (
          <article
            className="clip-card"
            key={block.id}
            onClick={() => {
              setSelectedBlock(block)
              setView('detail')
            }}
          >
            <div className="clip-header">
              <div className="clip-title">{getBlockTitle(block)}</div>
              <div className="clip-header-right">
                <div className="clip-time">{formatRelativeTime(block.createdAt)}</div>
                <button
                  className="delete-icon-button"
                  type="button"
                  title="Delete clip"
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleDelete(block)
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
    )
  }

  const selectedExportContent = selectedBlock
    ? {
        json: buildExportContent([selectedBlock], 'json'),
        markdown: buildExportContent([selectedBlock], 'markdown'),
      }
    : null

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

        <div className="flex">
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
                <select
                  className="format-select"
                  value={exportFormat}
                  onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              )}
              <button
                id="export-file"
                className="icon-button"
                type="button"
                aria-label="Export to file"
                onClick={() => void handleExportFile()}
                disabled={isExporting || blocks.length === 0}
              >
                <IconFileExport size={16} stroke={2} aria-hidden="true" />
              </button>
              <button
                id="export-clipboard"
                className="icon-button"
                type="button"
                aria-label="Copy to clipboard"
                onClick={() => void handleExportClipboard()}
                disabled={isExporting || blocks.length === 0}
              >
                <IconClipboardCopy size={16} stroke={2} aria-hidden="true" />
              </button>
            </section>

            <section className="transfer-group" aria-label="Import controls">
              <span className="transfer-label">Import</span>
              {density === 'standard' && (
                <select
                  className="format-select"
                  value={importFormat}
                  onChange={(event) => setImportFormat(event.target.value as ImportFormat)}
                >
                  <option value="json">JSON</option>
                  <option value="markdown">Markdown</option>
                </select>
              )}
              <button
                id="import-file"
                className="icon-button"
                type="button"
                aria-label="Import from file"
                onClick={onImportButtonClick}
                disabled={isImporting}
              >
                <IconFileImport size={16} stroke={2} aria-hidden="true" />
              </button>
              <button
                id="import-clipboard"
                className="icon-button"
                type="button"
                aria-label="Import from clipboard"
                onClick={() => void handleImportClipboard()}
                disabled={isImporting}
              >
                <IconClipboardPlus size={16} stroke={2} aria-hidden="true" />
              </button>
            </section>
          </div>
        </div>

        {density === 'standard' && (
          <div className="toolbar-hint">File and clipboard actions use the selected format.</div>
        )}

        <input
          ref={importInputRef}
          id="import-input"
          type="file"
          style={{ display: 'none' }}
          onChange={(event) => void handleImportFileChange(event)}
        />
      </header>

      <main>
        {importReport && (
          <div className="import-report" role="status">
            Imported: {importReport.imported} · Skipped: {importReport.skipped} · Failed:{' '}
            {importReport.failed}
            {importReport.errors.length > 0 && (
              <div className="state-error">{importReport.errors.slice(0, 2).join(' | ')}</div>
            )}
          </div>
        )}

        {view === 'list' && renderList()}

        {view === 'detail' && selectedBlock && (
          <div id="detail" className="detail active">
            <div className="detail-header">
              <button className="back-button" type="button" onClick={() => setView('list')}>
                ← Back to list
              </button>
            </div>
            <div className="detail-content">
              <h2>{getBlockTitle(selectedBlock)}</h2>
              <div className="detail-meta">
                <a href={selectedBlock.source.url} target="_blank" rel="noreferrer">
                  {selectedBlock.source.title}
                </a>
                <span>{new Date(selectedBlock.createdAt).toLocaleString()}</span>
              </div>
              <pre>{selectedBlock.content}</pre>
              <div className="detail-actions">
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => exportToFile([selectedBlock], 'json')}
                >
                  Export JSON
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return
                    void navigator.clipboard.writeText(selectedExportContent.json)
                  }}
                >
                  Copy JSON
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => exportToFile([selectedBlock], 'markdown')}
                >
                  Export Markdown
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return
                    void navigator.clipboard.writeText(selectedExportContent.markdown)
                  }}
                >
                  Copy Markdown
                </button>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => void handleDelete(selectedBlock)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/**
 * Options Page App (Refactored)
 * @description Options page using shared hooks and components
 */

import React, { type JSX, useState, useEffect, useMemo, useCallback, type ChangeEvent } from 'react'

import { IconTrash } from '@tabler/icons-react'

import type { Block } from '../../utils/block-model'
import { useNotification } from '../../hooks/useNotification'
import { useCrossPageSync } from '../../hooks/useCrossPageSync'
import { useI18n } from '../../hooks/useI18n'
import { SearchBar } from '../../components/search/SearchBar'
import { ImportControls } from '../../components/import-export/ImportControls'
import { ExportControls } from '../../components/import-export/ExportControls'
import { ToastContainer } from '../../components/ui/Toast'
import { formatRelativeTime, getContentPreview, getBlockTitle } from '../../utils/blockHelpers'
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
  importFromClipboard as importFromClipboardUtil,
  importFromText,
} from './transfer'

type View = 'list' | 'detail'

interface ImportReport {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

export default function App(): JSX.Element {
  const importInputRef = React.useRef<HTMLInputElement | null>(null)
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

  // Batch selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Shared hooks
  const { toasts, showToast } = useNotification()
  const { t } = useI18n()

  // Cross-page sync
  useCrossPageSync({
    onNewClip: () => {
      void loadBlocks()
    },
    onBlockUpdated: (block) => {
      setBlocks((prevBlocks) => prevBlocks.map((b) => (b.id === block.id ? block : b)))
      if (selectedBlock?.id === block.id) {
        setSelectedBlock(block)
      }
    },
    onBlockDeleted: (blockId) => {
      setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== blockId))
      if (selectedBlock?.id === blockId) {
        setSelectedBlock(null)
        setView('list')
      }
    },
    onBlocksReloaded: () => {
      void loadBlocks()
    },
    onImportCompleted: (count) => {
      // Just reload data, don't show toast (background will show notification)
      void loadBlocks()
    },
  })

  // Filter blocks client-side (Options page pattern)
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

  // Batch selection handlers
  const toggleSelection = (blockId: string): void => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(blockId)) {
        newSet.delete(blockId)
      } else {
        newSet.add(blockId)
      }
      return newSet
    })
  }

  const toggleSelectAll = (): void => {
    if (selectedIds.size === filteredBlocks.length) {
      // Deselect all
      setSelectedIds(new Set())
    } else {
      // Select all filtered blocks
      setSelectedIds(new Set(filteredBlocks.map((b) => b.id)))
    }
  }

  const exitSelectionMode = (): void => {
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const isAllSelected = filteredBlocks.length > 0 && selectedIds.size === filteredBlocks.length
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected

  const handleDelete = async (block: Block): Promise<void> => {
    if (!confirm(t('clips_deleteConfirm', [getBlockTitle(block)]))) {
      return
    }

    try {
      const storageService = getStorageService()
      await storageService.delete(block.id)

      // Broadcast deletion to other pages through background
      chrome.runtime
        .sendMessage({
          type: 'BLOCK_DELETED',
          data: { deletedBlockId: block.id },
        })
        .catch(() => {
          console.log('[Options] Failed to broadcast deletion')
        })

      showToast(t('clips_deleteSuccess'), 'success')
      setView('list')
      setSelectedBlock(null)
      await loadBlocks()
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('clips_deleteFailed'), 'error')
    }
  }

  const handleBatchDelete = async (): Promise<void> => {
    if (selectedIds.size === 0) return

    const count = selectedIds.size
    if (!confirm(t('options_batchDeleteConfirm', [count.toString()]))) {
      return
    }

    try {
      const storageService = getStorageService()

      // Delete all selected blocks
      for (const blockId of selectedIds) {
        await storageService.delete(blockId)

        // Broadcast each deletion to other pages
        chrome.runtime
          .sendMessage({
            type: 'BLOCK_DELETED',
            data: { deletedBlockId: blockId },
          })
          .catch(() => {
            console.log('[Options] Failed to broadcast deletion')
          })
      }

      showToast(t('options_batchDeleteSuccess', [count.toString()]), 'success')
      exitSelectionMode()
      await loadBlocks()
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('clips_deleteFailed'), 'error')
    }
  }

  const handleExportFile = async (): Promise<void> => {
    if (isExporting) return
    if (blocks.length === 0) {
      showToast(t('export_noClipsToExport'), 'info')
      return
    }

    setIsExporting(true)
    try {
      const effective = getEffectiveFormat(density, exportFormat)
      exportToFile(blocks, effective)
      showToast(t('export_exportSuccess', [blocks.length, effective.toUpperCase()]), 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('export_exportFailed'), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportClipboard = async (): Promise<void> => {
    if (isExporting) return
    if (blocks.length === 0) {
      showToast(t('export_noClipsToExport'), 'info')
      return
    }

    setIsExporting(true)
    try {
      const effective = getEffectiveFormat(density, exportFormat)
      await exportToClipboard(blocks, effective)
      showToast(t('export_copySuccess', [blocks.length, effective.toUpperCase()]), 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('export_copyFailed'), 'error')
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

    if (result.imported > 0) {
      // Broadcast import completion to other pages through background
      // Background will show system notification, and other pages will show their own toasts
      chrome.runtime
        .sendMessage({
          type: 'IMPORT_COMPLETED',
          data: { count: result.imported },
        })
        .catch(() => {
          console.log('[Options] Failed to broadcast import completion')
        })
    }

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
      showToast(sizeError, 'error')
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
      showToast(message, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  // Wrapper for ImportControls component that expects (file: File) => void
  const handleImportFile = (file: File) => {
    const sizeError = getImportFileSizeError(file.size)
    if (sizeError) {
      setImportReport({
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [sizeError],
      })
      showToast(sizeError, 'error')
      return
    }

    setIsImporting(true)
    void (async () => {
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
        showToast(message, 'error')
      } finally {
        setIsImporting(false)
      }
    })()
  }

  const handleImportClipboard = async (): Promise<void> => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const effective = getEffectiveFormat(density, importFormat)
      const storageService = getStorageService()
      const result = await importFromClipboardUtil(effective, storageService)
      setImportReport({
        imported: result.imported,
        skipped: result.skipped,
        failed: result.failed,
        errors: result.errors,
      })

      if (result.imported > 0) {
        // Broadcast import completion to other pages through background
        // Background will show system notification, and other pages will show their own toasts
        chrome.runtime
          .sendMessage({
            type: 'IMPORT_COMPLETED',
            data: { count: result.imported },
          })
          .catch(() => {
            console.log('[Options] Failed to broadcast import completion')
          })
      }

      await loadBlocks()
    } catch (e) {
      const message = e instanceof Error ? e.message : t('import_clipboardImportFailed')
      setImportReport({
        imported: 0,
        skipped: 0,
        failed: 1,
        errors: [message],
      })
      showToast(message, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const renderList = (): JSX.Element => {
    if (isLoading) {
      return <div className="state-block">{t('common_loadingClips')}</div>
    }

    if (error) {
      return <div className="state-block state-error">{error}</div>
    }

    if (filteredBlocks.length === 0) {
      return <div className="state-block">{t('common_noClipsFound')}</div>
    }

    return (
      <>
        {/* Batch selection toolbar */}
        {isSelectionMode && (
          <div className="batch-selection-toolbar">
            <div className="batch-selection-left">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = isSomeSelected
                  }
                }}
                onChange={toggleSelectAll}
                className="batch-checkbox"
              />
              <span className="batch-selection-count">
                {selectedIds.size > 0
                  ? `${selectedIds.size} ${t('options_selectedCount')}`
                  : t('options_selectAll')}
              </span>
            </div>
            <div className="batch-selection-right">
              {selectedIds.size > 0 && (
                <button
                  className="batch-delete-button"
                  type="button"
                  onClick={() => void handleBatchDelete()}
                >
                  🗑️ {t('options_deleteSelected')}
                </button>
              )}
              <button className="batch-cancel-button" type="button" onClick={exitSelectionMode}>
                {t('common_cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Normal toolbar when not in selection mode */}
        {!isSelectionMode && (
          <div className="normal-toolbar">
            <button
              className="batch-select-button"
              type="button"
              onClick={() => setIsSelectionMode(true)}
            >
              ☑️ {t('options_batchSelect')}
            </button>
          </div>
        )}

        <div id="clips" className={`clips-grid ${isSelectionMode ? 'selection-mode' : ''}`}>
          {filteredBlocks.map((block) => {
            const isSelected = selectedIds.has(block.id)
            return (
              <article
                className={`clip-card ${isSelected ? 'selected' : ''} ${isSelectionMode ? 'selection-mode' : ''}`}
                key={block.id}
                onClick={() => {
                  if (!isSelectionMode) {
                    setSelectedBlock(block)
                    setView('detail')
                  }
                }}
              >
                <div className="clip-header">
                  <div className="clip-header-left">
                    {isSelectionMode && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(block.id)}
                        className="clip-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="clip-title">{getBlockTitle(block)}</div>
                  </div>
                  <div className="clip-header-right">
                    <div className="clip-time">{formatRelativeTime(block.createdAt)}</div>
                    {!isSelectionMode && (
                      <button
                        className="delete-icon-button"
                        type="button"
                        title={t('common_delete')}
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleDelete(block)
                        }}
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="clip-preview">{getContentPreview(block.content)}</div>
                <div className="clip-source">{block.source.title}</div>
              </article>
            )
          })}
        </div>
      </>
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
          <h1>📋 {t('extensionName')}</h1>
          <button
            id="density-toggle"
            className="density-toggle"
            type="button"
            onClick={() => setDensity((prev) => (prev === 'standard' ? 'compact' : 'standard'))}
          >
            {density === 'standard' ? t('common_compact') : t('common_standard')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            placeholder={t('search_placeholder')}
          />

          <div className="toolbar-grid">
            <ExportControls
              isExporting={isExporting}
              exportFormat={exportFormat}
              density={density === 'compact' ? 'compact' : 'standard'}
              onExportFormatChange={setExportFormat}
              onExportFile={handleExportFile}
              onExportClipboard={handleExportClipboard}
            />

            <ImportControls
              isImporting={isImporting}
              importFormat={importFormat}
              density={density === 'compact' ? 'compact' : 'standard'}
              onImportFormatChange={setImportFormat}
              onImportFile={handleImportFile}
              onImportClipboard={handleImportClipboard}
              disabled={isImporting}
            />
          </div>
        </div>

        {density === 'standard' && (
          <div className="toolbar-hint">{t('sidepanel_transferHint')}</div>
        )}

        <input
          ref={importInputRef as React.RefObject<HTMLInputElement>}
          id="import-input"
          type="file"
          style={{ display: 'none' }}
          onChange={(event) => void handleImportFileChange(event)}
        />
      </header>

      <main>
        {importReport && (
          <div className="import-report" role="status">
            {t('import_importReport', [
              importReport.imported,
              importReport.skipped,
              importReport.failed,
            ])}
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
                {t('common_backToList')}
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
                  {t('export_exportJson')}
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return
                    void navigator.clipboard.writeText(selectedExportContent.json)
                  }}
                >
                  {t('export_copyJson')}
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => exportToFile([selectedBlock], 'markdown')}
                >
                  {t('export_exportMarkdown')}
                </button>
                <button
                  className="export-single-button"
                  type="button"
                  onClick={() => {
                    if (!selectedExportContent) return
                    void navigator.clipboard.writeText(selectedExportContent.markdown)
                  }}
                >
                  {t('export_copyMarkdown')}
                </button>
                <button
                  className="delete-button flex items-center gap-1"
                  type="button"
                  onClick={() => void handleDelete(selectedBlock)}
                >
                  {t('common_delete')}
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

/**
 * Sidebar App Root Component (Refactored)
 * @description Main entry point for the Block Clipper sidebar UI - using shared hooks and components
 */

import { type JSX, useState, useEffect, useCallback } from 'react'
import { getStorageService } from '../../utils/storage'
import type { Block } from '../../utils/block-model'
import { useBlocks } from '../../hooks/useBlocks'
import { useSearch } from '../../hooks/useSearch'
import { useNotification } from '../../hooks/useNotification'
import { useImportExport } from '../../hooks/useImportExport'
import { useAI } from '../../hooks/useAI'
import { useCrossPageSync } from '../../hooks/useCrossPageSync'
import { useI18n } from '../../hooks/useI18n'
import { ClipsList } from '../../components/clips/ClipsList'
import { DetailView } from '../../components/clips/DetailView'
import { SearchBar } from '../../components/search/SearchBar'
import { ImportControls } from '../../components/import-export/ImportControls'
import { ExportControls } from '../../components/import-export/ExportControls'
import { ToastContainer } from '../../components/ui/Toast'
import { LoadingState } from '../../components/ui/LoadingSpinner'
import './index.css'

/**
 * View types for routing
 */
type ViewType = 'list' | 'detail' | 'empty'

/**
 * Sidebar App Component (Refactored)
 */
export default function App(): JSX.Element {
  // Shared hooks
  const {
    blocks,
    isLoading: isLoadingBlocks,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    reloadBlocks,
    deleteBlock,
    updateLocalBlock,
    setBlocks,
  } = useBlocks({ limit: 50 })

  const {
    searchQuery,
    isSearching,
    isComposing,
    searchResults,
    isSearchMode,
    setSearchQuery,
    handleCompositionStart,
    handleCompositionEnd,
  } = useSearch(
    (results, mode) => {
      setBlocks(results)
    },
    { limit: 50 },
  )

  const { toasts, showToast, clearToasts } = useNotification()
  const { t } = useI18n()

  const {
    isImporting,
    isExporting,
    exportFormat,
    importFormat,
    lastImportReport,
    setExportFormat,
    setImportFormat,
    exportToFile,
    exportToClipboard,
    importFromFile,
    importFromClipboard: importFromClipboardHook,
    getImportAcceptByFormat,
  } = useImportExport(showToast, {
    onImportComplete: (count) => {
      void reloadBlocks()
    },
  })

  const { aiAvailable, isGenerating, regenerateTitle } = useAI()

  // Local state
  const [currentView, setCurrentView] = useState<ViewType>('empty')
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [density, setDensity] = useState<'standard' | 'compact'>('standard')
  const [storageQuotaWarning, setStorageQuotaWarning] = useState(false)

  // Update view based on blocks
  useEffect(() => {
    if (blocks.length > 0) {
      setCurrentView('list')
    } else if (!isLoadingBlocks) {
      setCurrentView('empty')
    }
  }, [blocks.length, isLoadingBlocks])

  // Cross-page sync
  useCrossPageSync({
    onNewClip: () => {
      showToast(t('clips_newClipAdded'), 'success')
      void reloadBlocks()
    },
    onBlockUpdated: (block) => {
      updateLocalBlock(block)
      if (selectedBlock?.id === block.id) {
        setSelectedBlock(block)
      }
    },
    onBlockDeleted: (blockId) => {
      // Remove from local state
      setBlocks((prev) => prev.filter((block) => block.id !== blockId))
      // If the deleted block is currently selected, close detail view
      if (selectedBlock?.id === blockId) {
        closeDetailView()
      }
    },
    onBlocksReloaded: () => {
      void reloadBlocks()
    },
    onImportCompleted: (count) => {
      console.log('[Panel] onImportCompleted called with count:', count)
      showToast(t('import_importSuccess', [count]), 'success')
      void reloadBlocks()
    },
  })

  // Check storage quota
  useEffect(() => {
    const checkQuota = async () => {
      try {
        const storageService = getStorageService()
        const usage = await storageService.getUsage()

        if (usage.quota > 0) {
          const usagePercent = usage.bytes / usage.quota
          setStorageQuotaWarning(usagePercent > 0.8)
        }
      } catch (error) {
        console.error('[Sidebar App] Failed to check storage quota:', error)
      }
    }

    void checkQuota()
    const interval = setInterval(checkQuota, 30000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Navigate to detail view
   */
  const openDetailView = useCallback((block: Block, index: number) => {
    setSelectedBlock(block)
    setSelectedIndex(-1)
    setCurrentView('detail')
  }, [])

  /**
   * Navigate back to list view
   */
  const closeDetailView = useCallback(() => {
    setSelectedBlock(null)
    setSelectedIndex(-1)
    setCurrentView('list')
  }, [])

  /**
   * Handle delete
   */
  const handleDelete = useCallback(
    async (blockId: string) => {
      try {
        await deleteBlock(blockId)
        showToast(t('clips_deleteSuccess'), 'success')
        closeDetailView()
      } catch (error) {
        showToast(t('clips_deleteFailed'), 'error')
      }
    },
    [deleteBlock, showToast, closeDetailView, t],
  )

  /**
   * Handle AI title regeneration
   */
  const handleRegenerateTitle = useCallback(async () => {
    if (!selectedBlock || !aiAvailable) {
      return
    }

    try {
      await regenerateTitle(selectedBlock, (updatedBlock) => {
        setSelectedBlock(updatedBlock)
        updateLocalBlock(updatedBlock)
      })
      showToast(t('clips_regenerateTitle'), 'success')
    } catch (error) {
      showToast(t('clips_regenerateTitle'), 'error')
    }
  }, [selectedBlock, aiAvailable, regenerateTitle, updateLocalBlock, showToast, t])

  /**
   * Handle clipboard import
   */
  const handleImportClipboard = useCallback(() => {
    void importFromClipboardHook(importFormat)
  }, [importFromClipboardHook, importFormat])

  /**
   * Handle file import
   */
  const handleImportFile = useCallback(
    (file: File) => {
      void importFromFile(file)
    },
    [importFromFile],
  )

  // Render loading state
  if (isLoadingBlocks) {
    return (
      <div className="sidebar-container">
        <LoadingState message={t('common_loadingClips')} />
      </div>
    )
  }

  // Render empty state
  if (currentView === 'empty') {
    return (
      <div className="sidebar-container">
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>{t('sidepanel_noClipsYet')}</h2>
          <p>{t('sidepanel_noClipsHint')}</p>
          <div className="shortcut-hint">
            <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Y</kbd>
          </div>
        </div>
      </div>
    )
  }

  // Render list view
  if (currentView === 'list') {
    return (
      <div className={`sidebar-container density-${density}`}>
        {/* Header */}
        <header className="sidebar-header">
          <div className="header-title-row">
            <h1>{t('extensionName')}</h1>
            <div className="header-meta">
              <div className="block-count">
                {isSearchMode
                  ? `${blocks.length} ${t('search_results')}`
                  : `${blocks.length}${hasMore ? '+' : ''} ${t('clips_count')}`}
              </div>
              {/* <button
                className="density-toggle-button"
                type="button"
                onClick={() => setDensity(density === 'standard' ? 'compact' : 'standard')}
                aria-label={t('aria_switchLayout', [
                  density === 'standard' ? t('common_compact') : t('common_standard'),
                ])}
              >
                {density === 'standard' ? t('common_compact') : t('common_standard')}
              </button> */}
            </div>
          </div>

          {/* Import/Export Controls */}
          {/* <div className="transfer-grid">
            <ExportControls
              isExporting={isExporting}
              exportFormat={exportFormat}
              density={density}
              onExportFormatChange={setExportFormat}
              onExportFile={exportToFile}
              onExportClipboard={exportToClipboard}
            />
            <ImportControls
              isImporting={isImporting}
              importFormat={importFormat}
              density={density}
              onImportFormatChange={setImportFormat}
              onImportFile={handleImportFile}
              onImportClipboard={handleImportClipboard}
            />
          </div> */}

          {/* {density === 'standard' && (
            <div className="transfer-hint">{t('sidepanel_transferHint')}</div>
          )} */}

          {/* Import Report */}
          {lastImportReport && (
            <div className="import-report" role="status" aria-live="polite">
              <div className="import-summary">
                {t('import_importReport', [
                  lastImportReport.imported,
                  lastImportReport.skipped,
                  lastImportReport.failed,
                ])}
              </div>
              {lastImportReport.errors.length > 0 && (
                <ul className="import-errors">
                  {lastImportReport.errors.slice(0, 3).map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>

        {/* Storage Quota Warning */}
        {storageQuotaWarning && (
          <div className="quota-warning">{t('sidepanel_storageQuotaWarning')}</div>
        )}

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
          isSearching={isSearching}
          isComposing={isComposing}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />

        {/* Clips List */}
        <ClipsList
          blocks={blocks}
          selectedIndex={selectedIndex}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          isSearchMode={isSearchMode}
          density={density}
          onBlockClick={openDetailView}
          onLoadMore={loadMore}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />
      </div>
    )
  }

  // Render detail view
  if (currentView === 'detail' && selectedBlock) {
    return (
      <div className="sidebar-container">
        <DetailView
          block={selectedBlock}
          aiAvailable={aiAvailable}
          isRegeneratingTitle={isGenerating}
          onBack={closeDetailView}
          onDelete={() => void handleDelete(selectedBlock.id)}
          onRegenerateTitle={handleRegenerateTitle}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} />
      </div>
    )
  }

  return (
    <div className="sidebar-container">
      <div className="error-state">Error: Unknown state</div>
    </div>
  )
}

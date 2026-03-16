/**
 * Popup App Component (Refactored)
 * @description Quick access to Block Clipper features - optimized for fast load
 */

import { type JSX, useState, useEffect, useCallback, useTransition } from 'react'
import { getStorageService } from '../../utils/storage'
import type { Block } from '../../utils/block-model'
import { useNotification } from '../../hooks/useNotification'
import { useCrossPageSync } from '../../hooks/useCrossPageSync'
import { useI18n } from '../../hooks/useI18n'
import { LoadingState } from '../../components/ui/LoadingSpinner'
import { ToastContainer } from '../../components/ui/Toast'
import { formatRelativeTime, getContentPreview, getBlockTitle } from '../../utils/blockHelpers'
import { requestVisualSelectorStart } from './visualSelector'
import './App.css'

function App(): JSX.Element {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [clipCount, setClipCount] = useState(0)
  const [isSavingPage, setIsSavingPage] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Shared hooks
  const { toasts, showToast } = useNotification()
  const { t } = useI18n()

  // Cross-page sync - update clip count when new clips are added
  useCrossPageSync({
    onNewClip: () => {
      // Defer data reload for performance
      startTransition(() => {
        void loadData()
      })
    },
    onBlockDeleted: () => {
      // Reload data when a block is deleted
      startTransition(() => {
        void loadData()
      })
    },
    onImportCompleted: (count) => {
      showToast(t('import_importSuccess', [count]), 'success')
      startTransition(() => {
        void loadData()
      })
    },
  })

  // Deferred data loading for performance
  const loadData = useCallback(async () => {
    try {
      const storageService = getStorageService()
      await storageService.initialize()

      // Get recent blocks
      const result = await storageService.query({ page: 1, limit: 5 })
      setBlocks(result.items)
      setClipCount(result.total)
    } catch (error) {
      console.error('[Popup] Failed to load blocks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data after initial render (deferred for performance)
  useEffect(() => {
    // Use setTimeout to defer loading, allowing popup to render immediately
    const timer = setTimeout(() => {
      void loadData()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadData])

  /**
   * Open extension options page
   */
  const openOptionsPage = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  /**
   * Open side panel and close popup
   */
  const openSidePanel = useCallback(async () => {
    try {
      if (chrome.sidePanel) {
        const chromeWindow = await chrome.windows.getCurrent()
        if (chromeWindow.id === undefined) {
          throw new Error('No active browser window found')
        }

        await chrome.sidePanel.open({ windowId: chromeWindow.id })
        window.close()
      }
    } catch (error) {
      console.error('[Popup] Failed to open side panel:', error)
    }
  }, [])

  /**
   * Start visual selector mode on active tab
   */
  const startVisualSelector = useCallback(async () => {
    try {
      const result = await requestVisualSelectorStart(chrome.runtime.sendMessage)
      if (result.ok) {
        window.close()
        return
      }

      showToast(result.error || t('popup_visualSelectTool'), 'error')
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('background_clipFailedMessage'), 'error')
    }
  }, [showToast])

  /**
   * Save current page content
   */
  const savePage = useCallback(async () => {
    if (isSavingPage) return

    setIsSavingPage(true)
    try {
      // Send SAVE_PAGE message to background
      await chrome.runtime.sendMessage({ type: 'SAVE_PAGE' })
      // Close popup after sending message
      window.close()
    } catch (error) {
      console.error('[Popup] Failed to save page:', error)
      showToast(error instanceof Error ? error.message : t('background_savePageFailed'), 'error')
      setIsSavingPage(false)
    }
  }, [isSavingPage, showToast, t])

  /**
   * Open documentation/help
   */
  const openDocumentation = useCallback(() => {
    chrome.tabs.create({
      url: 'https://github.com/zh-impact/block-clipper#readme',
    })
    window.close()
  }, [])

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo-section">
          <span className="logo">📋</span>
          <h1>{t('extensionName')}</h1>
        </div>
        <div className="clip-count">
          {clipCount} {t('popup_clipCount')}
        </div>
      </header>

      <div className="quick-action-row">
        <button onClick={() => void startVisualSelector()} className="visual-selector-button">
          {t('popup_visualSelectTool')}
        </button>
        <button
          onClick={() => void savePage()}
          disabled={isSavingPage}
          className="save-page-button"
          aria-label={t('popup_savePage')}
        >
          {isSavingPage ? t('popup_savePageSaving') : `📄 ${t('popup_savePage')}`}
        </button>
      </div>

      {isLoading ? (
        <LoadingState message="" size="small" />
      ) : blocks.length === 0 ? (
        <div className="empty-state">
          <p>{t('popup_noClipsYet')}</p>
          <div className="hint">
            {t('popup_howToClipStep1')}
            <br />
            <kbd>Ctrl+Shift+Y</kbd>
          </div>
        </div>
      ) : (
        <>
          <div className="recent-clips">
            <div className="section-title">{t('popup_recentClips')}</div>
            {blocks.slice(0, 3).map((block) => (
              <div key={block.id} className="clip-item">
                <div className="clip-title">{getBlockTitle(block)}</div>
                <div className="clip-preview">{getContentPreview(block.content)}</div>
                <div className="clip-meta">
                  <span className="clip-time">{formatRelativeTime(block.createdAt)}</span>
                  <span className="clip-source">{block.source.title}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="view-all-section">
        <div className="button-row">
          <button onClick={openOptionsPage} className="view-all-button secondary">
            📋 {t('popup_optionsButton')}
          </button>
          <button onClick={openSidePanel} className="view-all-button primary">
            🔲 {t('popup_sidePanelButton')}
          </button>
        </div>
      </div>

      <div className="help-section">
        <div className="help-title">{t('popup_howToClip')}</div>
        <ol className="help-list">
          <li>{t('popup_howToClipStep1')}</li>
          <li>{t('popup_howToClipStep2')}</li>
          <li>{t('popup_howToClipStep3')}</li>
        </ol>
        <button onClick={openDocumentation} className="help-link">
          📖 {t('popup_documentationHelp')}
        </button>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  )
}

export default App

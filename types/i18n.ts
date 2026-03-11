/**
 * i18n Type Definitions
 * @description Type-safe i18n keys for Block Clipper
 */

/**
 * All i18n message keys organized by namespace
 * Based on Chrome Extension i18n API - keys use underscores, not dots
 */
export type I18nKey =
  // Extension metadata
  | 'extensionName'
  | 'extensionDescription'

  // Popup
  | 'popup_clipCount'
  | 'popup_visualSelectTool'
  | 'popup_noClipsYet'
  | 'popup_recentClips'
  | 'popup_optionsButton'
  | 'popup_sidePanelButton'
  | 'popup_howToClip'
  | 'popup_howToClipStep1'
  | 'popup_howToClipStep2'
  | 'popup_howToClipStep3'
  | 'popup_documentationHelp'

  // Common
  | 'common_loading'
  | 'common_loadingClips'
  | 'common_noClipsFound'
  | 'common_delete'
  | 'common_deleteButton'
  | 'common_back'
  | 'common_backToList'
  | 'common_compact'
  | 'common_standard'
  | 'common_json'
  | 'common_markdown'
  | 'common_export'
  | 'common_import'
  | 'common_cancel'

  // Search
  | 'search_placeholder'
  | 'search_searching'
  | 'search_clearSearch'
  | 'search_searchDescription'
  | 'search_results'

  // Clips
  | 'clips_count'
  | 'clips_deleteConfirm'
  | 'clips_deleteSuccess'
  | 'clips_deleteFailed'
  | 'clips_aiGenerated'
  | 'clips_regenerateTitle'
  | 'clips_regenerating'
  | 'clips_newClipAdded'

  // Export
  | 'export_noClipsToExport'
  | 'export_exportSuccess'
  | 'export_exportToClipboard'
  | 'export_exportToFile'
  | 'export_copySuccess'
  | 'export_copyFailed'
  | 'export_exportFailed'
  | 'export_exportJson'
  | 'export_copyJson'
  | 'export_exportMarkdown'
  | 'export_copyMarkdown'

  // Import
  | 'import_importSuccess'
  | 'import_importSuccessMessage'
  | 'import_clipboardImportFailed'
  | 'import_importFailed'
  | 'import_importFromFile'
  | 'import_importFromClipboard'
  | 'import_importReport'

  // Sidepanel
  | 'sidepanel_noClipsYet'
  | 'sidepanel_noClipsHint'
  | 'sidepanel_shortcutHint'
  | 'sidepanel_transferHint'
  | 'sidepanel_storageQuotaWarning'

  // Options page
  | 'options_batchSelect'
  | 'options_selectAll'
  | 'options_selectedCount'
  | 'options_deleteSelected'
  | 'options_batchDeleteConfirm'
  | 'options_batchDeleteSuccess'

  // Background
  | 'background_storageQuotaWarningTitle'
  | 'background_storageQuotaWarningMessage'
  | 'background_clipSuccess'
  | 'background_clipSuccessMessage'
  | 'background_clipFailed'
  | 'background_clipFailedMessage'
  | 'background_extensionInstalled'
  | 'background_extensionInstalledMessage'
  | 'background_contextMenuTitle'

  // Detail view
  | 'detail_sourceLink'
  | 'detail_clipped'
  | 'detail_ariaLabelBack'
  | 'detail_ariaLabelDelete'
  | 'detail_ariaLabelRegenerate'
  | 'detail_ariaLabelAiGenerated'

  // Aria labels
  | 'aria_switchLayout'
  | 'aria_importControls'
  | 'aria_exportControls'
  | 'aria_importFormat'
  | 'aria_exportFormat'

  // Time
  | 'time_justNow'
  | 'time_minutesAgo'
  | 'time_hoursAgo'
  | 'time_daysAgo'

  // Content script
  | 'content_noContentSelected'
  | 'content_pleaseSelectText'
  | 'content_processingLargeContent'
  | 'content_largeContentWarning'
  | 'content_queued'
  | 'content_queuedMessage'
  | 'content_visualSelectorHint'
  | 'content_visualSelectorCanceled'
  | 'content_selectorModeClosed'
  | 'content_confirmCapture'
  | 'content_noVisibleText'
  | 'content_cancel'
  | 'content_confirmSave'
  | 'content_noTextToCapture'
  | 'content_noTextInArea'
  | 'content_visualSelectionSaved'
  | 'content_noAreaSelected'
  | 'content_moveToSelect'
  | 'content_tooManyRequests'
  | 'content_visualSelectionFailed'

  // Allow dynamic keys for runtime usage
  | string;

/**
 * Substitutions type for Chrome Extension i18n
 * Chrome uses positional placeholders ($1, $2, etc.)
 */
export type I18nSubstitutions = string | number | (string | number)[];

/**
 * Named substitutions for easier usage (will be converted to array)
 */
export type I18nNamedSubstitutions = Record<string, string | number>;

/**
 * Options for getMessage function
 */
export interface GetMessageOptions {
  substitutions?: I18nSubstitutions;
}

/**
 * Get translated message by key
 * @param key - The i18n message key
 * @param substitutions - Optional substitution values (positional or array)
 * @returns The translated message
 */
export function getMessage(key: I18nKey, substitutions?: I18nSubstitutions): string {
  return chrome.i18n.getMessage(key, substitutions as string | (string | number)[] | undefined) || key;
}

/**
 * Hook result for useI18n
 */
export interface UseI18nResult {
  t: (key: I18nKey, substitutions?: I18nSubstitutions) => string;
  getLocale: () => string;
}
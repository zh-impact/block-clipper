/**
 * DetailView Component
 * @description Display full content of a clip with metadata and actions
 */

import { type JSX } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { useI18n } from "../../hooks/useI18n";
import { getBlockTitle, formatLocaleDate } from "../../utils/blockHelpers";
import type { Block } from "../../utils/block-model";

export interface DetailViewProps {
  block: Block;
  aiAvailable?: boolean;
  isRegeneratingTitle?: boolean;
  onBack?: () => void;
  onDelete?: () => void;
  onRegenerateTitle?: () => void;
}

/**
 * DetailView Component
 */
export function DetailView({
  block,
  aiAvailable = false,
  isRegeneratingTitle = false,
  onBack,
  onDelete,
  onRegenerateTitle,
}: DetailViewProps): JSX.Element {
  const title = getBlockTitle(block);
  const { t } = useI18n();

  return (
    <div className="sidebar-container">
      {/* Detail Header */}
      <header className="detail-header">
        {onBack && (
          <button
            onClick={onBack}
            className="back-button"
            aria-label={t('detail_ariaLabelBack')}
          >
            {t('common_back')}
          </button>
        )}
        <div className="detail-header-actions">
          {/* AI Title Regenerate Button */}
          {aiAvailable && onRegenerateTitle && (
            <button
              onClick={onRegenerateTitle}
              disabled={isRegeneratingTitle}
              className="regenerate-button"
              aria-label={t('detail_ariaLabelRegenerate')}
              title={t('detail_ariaLabelRegenerate')}
            >
              <IconRefresh size={16} stroke={2} aria-hidden="true" />
              {isRegeneratingTitle
                ? ` ${t('clips_regenerating')}`
                : ` ${t('clips_regenerateTitle')}`}
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="delete-button"
              aria-label={t('detail_ariaLabelDelete')}
            >
              🗑️ {t('common_delete')}
            </button>
          )}
        </div>
      </header>

      {/* Detail Content */}
      <div className="detail-content">
        {/* Title Display */}
        <div className="detail-title-section">
          {/* AI Generated Indicator */}
          {block.aiGenerated && (
            <div
              className="ai-indicator-inline"
              role="status"
              aria-label={t('detail_ariaLabelAiGenerated')}
            >
              {t('clips_aiGenerated')}
            </div>
          )}
          <h1 className="detail-title">{title}</h1>
        </div>

        {/* Metadata */}
        <div className="detail-metadata">
          <a
            href={block.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
          >
            <span className="source-favicon">
              {block.source.favicon ? (
                <img src={block.source.favicon} alt="" />
              ) : (
                <span>📄</span>
              )}
            </span>
            <span>{block.source.title}</span>
          </a>
          <span className="detail-time">
            {new Date(block.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Markdown Content */}
        <div className="markdown-content">
          <pre>{block.content}</pre>
        </div>
      </div>
    </div>
  );
}

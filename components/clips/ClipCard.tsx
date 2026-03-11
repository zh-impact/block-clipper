/**
 * ClipCard Component
 * @description Display a single clip in the list with title, preview, and metadata
 */

import { type JSX } from "react";
import { useI18n } from "../../hooks/useI18n";
import { formatRelativeTime, getContentPreview, getBlockTitle } from "../../utils/blockHelpers";
import type { Block } from "../../utils/block-model";

export interface ClipCardProps {
  block: Block;
  isSelected?: boolean;
  selectedIndex?: number;
  onClick?: () => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  density?: "standard" | "compact";
}

/**
 * ClipCard Component
 */
export function ClipCard({
  block,
  isSelected = false,
  onClick,
  onKeyPress,
  density = "standard",
}: ClipCardProps): JSX.Element {
  const title = getBlockTitle(block);
  const preview = getContentPreview(block.content);
  const relativeTime = formatRelativeTime(block.createdAt);
  const { t } = useI18n();

  return (
    <div
      onClick={onClick}
      onKeyPress={onKeyPress}
      className={`block-card ${isSelected ? "selected" : ""} density-${density}`}
      role="listitem"
      tabIndex={0}
      aria-label={`${title}, ${t('detail_clipped')} ${relativeTime} from ${block.source.title}`}
      aria-selected={isSelected}
    >
      <div className="block-header">
        <h3 className="block-title">{title}</h3>
        <span
          className="block-time"
          aria-label={`${t('detail_clipped')} ${relativeTime}`}
        >
          {relativeTime}
        </span>
      </div>
      <p className="block-preview">{preview}</p>
      <div className="block-source">
        <span className="source-favicon" aria-hidden="true">
          {block.source.favicon ? (
            <img src={block.source.favicon} alt="" />
          ) : (
            <span>📄</span>
          )}
        </span>
        <span
          className="source-title"
          aria-label={`${t('detail_sourceLink')} ${block.source.title}`}
        >
          {block.source.title}
        </span>
      </div>
    </div>
  );
}

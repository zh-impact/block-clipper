/**
 * DetailHeader Component
 * @description Header component for detail view with back button and actions
 */

import { type JSX } from "react";
import { IconRefresh } from "@tabler/icons-react";

export interface DetailHeaderProps {
  onBack?: () => void;
  onDelete?: () => void;
  onRegenerateTitle?: () => void;
  aiAvailable?: boolean;
  isRegeneratingTitle?: boolean;
  backLabel?: string;
  showBackButton?: boolean;
}

/**
 * DetailHeader Component
 */
export function DetailHeader({
  onBack,
  onDelete,
  onRegenerateTitle,
  aiAvailable = false,
  isRegeneratingTitle = false,
  backLabel = "← Back",
  showBackButton = true,
}: DetailHeaderProps): JSX.Element {
  return (
    <header className="detail-header">
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="back-button"
          aria-label="Back to list"
        >
          {backLabel}
        </button>
      )}
      <div className="detail-header-actions">
        {/* AI Title Regenerate Button */}
        {aiAvailable && onRegenerateTitle && (
          <button
            onClick={onRegenerateTitle}
            disabled={isRegeneratingTitle}
            className="regenerate-button"
            aria-label="Regenerate AI title"
            title="Regenerate AI title"
          >
            <IconRefresh size={16} stroke={2} aria-hidden="true" />
            {isRegeneratingTitle
              ? " Generating..."
              : " Regenerate Title"}
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="delete-button"
            aria-label="Delete clip"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </header>
  );
}

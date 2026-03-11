/**
 * ImportControls Component
 * @description Import controls for file and clipboard import with format selection
 */

import { type JSX, useRef } from "react";
import { IconFileImport, IconClipboardPlus } from "@tabler/icons-react";
import { useI18n } from "../../hooks/useI18n";
import type { ImportFormat } from "../../utils/importer";

export interface ImportControlsProps {
  isImporting?: boolean;
  importFormat?: ImportFormat;
  density?: "standard" | "compact";
  onImportFormatChange?: (format: ImportFormat) => void;
  onImportFile?: (file: File) => void;
  onImportClipboard?: () => void;
  disabled?: boolean;
}

/**
 * Get accept attribute for file input
 */
function getImportAcceptByFormat(format: ImportFormat): string {
  if (format === "markdown") {
    return "text/markdown,.md,.markdown,text/plain";
  }

  return "application/json,.json";
}

/**
 * ImportControls Component
 */
export function ImportControls({
  isImporting = false,
  importFormat = "json",
  density = "standard",
  onImportFormatChange,
  onImportFile,
  onImportClipboard,
  disabled = false,
}: ImportControlsProps): JSX.Element {
  const { t } = useI18n();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportClick = () => {
    if (isImporting || disabled) {
      return;
    }

    importInputRef.current?.setAttribute("accept", getImportAcceptByFormat(importFormat));
    importInputRef.current?.click();
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !onImportFile) {
      return;
    }

    event.currentTarget.value = "";
    void onImportFile(file);
  };

  const formatLabel = density === "compact" ? "JSON" : importFormat.toUpperCase();

  return (
    <section className="transfer-group" aria-label={t('aria_importControls')}>
      <div className="transfer-group-label">{t('common_import')}</div>
      {density === "standard" && onImportFormatChange && (
        <select
          className="format-select"
          value={importFormat}
          onChange={(event) => {
            const nextFormat = event.target.value as ImportFormat;
            onImportFormatChange(nextFormat);
          }}
          aria-label={t('aria_importFormat')}
          disabled={isImporting || disabled}
        >
          <option value="json">{t('common_json')}</option>
          <option value="markdown">{t('common_markdown')}</option>
        </select>
      )}
      <button
        onClick={handleImportClick}
        className="icon-action-button"
        disabled={isImporting || disabled}
        type="button"
        aria-label={t('import_importFromFile', [formatLabel])}
        title={t('import_importFromFile', [formatLabel])}
      >
        <IconFileImport size={16} stroke={2} aria-hidden="true" />
      </button>
      {onImportClipboard && (
        <button
          onClick={onImportClipboard}
          className="icon-action-button"
          disabled={isImporting || disabled}
          type="button"
          aria-label={t('import_importFromClipboard', [formatLabel])}
          title={t('import_importFromClipboard', [formatLabel])}
        >
          <IconClipboardPlus size={16} stroke={2} aria-hidden="true" />
        </button>
      )}
      <input
        ref={importInputRef}
        type="file"
        accept={getImportAcceptByFormat(importFormat)}
        style={{ display: "none" }}
        onChange={handleImportFileChange}
      />
    </section>
  );
}

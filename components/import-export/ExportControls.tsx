/**
 * ExportControls Component
 * @description Export controls for file and clipboard export with format selection
 */

import { type JSX } from "react";
import { IconFileExport, IconClipboardCopy } from "@tabler/icons-react";
import { useI18n } from "../../hooks/useI18n";
import type { ExportFormat } from "../../utils/exporter";

export interface ExportControlsProps {
  isExporting?: boolean;
  exportFormat?: ExportFormat;
  density?: "standard" | "compact";
  onExportFormatChange?: (format: ExportFormat) => void;
  onExportFile?: (format?: ExportFormat) => void;
  onExportClipboard?: (format?: ExportFormat) => void;
  disabled?: boolean;
}

/**
 * ExportControls Component
 */
export function ExportControls({
  isExporting = false,
  exportFormat = "json",
  density = "standard",
  onExportFormatChange,
  onExportFile,
  onExportClipboard,
  disabled = false,
}: ExportControlsProps): JSX.Element {
  const { t } = useI18n();

  const handleExportFileClick = () => {
    if (isExporting || disabled || !onExportFile) {
      return;
    }

    const format = density === "compact" ? "json" : exportFormat;
    void onExportFile(format);
  };

  const handleExportClipboardClick = () => {
    if (isExporting || disabled || !onExportClipboard) {
      return;
    }

    const format = density === "compact" ? "json" : exportFormat;
    void onExportClipboard(format);
  };

  const formatLabel = density === "compact" ? "JSON" : exportFormat.toUpperCase();

  return (
    <section className="transfer-group" aria-label={t('aria_exportControls')}>
      <div className="transfer-group-label">{t('common_export')}</div>
      {density === "standard" && onExportFormatChange && (
        <select
          className="format-select"
          value={exportFormat}
          onChange={(event) => {
            const nextFormat = event.target.value as ExportFormat;
            onExportFormatChange(nextFormat);
          }}
          aria-label={t('aria_exportFormat')}
          disabled={isExporting || disabled}
        >
          <option value="json">{t('common_json')}</option>
          <option value="markdown">{t('common_markdown')}</option>
        </select>
      )}
      {onExportFile && (
        <button
          onClick={handleExportFileClick}
          className="icon-action-button"
          disabled={isExporting || disabled}
          type="button"
          aria-label={t('export_exportToFile', [formatLabel])}
          title={t('export_exportToFile', [formatLabel])}
        >
          <IconFileExport size={16} stroke={2} aria-hidden="true" />
        </button>
      )}
      {onExportClipboard && (
        <button
          onClick={handleExportClipboardClick}
          className="icon-action-button"
          disabled={isExporting || disabled}
          type="button"
          aria-label={t('export_exportToClipboard', [formatLabel])}
          title={t('export_exportToClipboard', [formatLabel])}
        >
          <IconClipboardCopy size={16} stroke={2} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

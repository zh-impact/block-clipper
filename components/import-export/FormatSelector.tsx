/**
 * FormatSelector Component
 * @description Format selector for import/export operations
 */

import { type JSX } from "react";
import type { ExportFormat } from "../../utils/exporter";
import type { ImportFormat } from "../../utils/importer";

export type FormatType = ExportFormat | ImportFormat;

export interface FormatSelectorProps {
  format: FormatType;
  onFormatChange: (format: FormatType) => void;
  disabled?: boolean;
  ariaLabel?: string;
  options?: { value: FormatType; label: string }[];
}

const DEFAULT_OPTIONS: { value: FormatType; label: string }[] = [
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
];

/**
 * FormatSelector Component
 */
export function FormatSelector({
  format,
  onFormatChange,
  disabled = false,
  ariaLabel = "Format",
  options = DEFAULT_OPTIONS,
}: FormatSelectorProps): JSX.Element {
  return (
    <select
      className="format-select"
      value={format}
      onChange={(event) => {
        const nextFormat = event.target.value as FormatType;
        onFormatChange(nextFormat);
      }}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

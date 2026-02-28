# Content Export Specification

## ADDED Requirements

### Requirement: Export clipped items to JSON format
The system SHALL provide the ability to export one or more clipped items to JSON format for data portability.

#### Scenario: Export single item to JSON
- **WHEN** user selects a single item and chooses JSON export
- **THEN** system generates and downloads a JSON file containing the complete block data including content, metadata, and structure

#### Scenario: Export multiple items to JSON
- **WHEN** user selects multiple items and chooses JSON export
- **THEN** system generates and downloads a JSON file containing an array of complete block data

#### Scenario: JSON format structure
- **WHEN** generating JSON export
- **THEN** system outputs valid JSON with structure: `[{ id, type, content, metadata, createdAt, source }]`

#### Scenario: JSON export with timestamp
- **WHEN** generating JSON export file
- **THEN** system includes timestamp in filename (e.g., `block-clipper-export-2024-02-26.json`)

---

### Requirement: Export clipped items to Markdown format
The system SHALL provide the ability to export one or more clipped items to Markdown format for integration with knowledge bases.

#### Scenario: Export single item to Markdown
- **WHEN** user selects a single item and chooses Markdown export
- **THEN** system generates and downloads a Markdown file with content, metadata header, and source link

#### Scenario: Export multiple items to Markdown
- **WHEN** user selects multiple items and chooses Markdown export
- **THEN** system generates and downloads a Markdown file with each item separated by horizontal rule, including metadata headers

#### Scenario: Markdown format structure
- **WHEN** generating Markdown export for single item
- **THEN** system outputs format with YAML frontmatter for metadata followed by Markdown content

#### Scenario: Markdown export with separator
- **WHEN** generating Markdown export for multiple items
- **THEN** system separates each item with `---` horizontal rule and includes metadata for each item

---

### Requirement: Provide export selection interface
The system SHALL provide an interface for users to select items for export and choose export format.

#### Scenario: Select single item for export
- **WHEN** user is in detail view and clicks export button
- **THEN** system shows format selection menu (JSON, Markdown)

#### Scenario: Select multiple items for export
- **WHEN** user selects multiple items in list view and clicks batch export button
- **THEN** system shows format selection menu (JSON, Markdown)

#### Scenario: Export all items
- **WHEN** user clicks "Export All" button
- **THEN** system exports all items in selected format with confirmation for large datasets

---

### Requirement: Support batch export selection
The system SHALL allow users to select multiple items using checkboxes for batch export operations.

#### Scenario: Enable selection mode
- **WHEN** user clicks "Select Multiple" button in Sidebar
- **THEN** system shows checkboxes next to each item and batch action toolbar

#### Scenario: Select items for batch export
- **WHEN** user checks one or more items and clicks export in batch toolbar
- **THEN** system exports selected items in chosen format

#### Scenario: Exit selection mode
- **WHEN** user clicks "Cancel" or completes batch action
- **THEN** system hides checkboxes and batch toolbar, returning to normal view

---

### Requirement: Generate export filename with context
The system SHALL generate export filenames that include relevant context (date, format, item count).

#### Scenario: Single item export filename
- **WHEN** exporting a single item
- **THEN** system generates filename in format `clip-{item-id}-{timestamp}.{extension}`

#### Scenario: Multiple items export filename
- **WHEN** exporting multiple items
- **THEN** system generates filename in format `block-clipper-export-{date}-count-{n}.{extension}`

#### Scenario: All items export filename
- **WHEN** exporting all items
- **THEN** system generates filename in format `block-clipper-full-export-{date}.{extension}`

---

### Requirement: Validate exported data format
The system SHALL validate that exported data conforms to expected format before download.

#### Scenario: JSON validation
- **WHEN** generating JSON export
- **THEN** system validates JSON structure and catches serialization errors before offering download

#### Scenario: Markdown validation
- **WHEN** generating Markdown export
- **THEN** system ensures Markdown content is properly escaped and formatted

#### Scenario: Export error handling
- **WHEN** export generation fails due to data corruption or format error
- **THEN** system displays specific error message indicating which items failed and why

---

### Requirement: Provide export progress feedback
The system SHALL provide progress feedback for export operations, especially for large datasets.

#### Scenario: Small export immediate feedback
- **WHEN** exporting small dataset (under 10 items)
- **THEN** system immediately triggers download without progress indicator

#### Scenario: Large export progress indicator
- **WHEN** exporting large dataset (100+ items)
- **THEN** system shows progress bar or percentage indicator during export generation

#### Scenario: Export completion notification
- **WHEN** export download is triggered
- **THEN** system displays success notification with filename and item count

---

### Requirement: Support UTF-8 encoding for exports
The system SHALL ensure all exported files use UTF-8 encoding to support international characters.

#### Scenario: JSON export with UTF-8
- **WHEN** generating JSON export file
- **THEN** system uses UTF-8 encoding and includes BOM if needed for compatibility

#### Scenario: Markdown export with UTF-8
- **WHEN** generating Markdown export file
- **THEN** system uses UTF-8 encoding to preserve special characters and emojis

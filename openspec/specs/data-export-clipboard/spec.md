## Purpose

Define clipboard export behavior for Block Clipper JSON data, including contract consistency with file export and UI availability in side panel and options page.

## Requirements

### Requirement: System SHALL support export to clipboard
The system SHALL allow users to copy exported Block Clipper JSON data to the system clipboard.

#### Scenario: Export selected dataset to clipboard
- **WHEN** user triggers export-to-clipboard action
- **THEN** system SHALL serialize export data using the same JSON contract as file export and write it to clipboard

#### Scenario: Clipboard write fails
- **WHEN** clipboard API write fails or is denied
- **THEN** system SHALL show an actionable error and SHALL NOT report export success

### Requirement: System SHALL keep file and clipboard export contract consistent
The system SHALL ensure file export and clipboard export produce equivalent JSON schema for the same selected records.

#### Scenario: Same records exported via two channels
- **WHEN** user exports the same dataset to file and to clipboard
- **THEN** both outputs SHALL follow identical record schema and field semantics

### Requirement: System SHALL expose export UI in options and side panel
The system SHALL provide export entry points in both options page and side panel.

#### Scenario: Export controls visible in side panel
- **WHEN** user opens side panel
- **THEN** user SHALL see export actions for file and clipboard

#### Scenario: Export controls visible in options page
- **WHEN** user opens options page
- **THEN** user SHALL see export actions for file and clipboard

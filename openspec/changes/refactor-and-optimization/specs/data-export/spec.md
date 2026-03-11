# Data Export - Delta Spec

This delta spec modifies the existing data-export-clipboard capability to add shared components and unified UI.

## MODIFIED Requirements

### Requirement: System SHALL expose export UI in options and side panel
The system SHALL provide export entry points in both options page and side panel.

#### Scenario: Export controls visible in side panel
- **WHEN** user opens side panel
- **THEN** user SHALL see export actions for file and clipboard
- **AND** export controls SHALL use shared `ExportControls` component
- **AND** export controls SHALL maintain consistent styling with Options page

#### Scenario: Export controls visible in options page
- **WHEN** user opens options page
- **THEN** user SHALL see export actions for file and clipboard
- **AND** export controls SHALL use shared `ExportControls` component
- **AND** export controls SHALL maintain consistent styling with Sidepanel

## ADDED Requirements

### Requirement: Shared Export Components
The system SHALL provide reusable export components that can be used across all pages.

#### Scenario: ExportControls component usage
- **WHEN** page needs export functionality
- **THEN** page uses shared `ExportControls` component from `components/import-export/`
- **THEN** component displays format selector (JSON/Markdown)
- **THEN** component displays file export button
- **THEN** component displays clipboard export button
- **AND** component handles loading and error states

#### Scenario: Format selector component
- **WHEN** user needs to choose export format
- **THEN** system provides `FormatSelector` component
- **AND** component supports JSON and Markdown formats
- **AND** component respects user's density mode preference
- **AND** component persists format preference

### Requirement: Unified Export Experience
The system SHALL ensure export behavior is consistent across all pages.

#### Scenario: Export behavior is identical across pages
- **WHEN** user exports data from Options, Sidepanel, or Popup
- **THEN** export process uses shared logic from `useImportExport` hook
- **AND** exported data format is identical
- **AND** file naming convention is consistent
- **AND** success/error messages are consistent

#### Scenario: Export state is synchronized
- **WHEN** export operation is in progress
- **THEN** all pages show consistent loading state
- **AND** all pages disable export controls appropriately
- **AND** completion is synchronized across pages

### Requirement: Export Performance Optimization
The system SHALL optimize export performance for large datasets.

#### Scenario: Export large datasets efficiently
- **WHEN** user exports 1000+ blocks
- **THEN** system uses streaming or chunked processing
- **AND** system does NOT freeze UI
- **AND** system shows progress indicator

#### Scenario: Lazy load export functionality
- **WHEN** page mounts
- **THEN** export controls are available immediately
- **AND** heavy export operations are performed on-demand
- **AND** page initial load is not delayed

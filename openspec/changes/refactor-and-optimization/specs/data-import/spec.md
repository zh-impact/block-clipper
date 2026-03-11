# Data Import - Delta Spec

This delta spec modifies the existing data-import capability to add cross-page synchronization.

## MODIFIED Requirements

### Requirement: System SHALL report import results
The system SHALL provide a user-visible summary after import across both file and clipboard channels.

#### Scenario: Import completes with mixed outcomes
- **WHEN** import run has imported, skipped, and failed records
- **THEN** system SHALL show counts for each outcome and include failure reason summary
- **AND** system SHALL send `IMPORT_COMPLETED` message to all other pages
- **AND** system SHALL include import count in message data

#### Scenario: Import fully fails
- **WHEN** no records are imported due to file-level or clipboard-level validation/parsing failure
- **THEN** system SHALL show a clear failure message and SHALL NOT alter stored data
- **AND** system SHALL NOT send sync message (no data changed)

#### Scenario: Clipboard permission or API failure
- **WHEN** clipboard read operation is denied or unavailable
- **THEN** system SHALL show actionable feedback and SHALL NOT execute persistence operations
- **AND** system SHALL NOT send sync message

## ADDED Requirements

### Requirement: Cross-Page Synchronization
The system SHALL notify all open pages when data is imported, ensuring consistent state across Options, Sidepanel, and Popup.

#### Scenario: Notify other pages after successful import
- **WHEN** import completes successfully (one or more records imported)
- **THEN** system SHALL broadcast `IMPORT_COMPLETED` message via chrome.runtime
- **AND** message SHALL include count of imported records
- **AND** other pages SHALL receive message and update their data

#### Scenario: Options import triggers Sidepanel update
- **WHEN** user imports data in Options page
- **AND** Sidepanel is currently open
- **THEN** Sidepanel receives `IMPORT_COMPLETED` message
- **AND** Sidepanel reloads blocks from IndexedDB
- **AND** Sidepanel displays updated data immediately

#### Scenario: Import notification is throttled
- **WHEN** multiple import operations occur in quick succession
- **THEN** system debounces sync messages (300ms window)
- **AND** system sends single combined notification
- **AND** system prevents message flooding

### Requirement: Import Progress Display
The system SHALL show import progress during large imports.

#### Scenario: Show loading state during import
- **WHEN** import operation is in progress
- **THEN** system displays loading indicator
- **AND** system disables import controls
- **AND** system allows user to cancel operation

#### Scenario: Show incremental progress
- **WHEN** importing large dataset (100+ records)
- **THEN** system shows progress indicator
- **AND** system updates progress as records are processed
- **AND** system displays percentage complete

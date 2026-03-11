# Cross-Page Sync

Purpose: Enable real-time data synchronization across Popup, Options, and Sidepanel pages, ensuring consistent user experience.

## ADDED Requirements

### Requirement: Message-Based Synchronization
The system SHALL use chrome.runtime.onMessage for cross-page communication and data synchronization.

#### Scenario: Broadcast block update
- **WHEN** a block is created, updated, or deleted
- **THEN** system sends `BLOCK_UPDATED` message to all pages
- **AND** message contains updated block data
- **AND** all pages receive and process the message

#### Scenario: Broadcast blocks reload
- **WHEN** blocks are imported or bulk deleted
- **THEN** system sends `BLOCKS_RELOADED` message to all pages
- **AND** message contains timestamp
- **AND** all pages reload blocks from IndexedDB

#### Scenario: Broadcast import completion
- **WHEN** data import is completed
- **THEN** system sends `IMPORT_COMPLETED` message to all pages
- **AND** message contains import count
- **AND** all pages refresh their data

### Requirement: Local State Update
The system SHALL update local state immediately upon receiving sync messages.

#### Scenario: Update block in local state
- **WHEN** page receives `BLOCK_UPDATED` message
- **THEN** page finds block in local state by ID
- **AND** page updates block with new data
- **AND** if block is currently displayed (e.g., in detail view), page refreshes display

#### Scenario: Reload blocks from storage
- **WHEN** page receives `BLOCKS_RELOADED` message
- **THEN** page queries IndexedDB for latest blocks
- **AND** page replaces local state with fresh data
- **AND** page preserves user's current view context (if possible)

#### Scenario: Show notification for import
- **WHEN** page receives `IMPORT_COMPLETED` message
- **THEN** page displays toast notification
- **AND** notification shows number of imported clips
- **AND** page reloads blocks if needed

### Requirement: Sync Message Throttling
The system SHALL throttle sync messages to prevent performance degradation.

#### Scenario: Throttle rapid block updates
- **WHEN** multiple blocks are updated rapidly (e.g., bulk import)
- **THEN** system debounces sync messages (500ms window)
- **AND** system sends single `BLOCKS_RELOADED` instead of multiple `BLOCK_UPDATED`
- **AND** system prevents message flooding

#### Scenario: Prioritize sync messages
- **WHEN** sync messages are queued
- **THEN** system prioritizes `BLOCKS_RELOADED` over `BLOCK_UPDATED`
- **AND** system processes most recent sync message for same block

### Requirement: Background Service Worker Role
The Background Service Worker SHALL act as message hub for cross-page synchronization.

#### Scenario: Background broadcasts after data change
- **WHEN** Background receives storage update request
- **THEN** Background performs storage operation
- **THEN** Background reads updated data
- **THEN** Background broadcasts sync message to all pages

#### Scenario: Background handles broadcast errors gracefully
- **WHEN** message broadcast fails (no listeners, etc.)
- **THEN** Background logs error but continues operation
- **AND** Background does not fail storage operation

### Requirement: Page Listener Registration
Each page SHALL register message listeners on mount and unregister on unmount.

#### Scenario: Register listeners on mount
- **WHEN** page component mounts
- **THEN** page registers chrome.runtime.onMessage listener
- **AND** page handles sync messages appropriately
- **AND** page does not register duplicate listeners

#### Scenario: Unregister listeners on unmount
- **WHEN** page component unmounts
- **THEN** page removes chrome.runtime.onMessage listener
- **AND** page prevents memory leaks
- **AND** page stops processing sync messages

### Requirement: Message Format Standardization
All sync messages SHALL follow a consistent format for type safety and reliability.

#### Scenario: Message includes type and data
- **WHEN** system sends sync message
- **THEN** message includes `type` field (string)
- **AND** message includes `data` field (object with payload)
- **AND** message format is consistent across all message types

#### Scenario: Block update message includes full block
- **WHEN** system sends `BLOCK_UPDATED` message
- **THEN** message data includes complete Block object
- **AND** receiving page can update state without additional storage query

### Requirement: Sync Conflict Resolution
The system SHALL handle conflicts when multiple pages update the same data simultaneously.

#### Scenario: Last write wins for block updates
- **WHEN** two pages update the same block simultaneously
- **THEN** last update to reach storage wins
- **AND** other pages receive latest data via sync message
- **AND** all pages eventually converge to same state

#### Scenario: Version mismatch handling
- **WHEN** page receives update with older timestamp
- **THEN** page ignores update if local data is newer
- **AND** page logs version mismatch for debugging

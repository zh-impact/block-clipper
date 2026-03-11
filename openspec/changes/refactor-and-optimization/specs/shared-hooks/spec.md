# Shared Hooks

Purpose: Provide reusable React hooks that encapsulate state management logic, eliminating code duplication and ensuring consistent behavior across pages.

## ADDED Requirements

### Requirement: Hook Auto-Import
The system SHALL automatically import and make available all hooks from the `hooks/` directory through WXT's auto-import mechanism.

#### Scenario: Hook is automatically available
- **WHEN** developer creates a hook in `hooks/` directory
- **THEN** WXT automatically imports the hook
- **AND** hook is available in all components
- **AND** developer can use hook without explicit import statement

### Requirement: Blocks Data Management Hook
The system SHALL provide `useBlocks` hook for managing blocks data across pages.

#### Scenario: Fetch and cache blocks data
- **WHEN** component calls `useBlocks()`
- **THEN** hook fetches blocks from IndexedDB
- **AND** hook caches blocks in state
- **AND** hook provides loading state
- **AND** hook provides error state

#### Scenario: Support pagination and filtering
- **WHEN** component calls `useBlocks({ page, limit, query })`
- **THEN** hook fetches paginated results
- **AND** hook supports search query filtering
- **AND** hook returns total count and hasMore flag

#### Scenario: Support mutations
- **WHEN** component calls `useBlocks()` mutations (add, update, delete)
- **THEN** hook updates IndexedDB
- **AND** hook updates local cache
- **AND** hook triggers cross-page sync notification

### Requirement: Search Functionality Hook
The system SHALL provide `useSearch` hook for managing search state and logic.

#### Scenario: Debounced search input
- **WHEN** user types in search input
- **THEN** hook debounces input (300ms delay)
- **AND** hook prevents search during IME composition
- **AND** hook updates search query

#### Scenario: Perform search query
- **WHEN** search query is updated
- **THEN** hook searches blocks from IndexedDB
- **AND** hook updates results list
- **AND** hook shows loading state during search

#### Scenario: Clear search
- **WHEN** user clears search input
- **THEN** hook resets search query
- **AND** hook reloads all blocks
- **AND** hook exits search mode

### Requirement: Import/Export Hook
The system SHALL provide `useImportExport` hook for managing import and export operations.

#### Scenario: Initiate import from file
- **WHEN** user selects file for import
- **THEN** hook reads file content
- **AND** hook parses content based on format
- **AND** hook imports to IndexedDB
- **AND** hook displays import report
- **AND** hook triggers cross-page sync notification

#### Scenario: Initiate import from clipboard
- **WHEN** user clicks import from clipboard
- **THEN** hook reads clipboard content
- **AND** hook detects format automatically
- **AND** hook imports to IndexedDB
- **AND** hook displays import report

#### Scenario: Initiate export to file
- **WHEN** user clicks export to file
- **THEN** hook exports all blocks in specified format
- **AND** hook triggers file download
- **AND** hook shows success notification

#### Scenario: Initiate export to clipboard
- **WHEN** user clicks export to clipboard
- **THEN** hook exports all blocks in specified format
- **AND** hook writes to clipboard
- **AND** hook shows success notification

### Requirement: Notification Hook
The system SHALL provide `useNotification` hook for displaying toast notifications.

#### Scenario: Show toast notification
- **WHEN** component calls `showToast(message, type)`
- **THEN** hook adds toast to notification queue
- **AND** hook displays toast notification
- **AND** hook auto-dismisses toast after duration

#### Scenario: Show persistent notification
- **WHEN** component calls `showToast(message, type, { duration: null })`
- **THEN** hook displays toast that does not auto-dismiss
- **AND** user can manually dismiss toast

#### Scenario: Limit concurrent toasts
- **WHEN** multiple toasts are shown simultaneously
- **THEN** hook limits display to 3 concurrent toasts
- **AND** hook queues additional toasts

### Requirement: AI Functionality Hook
The system SHALL provide `useAI` hook for AI-related functionality.

#### Scenario: Check AI availability
- **WHEN** component calls `useAI()`
- **THEN** hook checks Chrome Summarizer API availability
- **AND** hook returns `aiAvailable` boolean
- **AND** hook caches result to avoid repeated checks

#### Scenario: Generate AI title
- **WHEN** component calls `generateAITitle(content)`
- **THEN** hook generates title using Chrome Summarizer API
- **AND** hook returns generated title
- **AND** hook throws error if generation fails

### Requirement: Cross-Page Sync Hook
The system SHALL provide `useCrossPageSync` hook for listening to data changes from other pages.

#### Scenario: Listen to block updates
- **WHEN** component mounts
- **THEN** hook registers chrome.runtime.onMessage listener
- **AND** hook listens for `BLOCK_UPDATED` messages
- **AND** hook updates local state when block is updated

#### Scenario: Listen to blocks reload
- **WHEN** component mounts
- **THEN** hook listens for `BLOCKS_RELOADED` messages
- **AND** hook reloads blocks from IndexedDB
- **AND** hook updates local state

#### Scenario: Clean up listeners on unmount
- **WHEN** component unmounts
- **THEN** hook removes chrome.runtime.onMessage listener
- **AND** hook prevents memory leaks

### Requirement: Hook State Management
All hooks SHALL follow React 19 best practices for state management.

#### Scenario: Hook uses useState for local state
- **WHEN** hook manages component-level state
- **THEN** hook uses `useState` hook
- **AND** hook provides setter function

#### Scenario: Hook uses useEffect for side effects
- **WHEN** hook performs side effects (data fetching, subscriptions)
- **THEN** hook uses `useEffect` hook
- **AND** hook provides cleanup function

#### Scenario: Hook uses useCallback for memoization
- **WHEN** hook provides functions to components
- **THEN** hook uses `useCallback` for memoization
- **AND** hook includes all dependencies

#### Scenario: Hook uses useMemo for expensive computations
- **WHEN** hook performs expensive computations
- **THEN** hook uses `useMemo` for memoization
- **AND** hook recomputes only when dependencies change

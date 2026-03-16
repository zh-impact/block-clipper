# Specification: Page Saving Feature

## ADDED Requirements

### Requirement: Extract main page content

The system SHALL extract the main content from a webpage using Mozilla Readability library, removing navigation, ads, sidebars, and other non-content elements.

#### Scenario: Successful content extraction from article page
- **GIVEN** user is on an article page with main content and navigation
- **WHEN** user clicks "Save page" button in Popup
- **THEN** system SHALL inject extraction script into active tab
- **THEN** system SHALL use Readability to parse the page DOM
- **THEN** system SHALL extract the main article content (title, text content)
- **THEN** system SHALL save extracted content as a new Block with `contentSource: 'full-page'`

#### Scenario: Handle non-article pages
- **GIVEN** user is on a page without clear article content (e.g., homepage, listing page)
- **WHEN** user clicks "Save page" button
- **THEN** system SHALL attempt content extraction using Readability
- **THEN** if Readability cannot extract article content, system SHALL show error notification: "Cannot extract article content from this page"
- **THEN** no Block SHALL be created

#### Scenario: Handle script injection failure
- **GIVEN** user is on a page that blocks script injection
- **WHEN** system attempts to inject extraction script
- **THEN** if injection fails, system SHALL show error notification: "Cannot access this page. Try selecting text manually."
- **THEN** no Block SHALL be created

### Requirement: Show loading state during extraction

The system SHALL provide visual feedback during page content extraction.

#### Scenario: Loading indicator in Popup
- **GIVEN** user clicks "Save page" button
- **WHEN** extraction is in progress
- **THEN** "Save page" button SHALL show loading state (disabled, showing spinner or "Saving...")
- **THEN** user SHALL NOT be able to click "Save page" again until extraction completes

#### Scenario: Extraction timeout
- **GIVEN** user clicks "Save page" button
- **WHEN** content extraction takes longer than 10 seconds
- **THEN** system SHALL abort extraction
- **THEN** system SHALL show error notification: "Content extraction timed out. Try selecting text manually."
- **THEN** button SHALL return to normal state

### Requirement: Save extracted content with metadata

The system SHALL save the extracted page content with appropriate metadata to IndexedDB.

#### Scenario: Successfully save page content
- **GIVEN** content extraction completed successfully
- **WHEN** extracted content is ready to save
- **THEN** system SHALL create a new Block with:
  - `content`: Extracted text content from Readability
  - `source.title`: Page title from Readability or document.title
  - `source.url`: Current page URL
  - `source.contentSource`: `'full-page'` (distinguishes from selection-based saves)
  - `createdAt`: Current timestamp
- **THEN** system SHALL save Block to IndexedDB storage
- **THEN** system SHALL broadcast `BLOCK_UPDATED` message to Sidebar and Options
- **THEN** system SHALL show success notification: "Page saved successfully"

#### Scenario: Handle storage quota exceeded
- **GIVEN** extracted content is ready to save
- **WHEN** system attempts to save to IndexedDB
- **THEN** if storage quota is exceeded (usage > 90%)
- **THEN** system SHALL show error notification: "Storage almost full. Delete some clips or export data."
- **THEN** Block SHALL NOT be saved
- **THEN** error notification SHALL link to Options page

### Requirement: Distinguish page-saved from selection-saved blocks

The system SHALL mark blocks saved via "Save page" feature differently from blocks saved via text selection.

#### Scenario: Block contentSource field
- **GIVEN** a Block is created via "Save page" feature
- **THEN** Block SHALL have `contentSource: 'full-page'`
- **GIVEN** a Block is created via text selection (existing feature)
- **THEN** Block SHALL have `contentSource: 'selection'`

#### Scenario: Filter blocks by contentSource
- **GIVEN** user has both selection-saved and page-saved blocks
- **WHEN** user filters blocks in Sidebar or Options
- **THEN** system SHALL allow distinguishing between save methods
- **THEN** user MAY filter by `contentSource` (future UI enhancement, not MVP requirement)

### Requirement: Integrate with existing cross-page synchronization

The system SHALL ensure page-saved blocks sync across all extension UIs (Sidebar, Options, Popup).

#### Scenario: Sync page-saved block to Sidebar
- **GIVEN** a page-saved Block is created successfully
- **WHEN** Sidebar is open
- **THEN** Sidebar SHALL receive `BLOCK_UPDATED` message
- **THEN** Sidebar SHALL reload blocks to show new Block
- **THEN** Sidebar MAY show toast notification: "New clip added"

#### Scenario: Sync page-saved block to Options
- **GIVEN** a page-saved Block is created successfully
- **WHEN** Options page is open
- **THEN** Options SHALL receive `BLOCK_UPDATED` message
- **THEN** Options SHALL reload blocks to show new Block

### Requirement: Handle "Save page" button in Popup UI

The system SHALL provide a "Save page" button in the Popup interface for quick access.

#### Scenario: Save page button in Popup
- **GIVEN** Popup is opened by user
- **WHEN** Popup renders
- **THEN** Popup SHALL display "Save page" button with document/page icon
- **THEN** button SHALL be positioned near existing clip count display
- **THEN** button SHALL be clearly labeled "Save page" or have icon indicating page saving

#### Scenario: Button click triggers save process
- **GIVEN** Popup is open and user is on any webpage
- **WHEN** user clicks "Save page" button
- **THEN** Popup SHALL send `SAVE_PAGE` message to Background
- **THEN** Popup SHALL close (normal Popup behavior)
- **THEN** Background SHALL handle the save process and show notifications

### Requirement: Error handling and user feedback

The system SHALL provide clear error messages when page saving fails.

#### Scenario: No active tab
- **GIVEN** user clicks "Save page" button in Popup
- **WHEN** there is no active tab (edge case)
- **THEN** system SHALL show error notification: "No active page found. Navigate to a webpage first."
- **THEN** no save operation SHALL be attempted

#### Scenario: Extraction fails gracefully
- **GIVEN** content extraction fails (Readability parsing error)
- **WHEN** error occurs during extraction
- **THEN** system SHALL show error notification: "Failed to extract page content. Try selecting text manually."
- **THEN** system SHALL NOT crash or cause errors in extension

#### Scenario: Network or offline pages
- **GIVEN** user is on a local file:// page or offline page
- **WHEN** user clicks "Save page" button
- **THEN** system SHALL attempt content extraction (Readability works on local pages)
- **THEN** if extraction succeeds, save as normal
- **THEN** if extraction fails, show appropriate error message

### Requirement: Preserve existing selection-based saving workflow

The system SHALL NOT modify existing text selection saving functionality.

#### Scenario: Selection saving still works
- **GIVEN** user has text selected on a page
- **WHEN** user uses keyboard shortcut (Ctrl+Shift+Y) or right-click menu
- **THEN** system SHALL save selected text as before
- **THEN** saved Block SHALL have `contentSource: 'selection'`
- **THEN** all existing features SHALL continue to work

#### Scenario: Both save methods can be used
- **GIVEN** user first saves selected text
- **WHEN** user then clicks "Save page" button on same page
- **THEN** both Blocks SHALL be saved separately
- **THEN** each Block SHALL have distinct `contentSource` value
- **THEN** user CAN have both selection-saved and page-saved clips from same page

### Requirement: Message flow architecture

The system SHALL use message passing between Popup, Background, and Content Script.

#### Scenario: Popup initiates save
- **GIVEN** user clicks "Save page" button in Popup
- **WHEN** button is clicked
- **THEN** Popup SHALL send `SAVE_PAGE` message to Background
- **THEN** Popup SHALL close immediately (normal Popup lifecycle)
- **THEN** Background SHALL handle save process asynchronously

#### Scenario: Background coordinates extraction
- **GIVEN** Background receives `SAVE_PAGE` message from Popup
- **WHEN** message is received
- **THEN** Background SHALL identify active tab
- **THEN** Background SHALL inject temporary content script into active tab using scripting API
- **THEN** Background SHALL wait for extraction result from content script

#### Scenario: Content script extraction
- **GIVEN** temporary script is injected into page
- **WHEN** script loads
- **THEN** script SHALL use Readability to parse page DOM
- **THEN** script SHALL extract title and main content
- **THEN** script SHALL return extracted data to Background
- **THEN** temporary script SHALL be removed automatically

### Requirement: Content extraction using @mozilla/readability

The system SHALL use Mozilla Readability library to extract main page content.

#### Scenario: Parse HTML with Readability
- **GIVEN** temporary script has access to page DOM
- **WHEN** script runs
- **THEN** script SHALL clone document (to avoid modifying original page)
- **THEN** script SHALL instantiate `new Readability(documentClone, document)`
- **THEN** script SHALL call `readability.parse()` to extract article
- **THEN** if article is successfully parsed, extract title and textContent
- **THEN** if no article is found, throw error: "Cannot extract article content"

#### Scenario: Extract text content only
- **GIVEN** Readability successfully parses article
- **WHEN** extracting content
- **THEN** system SHALL extract `article.textContent` (plain text)
- **THEN** system SHALL NOT extract HTML (keep it simple for MVP)
- **THEN** system SHALL extract `article.title` for Block title
- **THEN** system MAY extract `article.excerpt` for future use (not saved in MVP)

### Requirement: Block model extension

The system SHALL extend the Block model to include content source tracking.

#### Scenario: New blocks include contentSource field
- **GIVEN** a new Block is created
- **WHEN** Block is saved to storage
- **THEN** Block SHALL include `contentSource` field
- **THEN** `contentSource` value SHALL be either `'selection'` or `'full-page'`
- **THEN** existing Blocks (created before this feature) SHALL have `contentSource: 'selection'` (default)

#### Scenario: Backward compatibility
- **GIVEN** existing Blocks exist in storage from before this feature
- **WHEN** Blocks are loaded from storage
- **THEN** system SHALL handle missing `contentSource` field gracefully
- **THEN** system SHALL treat Blocks without `contentSource` as `contentSource: 'selection'` (default)

### Requirement: Performance and timeout handling

The system SHALL complete page extraction within reasonable time limits.

#### Scenario: Extraction timeout
- **GIVEN** user clicks "Save page" button
- **WHEN** content extraction is initiated
- **THEN** system SHALL enforce 10-second timeout
- **THEN** if extraction exceeds timeout, system SHALL abort and show error notification
- **THEN** system SHALL NOT leave extraction script running in page

#### Scenario: Loading state management
- **GIVEN** user clicks "Save page" button
- **WHEN** extraction starts
- **THEN** button SHALL enter disabled/loading state
- **THEN** after extraction completes (success or error), button SHALL return to normal state
- **THEN** user SHALL be able to click "Save page" button again

### Requirement: User notifications and feedback

The system SHALL provide appropriate notifications for save operations.

#### Scenario: Success notification
- **GIVEN** page content is successfully extracted and saved
- **WHEN** save operation completes
- **THEN** system SHALL show success notification: "Page saved successfully"
- **THEN** notification MAY include page title

#### Scenario: Error notifications
- **GIVEN** page save fails at any stage (extraction, save, sync)
- **WHEN** error occurs
- **THEN** system SHALL show descriptive error notification
- **THEN** error message SHALL suggest alternative action (e.g., "Try selecting text manually")

#### Scenario: Multiple saves in quick succession
- **GIVEN** user clicks "Save page" button multiple times quickly
- **WHEN** first save is still processing
- **THEN** button SHALL remain disabled until first operation completes
- **THEN** system SHALL prevent duplicate save operations on same page

### Requirement: Accessibility

The system SHALL be accessible to keyboard and screen reader users.

#### Scenario: Keyboard accessibility
- **GIVEN** Popup is open
- **WHEN** user navigates with Tab key
- **THEN** "Save page" button SHALL be keyboard focusable
- **THEN** button SHALL have accessible label: "Save page"
- **THEN** button MAY be activated with Enter/Space key

#### Scenario: Screen reader support
- **GIVEN** screen reader is active
- **WHEN** "Save page" button is focused
- **THEN** button SHALL announce its purpose: "Save page button"
- **THEN** button loading state SHALL be announced if applicable
- **THEN** success/error notifications SHALL be announced by screen reader

### Requirement: Cross-browser compatibility

The system SHALL work across different Chromium-based browsers (Chrome, Edge, Brave, etc.).

#### Scenario: Chrome compatibility
- **GIVEN** extension is installed in Chrome browser
- **WHEN** user uses "Save page" feature
- **THEN** all features SHALL work as specified
- **THEN** scripting API SHALL be available (part of Chrome extension APIs)

#### Scenario: Other Chromium browsers
- **GIVEN** extension is installed in Edge or Brave
- **WHEN** user uses "Save page" feature
- **THEN** all features SHALL work as specified
- **THEN** system SHALL use browser-agnostic APIs

#### Scenario: Manifest V3 compliance
- **GIVEN** extension follows Manifest V3 specification
- **WHEN** using scripting API for script injection
- **THEN** system SHALL comply with MV3 constraints
- **THEN** system SHALL NOT use deprecated APIs

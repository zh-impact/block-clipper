## Purpose

Define the baseline behavior for popup-triggered visual selector capture, including hover-based candidate selection, confirm-before-save flow, pure text extraction, and deterministic teardown.

## Requirements

### Requirement: Popup SHALL provide visual selector entry
The system SHALL expose an entry in Popup that starts visual selector capture mode for the active tab.

#### Scenario: User starts visual selector from Popup
- **WHEN** user clicks the visual selector tool in Popup
- **THEN** system sends a trigger to start visual selector mode in the active tab

#### Scenario: Active tab cannot be prepared
- **WHEN** Popup trigger is used but content script cannot be injected or reached
- **THEN** system SHALL show a user-facing failure message and SHALL NOT enter selector mode

### Requirement: Content script SHALL provide auto-best hover highlighting
The system SHALL render a visible highlight for one auto-selected candidate region while user hovers the page in visual selector mode.

#### Scenario: Hover updates highlighted candidate
- **WHEN** user moves cursor over page elements in selector mode
- **THEN** system SHALL update highlight to the current auto-best candidate region

#### Scenario: Overlay elements are ignored
- **WHEN** hover target is selector overlay UI itself
- **THEN** system SHALL keep or recompute candidate from underlying page content instead of selecting overlay nodes

### Requirement: Click SHALL open confirmation preview before save
The system SHALL require explicit user confirmation after candidate click and before persisting any clip.

#### Scenario: Click candidate opens preview
- **WHEN** user clicks highlighted candidate region
- **THEN** system SHALL open a preview dialog containing extracted text with Confirm and Cancel actions

#### Scenario: User cancels preview
- **WHEN** user presses Cancel in preview dialog
- **THEN** system SHALL close preview and SHALL NOT write any new clip data

### Requirement: Extraction SHALL use selected node visible pure text only
The system SHALL extract content from the selected node as visible pure text only and SHALL save it as text block content.

#### Scenario: Visible text extraction on confirm
- **WHEN** user confirms preview
- **THEN** system SHALL persist only selected-node visible text (normalized whitespace) as clip content

#### Scenario: Empty extracted text
- **WHEN** selected node yields empty or whitespace-only visible text
- **THEN** system SHALL block save and show an actionable message

### Requirement: Visual selector clips SHALL use existing storage pipeline
The system SHALL persist visual selector captures through the existing `CLIP_CONTENT` flow and maintain standard source metadata.

#### Scenario: Successful save path
- **WHEN** confirmed text is sent for persistence
- **THEN** background storage SHALL create a new clip record with source URL, source title, and timestamp

#### Scenario: Save failure path
- **WHEN** storage returns an error for confirmed capture
- **THEN** system SHALL show an error message and SHALL exit selector mode safely without partial writes

### Requirement: Selector mode SHALL be explicitly terminable
The system SHALL provide deterministic exit behavior for selector mode to avoid persistent overlay interference.

#### Scenario: Mode exits after success
- **WHEN** capture is saved successfully
- **THEN** selector overlay and listeners SHALL be fully removed

#### Scenario: Mode exits on cancel action
- **WHEN** user cancels from preview or exits selector mode
- **THEN** selector overlay and listeners SHALL be fully removed and normal page interaction restored

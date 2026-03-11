## ADDED Requirements

### Requirement: AI API availability detection
The system SHALL detect Chrome Summarizer API availability before attempting to generate titles.

#### Scenario: API is available
- **WHEN** user's browser supports Chrome Summarizer API (Chrome 138+)
- **AND** hardware requirements are met (22GB+ free space, 4GB+ VRAM or 16GB+ RAM)
- **THEN** system enables AI title generation features
- **AND** displays AI-related UI elements

#### Scenario: API is not available
- **WHEN** user's browser does not support Chrome Summarizer API
- **OR** hardware requirements are not met
- **THEN** system disables AI title generation features
- **AND** hides AI-related UI elements
- **AND** continues to operate with manual title input

#### Scenario: API becomes available after model download
- **WHEN** user triggers AI title generation for the first time
- **AND** Gemini Nano model needs to be downloaded
- **THEN** system displays download progress indicator
- **AND** proceeds with generation after download completes

### Requirement: Automatic title generation after clipping
The system SHALL automatically generate AI titles immediately after successful content clipping.

#### Scenario: Successful automatic title generation
- **WHEN** user clips content successfully
- **AND** AI API is available
- **THEN** system automatically calls Summarizer API with content
- **AND** uses `type: "headline"` and `length: "short"` parameters
- **AND** generates title within 12-22 words
- **AND** saves generated title to the clipped item's `title` field
- **AND** marks the title as AI-generated

#### Scenario: Generation in progress
- **WHEN** AI title generation is in progress
- **THEN** system displays loading indicator in UI
- **AND** prevents duplicate generation requests
- **AND** allows user to continue using other features

#### Scenario: Generation completes successfully
- **WHEN** AI title generation completes
- **THEN** system updates the clipped item with generated title
- **AND** dismisses loading indicator
- **AND** shows success notification
- **AND** allows user to edit the generated title

### Requirement: Fallback mechanism on generation failure
The system SHALL gracefully fallback to existing behavior when AI title generation fails.

#### Scenario: Fallback on API unavailability
- **WHEN** AI API is not available during clipping
- **THEN** system falls back to extracting title from page metadata
- **OR** prompts user to manually enter title
- **AND** logs failure reason for debugging

#### Scenario: Fallback on generation error
- **WHEN** AI API call throws an error during generation
- **THEN** system catches the error
- **AND** falls back to page metadata extraction or manual input
- **AND** displays user-friendly error message
- **AND** logs error details

#### Scenario: Fallback on hardware constraints
- **WHEN** system detects hardware cannot support AI generation
- **THEN** system disables AI features for current session
- **AND** falls back to traditional title methods
- **AND** shows informational message about hardware requirements

#### Scenario: Fallback on network failure during model download
- **WHEN** Gemini Nano model download fails
- **THEN** system falls back to manual title input
- **AND** displays message about download failure
- **AND** offers retry option

### Requirement: Manual title re-generation in detail view
The system SHALL allow users to manually trigger AI title generation for existing clipped items.

#### Scenario: Successful manual re-generation
- **WHEN** user views a clipped item in Sidebar detail view
- **AND** clicks "Regenerate Title" button
- **AND** AI API is available
- **THEN** system generates new AI title for the item
- **AND** updates the item's title field
- **AND** shows success notification

#### Scenario: Re-generation unavailable for unsupported browsers
- **WHEN** user views a clipped item in Sidebar detail view
- **AND** AI API is not available
- **THEN** system hides "Regenerate Title" button
- **OR** disables button with tooltip explaining unavailability

#### Scenario: Re-generation with user activation
- **WHEN** user clicks "Regenerate Title" button
- **THEN** system treats action as user activation
- **AND** satisfies Summarizer API's user activation requirement
- **AND** proceeds with generation

#### Scenario: Re-generation in progress
- **WHEN** AI re-generation is in progress
- **THEN** system disables "Regenerate Title" button
- **AND** displays loading indicator
- **AND** prevents navigation away during generation

### Requirement: Edit AI-generated titles
The system SHALL allow users to edit AI-generated titles like any manually created title.

#### Scenario: Edit AI-generated title
- **WHEN** user modifies an AI-generated title
- **THEN** system saves the edited title
- **AND** updates the `aiGenerated` flag to false
- **AND** treats it as a manual title thereafter

#### Scenario: Preserve original AI title
- **WHEN** user edits an AI-generated title
- **THEN** system may preserve original AI-generated title for reference
- **AND** allows reverting to AI-generated version if desired

### Requirement: User activation requirement
The system SHALL satisfy Chrome Summarizer API's user activation requirement.

#### Scenario: User activation on clipping
- **WHEN** user initiates content clipping (user-triggered action)
- **THEN** system can create Summarizer instance without additional activation
- **AND** proceeds with automatic title generation

#### Scenario: User activation on manual regeneration
- **WHEN** user clicks "Regenerate Title" button
- **THEN** system satisfies user activation requirement
- **AND** can create new Summarizer instance

#### Scenario: No user activation for background generation
- **WHEN** system attempts generation without user activation
- **THEN** Summarizer API throws error
- **AND** system handles error gracefully
- **AND** may defer generation until user activation occurs

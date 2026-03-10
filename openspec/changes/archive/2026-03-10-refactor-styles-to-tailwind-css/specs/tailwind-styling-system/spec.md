## ADDED Requirements

### Requirement: Extension UI SHALL use Tailwind CSS as primary styling approach
The system SHALL implement popup, sidepanel, and options-page visual styles primarily through Tailwind CSS utilities and configuration-driven design tokens.

#### Scenario: Render core pages with Tailwind styles
- **WHEN** user opens popup, sidepanel, or options-page
- **THEN** each page SHALL render with Tailwind-based styling without dependency on legacy inline `<style>` blocks

### Requirement: Style refactor SHALL preserve existing interaction behavior
The system SHALL keep current user-facing behaviors unchanged while migrating style implementation.

#### Scenario: Existing feature flow after style migration
- **WHEN** user performs existing actions (search, open detail, import/export, delete)
- **THEN** outcomes SHALL remain functionally equivalent to pre-migration behavior

### Requirement: Density mode SHALL remain available after migration
The system SHALL preserve standard and compact density modes with behavior parity.

#### Scenario: Toggle compact mode
- **WHEN** user switches from standard to compact mode
- **THEN** UI SHALL collapse to quick-action controls while preserving corresponding operations

### Requirement: Transfer controls SHALL keep semantic visual distinction
The system SHALL maintain visual distinction between file-based and clipboard-based transfer actions in Tailwind-styled UI.

#### Scenario: Display transfer action controls
- **WHEN** transfer controls are rendered
- **THEN** file actions SHALL remain visually distinguishable from clipboard actions via consistent semantic iconography and style treatment

### Requirement: Tailwind integration SHALL be build-safe under MV3/WXT
The system SHALL integrate Tailwind CSS in a way that does not break extension build or runtime constraints.

#### Scenario: Build and runtime validation
- **WHEN** project build and test validators run
- **THEN** compile and test pipelines SHALL pass with Tailwind integration enabled

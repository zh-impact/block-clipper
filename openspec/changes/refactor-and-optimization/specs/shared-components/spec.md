# Shared Components

Purpose: Provide reusable UI components that can be used across Popup, Options, and Sidepanel pages, eliminating code duplication and ensuring consistent user experience.

## ADDED Requirements

### Requirement: Component Auto-Import
The system SHALL automatically import and make available all components from the `components/` directory through WXT's auto-import mechanism.

#### Scenario: Component is automatically available
- **WHEN** developer creates a component in `components/` directory
- **THEN** WXT automatically imports the component
- **AND** component is available in all entrypoints (Popup, Options, Sidepanel)
- **AND** developer can use component without explicit import statement

#### Scenario: Component uses nested auto-imports
- **WHEN** component imports other components from `components/`
- **THEN** nested imports are resolved automatically
- **AND** no manual import configuration required

### Requirement: Clips List Components
The system SHALL provide reusable components for displaying clips lists and individual clip items.

#### Scenario: Display clips list with unified layout
- **WHEN** application renders clips list (Popup, Options, or Sidepanel)
- **THEN** system uses shared `ClipsList` component
- **AND** component displays clips with consistent card layout
- **AND** component supports loading states
- **AND** component handles empty states

#### Scenario: Display individual clip card
- **WHEN** application renders individual clip item
- **THEN** system uses shared `ClipCard` component
- **AND** component displays title, preview, source, and timestamp
- **AND** component supports click actions
- **AND** component maintains consistent styling across pages

### Requirement: Detail View Components
The system SHALL provide reusable components for displaying clip details.

#### Scenario: Display clip detail view
- **WHEN** user opens a clip's detail view
- **THEN** system uses shared `DetailView` component
- **AND** component displays full content, metadata, and actions
- **AND** component supports back navigation
- **AND** component maintains consistent layout across pages

#### Scenario: Display detail header with actions
- **WHEN** detail view is displayed
- **THEN** system uses shared `DetailHeader` component
- **AND** component displays title and action buttons (Delete, Export, Regenerate AI Title)
- **AND** component actions work consistently across pages

### Requirement: Import/Export Components
The system SHALL provide reusable components for data import and export functionality.

#### Scenario: Display import controls
- **WHEN** page displays import functionality
- **THEN** system uses shared `ImportControls` component
- **AND** component displays format selector, file/clipboard buttons
- **AND** component handles import state (loading, success, error)
- **AND** component displays import report

#### Scenario: Display export controls
- **WHEN** page displays export functionality
- **THEN** system uses shared `ExportControls` component
- **AND** component displays format selector, file/clipboard buttons
- **AND** component handles export state (loading, success, error)
- **AND** component respects user's density mode preference

### Requirement: Search Components
The system SHALL provide reusable search functionality components.

#### Scenario: Display search bar
- **WHEN** page displays search functionality
- **THEN** system uses shared `SearchBar` component
- **AND** component displays text input with debounced search
- **AND** component handles IME composition (Chinese input)
- **AND** component displays loading indicator during search
- **AND** component displays clear button when query exists

### Requirement: UI Components
The system SHALL provide reusable general-purpose UI components.

#### Scenario: Display toast notifications
- **WHEN** application needs to show notification
- **THEN** system uses shared `Toast` component
- **AND** component supports success, error, and info types
- **AND** component auto-dismisses after configured duration
- **AND** component displays multiple toasts in stack

#### Scenario: Display loading spinner
- **WHEN** application needs to show loading state
- **THEN** system uses shared `LoadingSpinner` component
- **AND** component displays consistent loading animation
- **AND** component supports different sizes

#### Scenario: Display button with icon
- **WHEN** application needs icon button
- **THEN** system uses shared `IconButton` component
- **AND** component supports different variants (primary, secondary, danger)
- **AND** component supports disabled state
- **AND** component displays loading state when processing

### Requirement: Component Styling Consistency
All shared components SHALL follow Tailwind CSS best practices and maintain visual consistency.

#### Scenario: Components use consistent spacing
- **WHEN** shared components render
- **THEN** components use design token values for spacing
- **AND** margin and padding follow 4px baseline grid
- **AND** spacing is consistent across all components

#### Scenario: Components use consistent colors
- **WHEN** shared components render
- **THEN** components use design token color values
- **AND** primary actions use blue (`--color-primary`)
- **AND** success states use green (`--color-success`)
- **AND** error states use red (`--color-danger`)
- **AND** warning states use amber (`--color-warning`)

#### Scenario: Components use consistent typography
- **WHEN** shared components render
- **THEN** components use Tailwind's default font stack
- **AND** headings use bold weight
- **AND** text sizes follow scale (text-xs, text-sm, text-base, text-lg, etc.)

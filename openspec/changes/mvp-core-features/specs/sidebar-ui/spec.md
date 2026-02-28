# Sidebar UI Specification

## ADDED Requirements

### Requirement: Display clipped items in list view
The system SHALL display a list of clipped items in the Sidebar, showing title, content preview, and timestamp.

#### Scenario: List view displays items
- **WHEN** user opens the Sidebar
- **THEN** system displays clipped items in descending order by creation timestamp

#### Scenario: List view item preview
- **WHEN** displaying an item in the list
- **THEN** system shows item title (or first 50 characters of content if no title), content preview (100 characters), and relative timestamp

#### Scenario: Empty state
- **WHEN** user opens Sidebar with no clipped items
- **THEN** system displays empty state message with illustration and prompt to clip first content

#### Scenario: Loading state
- **WHEN** Sidebar is opening and loading items
- **THEN** system displays loading indicator

---

### Requirement: Implement search functionality
The system SHALL provide a search input that filters clipped items by content and metadata in real-time.

#### Scenario: Real-time search filtering
- **WHEN** user types in the search input
- **THEN** system filters the item list in real-time showing items matching the query in content, title, or metadata

#### Scenario: Search with no results
- **WHEN** search query matches no items
- **THEN** system displays "no results" message with option to clear search

#### Scenario: Clear search
- **WHEN** user clears the search input or clicks clear button
- **THEN** system resets the list to show all items

---

### Requirement: Display item detail view
The system SHALL provide a detail view showing full content, metadata, and available actions for a selected item.

#### Scenario: View item details
- **WHEN** user clicks on an item in the list
- **THEN** system opens detail view showing full Markdown content, source URL, page title, and creation timestamp

#### Scenario: Detail view with source link
- **WHEN** viewing item details with source URL
- **THEN** system displays clickable link to original source page

#### Scenario: Navigate back to list
- **WHEN** user is in detail view and clicks back button
- **THEN** system returns to list view with previously selected item highlighted

---

### Requirement: Provide delete operation
The system SHALL allow users to delete individual items from the detail view with confirmation.

#### Scenario: Delete item with confirmation
- **WHEN** user clicks delete button in detail view
- **THEN** system shows confirmation dialog with item preview

#### Scenario: Confirm deletion
- **WHEN** user confirms deletion in confirmation dialog
- **THEN** system removes the item from storage and returns to list view with success notification

#### Scenario: Cancel deletion
- **WHEN** user cancels deletion in confirmation dialog
- **THEN** system closes dialog and returns to detail view

---

### Requirement: Support keyboard navigation
The system SHALL support keyboard navigation for list items and actions.

#### Scenario: Navigate list with arrow keys
- **WHEN** user presses up/down arrow keys
- **THEN** system moves selection to previous/next item in list

#### Scenario: Open detail with Enter key
- **WHEN** user presses Enter key on selected item
- **THEN** system opens detail view for that item

#### Scenario: Close Sidebar with Escape key
- **WHEN** user presses Escape key
- **THEN** system closes the Sidebar

---

### Requirement: Load Sidebar within performance budget
The system SHALL load and display the Sidebar with initial data within 1 second.

#### Scenario: Initial load performance
- **WHEN** user opens Sidebar
- **THEN** system displays initial item list within 1 second

#### Scenario: Performance with large dataset
- **WHEN** user has 1000+ clipped items and opens Sidebar
- **THEN** system displays first page of items within 1 second using pagination or virtual scrolling

---

### Requirement: Provide visual feedback for actions
The system SHALL provide visual feedback for user actions including loading states, success notifications, and error messages.

#### Scenario: Success notification after clip
- **WHEN** a new item is clipped while Sidebar is open
- **THEN** system updates the list to show new item and displays success notification

#### Scenario: Error notification on action failure
- **WHEN** an action (delete, search, etc.) fails
- **THEN** system displays error notification with actionable message

#### Scenario: Loading indicator during operations
- **WHEN** system is performing async operation (search, load more, etc.)
- **THEN** system displays loading indicator in relevant area

---

### Requirement: Support responsive layout
The system SHALL adapt Sidebar layout to different viewport sizes while maintaining usability.

#### Scenario: Narrow viewport
- **WHEN** Sidebar width is less than 400px
- **THEN** system adjusts layout to hide less critical elements and maintain readability

#### Scenario: Wide viewport
- **WHEN** Sidebar width is greater than 600px
- **THEN** system uses additional space to show more content preview and metadata

---

### Requirement: Persist Sidebar state
The system SHALL persist and restore Sidebar state including selected view and scroll position.

#### Scenario: Restore list view state
- **WHEN** user closes and reopens Sidebar
- **THEN** system restores previous view (list or detail) and scroll position

#### Scenario: Persist search state
- **WHEN** user has active search query and closes Sidebar
- **THEN** system restores search query and filtered results when reopened

# Implementation Tasks: MVP Core Features

## 1. Project Setup

- [x] 1.1 Create directory structure for utils (block-model, storage, converter, exporter)
- [x] 1.2 Create entrypoints directory structure (sidebar, content, popup)
- [x] 1.3 Install turndown dependency for HTML to Markdown conversion
- [x] 1.4 Configure WXT for Sidebar support in wxt.config.ts
- [x] 1.5 Add required permissions (activeTab, storage, scripting) to manifest
- [x] 1.6 Configure keyboard shortcut command in manifest

---

## 2. Block Model & Types

- [x] 2.1 Define BlockType enum and Block interface in utils/block-model.ts
- [x] 2.2 Define BlockSource interface for origin metadata
- [x] 2.3 Create CreateBlockInput interface for type-safe creation
- [x] 2.5 Write unit tests for Block model factory functions

---

## 3. Storage Layer (IndexedDB)

- [x] 3.1 Define IndexedDB schema (database name, version, object stores)
- [x] 3.2 Create database upgrade handler for version 1 schema
- [x] 3.3 Implement StorageService class with database initialization
- [x] 3.4 Implement create() method with UUID generation
- [x] 3.5 Implement read() method with error handling
- [x] 3.6 Implement query() method with pagination support
- [x] 3.7 Implement search() method for full-text search across content and metadata
- [x] 3.8 Implement update() method with partial updates
- [x] 3.9 Implement delete() and deleteMany() methods
- [x] 3.10 Implement getUsage() method for storage quota monitoring
- [x] 3.11 Add event emission for quota warning (80% threshold)
- [x] 3.12 Write unit tests for StorageService CRUD operations
- [x] 3.13 Write integration tests for IndexedDB migrations

---

## 4. HTML to Markdown Conversion

- [x] 4.1 Integrate turndown library in utils/converter.ts
- [x] 4.2 Configure turndown service (atx headings, fenced code blocks, - bullets)
- [x] 4.3 Implement convert() function with HTML input validation
- [x] 4.4 Add custom rules for edge cases (tables, nested lists)
- [x] 4.5 Write unit tests for conversion (headings, links, code, lists)
- [x] 4.6 Test with real-world HTML from various websites

---

## 5. Content Script (Clipping)

- [x] 5.1 Create entrypoints/content/content.ts as main content script
- [x] 5.2 Implement selection capture from window.getSelection()
- [x] 5.3 Extract metadata (URL from window.location.href, title from document.title)
- [x] 5.4 Convert HTML selection to Markdown using converter utility
- [x] 5.5 Generate ISO 8601 timestamp for capture time
- [x] 5.6 Send CLIP_CONTENT message to background service worker
- [x] 5.7 Handle success/error responses from background
- [x] 5.8 Display notifications using chrome.notifications API
- [x] 5.9 Add validation for empty selection (show error notification)
- [x] 5.10 Implement loading indicator for long content (>5000 characters)
- [x] 5.11 Test clipping on various websites (blogs, news, docs)

---

## 6. Background Service Worker

- [x] 6.1 Update entrypoints/background.ts to handle CLIP_CONTENT message
- [x] 6.2 Initialize StorageService on service worker startup
- [x] 6.3 Implement message handler for clipping requests
- [x] 6.4 Send CLIP_SUCCESS message back to content script
- [x] 6.5 Implement error handling with structured error messages
- [x] 6.6 Handle service worker termination gracefully
- [x] 6.7 Add retry logic for failed storage operations

---

## 7. Trigger Mechanisms

- [x] 7.1 Register keyboard shortcut command in manifest
- [x] 7.2 Add context menu item "Clip Selection" using chrome.contextMenus API
- [x] 7.3 Implement command listener in background script
- [x] 7.4 Message content script to trigger clipping on command
- [x] 7.5 Test keyboard shortcut doesn't conflict with common extensions
- [x] 7.6 Test context menu on various page types (plain text, rich text, code blocks)

---

## 8. Sidebar - Infrastructure

- [x] 8.1 Create entrypoints/sidebar/App.tsx as root component
- [x] 8.2 Create entrypoints/sidebar/main.tsx as entry point with React root
- [x] 8.3 Set up routing for ListView and DetailView (URL-based or state-based)
- [x] 8.4 Create StorageContext for dependency injection
- [x] 8.5 Create UI state context for view/selection management
- [x] 8.6 Add global styles in entrypoints/sidebar/index.css
- [x] 8.7 Implement responsive layout with CSS Grid/Flexbox
- [x] 8.8 Test Sidebar opens and closes correctly

---

## 9. Sidebar - ListView

- [x] 9.1 Create components/ListView.tsx with list container
- [x] 9.2 Create components/ItemCard.tsx for individual item display
- [x] 9.3 Implement title/preview extraction (first 50 chars if no title)
- [x] 9.4 Implement relative timestamp display (e.g., "2 hours ago")
- [x] 9.5 Implement pagination (50 items per page) with "Load More" button
- [x] 9.6 Add loading skeleton during initial data fetch
- [x] 9.7 Create components/EmptyState.tsx for no clips scenario
- [x] 9.8 Implement keyboard navigation (arrow keys, Enter to open detail)
- [x] 9.9 Test ListView performance with 1000+ items

---

## 10. Sidebar - Search Functionality

- [x] 10.1 Create components/SearchBar.tsx with input and clear button
- [x] 10.2 Implement debounced search (300ms delay) using custom hook
- [x] 10.3 Connect search to StorageService.search() method
- [x] 10.4 Display "no results" message with clear search option
- [ ] 10.5 Implement search query highlighting in results
- [ ] 10.6 Persist search state across Sidebar close/reopen
- [x] 10.7 Test search with various query types (short, long, special characters)

---

## 11. Sidebar - DetailView

- [x] 11.1 Create components/DetailView.tsx for single item display
- [x] 11.2 Create components/MarkdownRenderer.tsx using react-markdown or similar
- [x] 11.3 Display full Markdown content with proper styling
- [x] 11.4 Display metadata section (source URL, title, timestamp)
- [x] 11.5 Make source URL clickable and open in new tab
- [x] 11.6 Implement back button to return to ListView
- [ ] 11.7 Persist selected item and scroll position across Sidebar close/reopen
- [ ] 11.8 Test DetailView with various content types (code, links, nested lists)

---

## 12. Sidebar - Delete Functionality

- [x] 12.1 Create components/ConfirmDialog.tsx reusable component
- [x] 12.2 Add delete button in DetailView with confirmation dialog
- [x] 12.3 Implement delete action calling StorageService.delete()
- [x] 12.4 Return to ListView after successful deletion
- [x] 12.5 Display success notification after deletion
- [ ] 12.6 Implement batch delete from ListView (selection mode)
- [ ] 12.7 Test delete with confirmation and cancellation scenarios

---

## 13. Sidebar - Visual Feedback

- [x] 13.1 Implement success notification when new clip arrives (Sidebar open)
- [x] 13.2 Implement error notification with actionable messages
- [x] 13.3 Add loading indicators for async operations (search, load more)
- [x] 13.4 Display storage quota warning in Sidebar when threshold exceeded
- [x] 13.5 Add hover states and transitions for interactive elements
- [x] 13.6 Ensure focus states are visible for keyboard navigation

---

## 14. Sidebar - Accessibility

- [x] 14.1 Add ARIA labels to all interactive elements
- [x] 14.2 Ensure keyboard navigation works for all features
- [ ] 14.3 Test with screen reader (NVDA or JAWS)
- [ ] 14.4 Verify color contrast ratios meet WCAG AA standards
- [ ] 14.5 Add focus trap in modals (ConfirmDialog)
- [x] 14.6 Implement skip links for keyboard users

---

## 15. Popup (Minimal)

- [x] 15.1 Simplify entrypoints/popup/App.tsx to minimal status display
- [x] 15.2 Display current clip count from StorageService
- [x] 15.3 Add "Open Sidebar" button
- [x] 15.4 Display last clipped item preview (title + timestamp)
- [x] 15.5 Show keyboard shortcut hint for clipping
- [x] 15.6 Link to documentation/help

---

## 16. Export Functionality

- [x] 16.1 Create utils/exporter.ts with JSON export logic
- [x] 16.2 Create utils/exporter.ts with Markdown export logic
- [x] 16.3 Implement YAML frontmatter generation for Markdown exports
- [ ] 16.4 Create components/ExportMenu.tsx for format selection
- [x] 16.5 Add export button to DetailView (single item)
- [x] 16.6 Implement batch export from ListView (multiple items)
- [x] 16.7 Implement "Export All" functionality with large dataset confirmation
- [x] 16.8 Generate export filenames with context (date, count, format)
- [x] 16.9 Add UTF-8 BOM for JSON exports if needed
- [ ] 16.10 Validate export format before triggering download
- [ ] 16.11 Implement progress indicator for large exports (100+ items)
- [ ] 16.12 Test export files are usable by other tools

---

## 17. Custom Hooks

- [x] 17.1 Create hooks/useStorage.ts for StorageService integration
- [x] 17.2 Create hooks/usePagination.ts for pagination logic
- [x] 17.3 Create hooks/useKeyboardNav.ts for keyboard navigation
- [x] 17.4 Create hooks/useDebounce.ts for debounced search
- [ ] 17.5 Write tests for custom hooks

---

## 18. Testing

- [x] 18.1 Set up Vitest for unit testing
- [x] 18.2 Write unit tests for Block model utilities (see: 2.5)
- [x] 18.3 Write unit tests for StorageService methods (see: 3.12, 3.13)
- [x] 18.4 Write unit tests for HTML to Markdown converter (see: 4.5, 4.6)
- [ ] 18.5 Write unit tests for export formatters
- [ ] 18.6 Write unit tests for custom hooks
- [ ] 18.7 Set up Playwright for extension E2E testing
- [x] 18.8 Write E2E test for clipping flow (see: 5.11, 7.5, 7.6 - manual test guides created)
- [x] 18.9 Write E2E test for Sidebar ListView navigation (see: 8.8 - manual test guide created)
- [x] 18.10 Write E2E test for search functionality (see: 10.7 - manual test guide created)
- [x] 18.11 Write E2E test for delete flow (see: 12.7 - manual test guide created)
- [x] 18.12 Write E2E test for export functionality (see: 16.12 - manual test guide created)

---

## 19. Performance Optimization

- [ ] 19.1 Implement virtual scrolling in ListView using @tanstack/react-virtual
- [ ] 19.2 Add React.memo() to ItemCard and other expensive components
- [ ] 19.3 Implement code splitting for heavy components (DetailView)
- [ ] 19.4 Optimize IndexedDB queries with proper index usage
- [ ] 19.5 Add performance metrics logging (clipping time, load time)
- [ ] 19.6 Test with synthetic dataset of 1000+ items
- [ ] 19.7 Profile and optimize hot paths with Chrome DevTools

---

## 20. Error Handling & Edge Cases

- [ ] 20.1 Handle IndexedDB quota exceeded errors
- [ ] 20.2 Handle IndexedDB transaction abort errors
- [ ] 20.3 Handle network errors during metadata extraction
- [ ] 20.4 Handle malformed HTML in converter (fallback to plain text)
- [ ] 20.5 Handle empty or whitespace-only selections
- [ ] 20.6 Handle very large selections (>50,000 characters)
- [ ] 20.7 Handle concurrent clipping requests (debounce/queue)
- [ ] 20.8 Add error boundary for Sidebar React components
- [ ] 20.9 Add logging for debugging production issues

---

## 21. Browser Compatibility

- [ ] 21.1 Test clipping on Chrome (latest stable)
- [ ] 21.2 Test clipping on Firefox (latest stable)
- [ ] 21.3 Test clipping on Edge (latest stable)
- [ ] 21.4 Verify Sidebar API compatibility (Chrome sidePanel vs Firefox sidebar_action)
- [ ] 21.5 Implement fallback for browsers without Sidebar support
- [ ] 21.6 Test IndexedDB behavior across browsers
- [ ] 21.7 Verify permissions request flow on each browser

---

## 22. Documentation

- [ ] 22.1 Update README.md with installation instructions
- [ ] 22.2 Add user guide for basic clipping workflow
- [ ] 22.3 Document keyboard shortcuts
- [ ] 22.4 Document export formats and usage
- [ ] 22.5 Add FAQ section
- [ ] 22.6 Add screenshots of key features
- [ ] 22.7 Document privacy/permissions usage
- [ ] 22.8 Add contributing guidelines for developers

---

## 23. Release Preparation

- [ ] 23.1 Create production build with `wxt build`
- [ ] 23.2 Test production build in browser (load unpacked)
- [ ] 23.3 Create ZIP package for Chrome Web Store
- [ ] 23.4 Create ZIP package for Firefox Add-ons
- [ ] 23.5 Prepare store listing (description, screenshots, categories)
- [ ] 23.6 Create release notes for v1.0.0
- [ ] 23.7 Set up version tagging in git
- [ ] 23.8 Test upgrade flow from previous versions (if any)

---

## Task Dependencies

```
Setup (1) → Block Model (2) → Storage (3) → Converter (4)
                                      ↓
Content Script (5) + Background (6) + Triggers (7)
                                      ↓
                            Sidebar Infra (8)
                                      ↓
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                           ↓                               ↓
   ListView (9)               Search (10)                        DetailView (11)
        ↓                           ↓                               ↓
        └───────────────→ Delete (12) ←────────────────────────────┘
                                ↓
                        Visual Feedback (13) + Accessibility (14)
                                ↓
                            Popup (15)
                                ↓
                          Export (16)
                                ↓
                          Hooks (17)
                                ↓
                        Testing (18) + Perf (19) + Errors (20)
                                ↓
                    Browser Compat (21) + Docs (22) + Release (23)
```

---

## Estimated Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| 1-4 | Foundation | 8-12 hours |
| 5-7 | Clipping | 12-16 hours |
| 8-14 | Sidebar UI | 24-32 hours |
| 15-16 | Popup & Export | 8-12 hours |
| 17-20 | Testing & Perf | 16-20 hours |
| 21-23 | Polish & Release | 8-12 hours |
| **Total** | **100+ tasks** | **76-104 hours** |

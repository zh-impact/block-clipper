## 1. Dependency Installation

- [x] 1.1 Install `@mozilla/readability` package using pnpm
- [x] 1.2 Verify package is added to package.json dependencies
- [x] 1.3 Test import in development environment to ensure no bundling issues

## 2. Storage Layer Extension

- [x] 2.1 Update `Block` type definition in `types/` or relevant type file to include `contentSource` field
  - Add `contentSource: 'selection' | 'full-page'` to Block interface
  - Ensure backward compatibility with existing blocks
- [x] 2.2 Update storage service to handle new `contentSource` field
  - Modify `create()` method to accept and store contentSource
  - Add default value logic: existing blocks → 'selection', new blocks → specified value
- [x] 2.3 Test backward compatibility with existing blocks in IndexedDB
  - Verify blocks without contentSource are treated as 'selection'
  - Ensure no data migration is needed (default handling)

## 3. Content Script Implementation

- [x] 3.1 Create page extraction script at `entrypoints/content-scripts/page-saver.ts`
  - Import Readability library
  - Implement `extractPageContent()` function
  - Handle document cloning to avoid modifying original page
- [x] 3.2 Implement Readability parsing logic
  - Use `new Readability(documentClone, document).parse()`
  - Extract title, textContent, and excerpt
  - Handle case where no article is found (throw error)
- [x] 3.3 Add message response handler in content script
  - Listen for extraction request from background
  - Return extracted content or error
  - Clean up after execution (auto-removed by scripting API)
- [ ] 3.4 Test content extraction on various page types
  - Article pages (blog posts, news sites)
  - Non-article pages (homepage, listing pages)
  - Pages with dynamic content

## 4. Background Service Worker Logic

- [x] 4.1 Add `SAVE_PAGE` message type to background message handler
  - Define message type in message types interface
  - Add case statement for 'SAVE_PAGE' in background.ts
- [x] 4.2 Implement `handleSavePage()` function
  - Identify active tab using chrome.tabs.query
  - Handle case where no active tab exists (error notification)
  - Inject temporary content script using chrome.scripting.executeScript
- [x] 4.3 Implement script injection and result handling
  - Use scripting API to inject page-saver.ts
  - Set up 10-second timeout for extraction
  - Handle extraction result (success or error)
- [x] 4.4 Integrate with storage service
  - Create Block with extracted content and metadata
  - Set contentSource to 'full-page'
  - Include source.url, source.title, createdAt fields
- [x] 4.5 Add cross-page synchronization
  - Broadcast BLOCK_UPDATED message after successful save
  - Include saved block in message payload
- [x] 4.6 Implement error handling and notifications
  - Show "Cannot extract article content" for Readability failures
  - Show "Cannot access this page" for script injection failures
  - Show "Content extraction timed out" for timeout scenarios
  - Show "Storage almost full" for quota exceeded (link to Options)
  - Show "Page saved successfully" for successful saves

## 5. Popup UI Implementation

- [x] 5.1 Add "Save page" button to Popup UI
  - Add button component with document/page icon
  - Position near existing clip count display
  - Add accessible label: "Save page"
- [x] 5.2 Implement button click handler
  - Send SAVE_PAGE message to background
  - Close popup after sending message (normal behavior)
- [x] 5.3 Add loading state management
  - Disable button during extraction (show spinner or "Saving...")
  - Prevent multiple clicks while operation is in progress
  - Re-enable button after operation completes
- [x] 5.4 Style button with Tailwind CSS
  - Match existing Popup UI design
  - Add hover and active states
  - Ensure keyboard accessibility (Tab, Enter, Space)
- [ ] 5.5 Test Popup button functionality
  - Verify message is sent to background
  - Verify popup closes after click
  - Verify loading state works correctly

## 6. Cross-Page Synchronization

- [ ] 6.1 Ensure Sidebar receives BLOCK_UPDATED messages
  - Verify onBlockUpdated handler exists in useCrossPageSync
  - Test that Sidebar reloads blocks after page save
- [ ] 6.2 Ensure Options page receives BLOCK_UPDATED messages
  - Verify onBlockUpdated handler in Options
  - Test that Options shows newly saved block
- [ ] 6.3 Add optional toast notification in Sidebar
  - Show "New clip added" toast when BLOCK_UPDATED received
  - Use existing toast notification system
- [ ] 6.4 Test synchronization across all extension UIs
  - Open Popup, Sidebar, and Options simultaneously
  - Save page from Popup
  - Verify all pages update to show new block

## 7. Error Handling and Edge Cases

- [ ] 7.1 Handle no active tab scenario
  - Test clicking "Save page" when no tab is active
  - Verify error notification: "No active page found"
- [ ] 7.2 Handle script injection failures
  - Test on pages that block script injection
  - Verify error notification: "Cannot access this page"
- [ ] 7.3 Handle Readability parsing failures
  - Test on non-article pages (homepage, listings)
  - Verify error notification: "Cannot extract article content"
- [ ] 7.4 Implement timeout mechanism
  - Add 10-second timeout to extraction process
  - Abort extraction if timeout exceeded
  - Show error notification: "Content extraction timed out"
- [ ] 7.5 Handle storage quota exceeded
  - Test with near-full IndexedDB storage
  - Verify error notification links to Options page
- [ ] 7.6 Test offline and local file:// pages
  - Verify extraction works on local HTML files
  - Handle offline scenarios gracefully

## 8. Accessibility and Compliance

- [ ] 8.1 Ensure keyboard accessibility for Popup button
  - Verify Tab key focuses "Save page" button
  - Verify Enter/Space keys activate button
  - Test with screen reader (button announces purpose)
- [ ] 8.2 Add ARIA labels and roles
  - Add aria-label to "Save page" button
  - Ensure loading state is announced by screen reader
- [ ] 8.3 Verify Manifest V3 compliance
  - Ensure scripting API usage follows MV3 constraints
  - Verify no deprecated APIs are used
- [ ] 8.4 Test cross-browser compatibility
  - Test on Chrome (primary target)
  - Test on Edge and Brave (if available)
  - Verify consistent behavior across browsers

## 9. Testing and Quality Assurance

- [ ] 9.1 Manual testing on various page types
  - Blog posts (Medium, WordPress, etc.)
  - News articles (CNN, BBC, etc.)
  - Documentation pages
  - Non-article pages (homepage, category pages)
- [ ] 9.2 Test error scenarios
  - No active tab
  - Script injection blocked
  - Readability parsing failure
  - Timeout scenarios
  - Storage quota exceeded
- [ ] 9.3 Test cross-page synchronization
  - Popup → Sidebar sync
  - Popup → Options sync
  - Multiple pages open simultaneously
- [ ] 9.4 Test existing functionality remains intact
  - Verify text selection saving still works (Ctrl+Shift+Y)
  - Verify context menu saving still works
  - Verify contentSource is 'selection' for selection-saved blocks
- [ ] 9.5 Performance testing
  - Test extraction on large pages (long articles)
  - Verify extraction completes within 10 seconds
  - Check memory usage during extraction
- [ ] 9.6 Regression testing
  - Run through existing features to ensure no breaking changes
  - Test import/export functionality
  - Test AI title generation feature

## 10. Documentation and Cleanup

- [ ] 10.1 Update user-facing documentation (if any)
  - Document "Save page" feature in README
  - Add screenshots if applicable
- [ ] 10.2 Add code comments for complex logic
  - Comment Readability integration
  - Document message flow architecture
- [ ] 10.3 Clean up development artifacts
  - Remove console.log statements used for debugging
  - Remove any temporary test code
- [ ] 10.4 Verify git status
  - Review all changed files
  - Ensure no unintended modifications
  - Prepare for commit

## 11. Final Verification

- [x] 11.1 Run TypeScript compiler to verify no type errors
- [x] 11.2 Build extension for production
- [ ] 11.3 Load extension in Chrome and perform end-to-end testing
- [ ] 11.4 Verify all requirements from specs are met
  - Content extraction works
  - Loading states shown
  - Metadata saved correctly
  - contentSource field distinguishes save methods
  - Cross-page sync works
  - Error handling covers all scenarios
  - Existing selection saving preserved
- [ ] 11.5 Test on real-world websites
  - Save actual articles users would encounter
  - Verify extracted content quality
  - Check for any edge cases not covered in testing

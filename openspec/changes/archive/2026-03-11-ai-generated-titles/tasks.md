## 1. Foundation and Utilities

- [x] 1.1 Create `utils/ai/aiTitleGenerator.ts` utility module
- [x] 1.2 Implement `isAIAvailable()` function with caching
- [x] 1.3 Implement `generateAITitle(content: string)` function using Chrome Summarizer API
- [x] 1.4 Add TypeScript types for AI title generation options and result
- [x] 1.5 Implement error handling and logging for AI generation failures

## 2. Content Script Integration

- [x] 2.1 Update Content Script to import AI title generator utilities
- [x] 2.2 Add async title generation call after successful clipping
- [x] 2.3 Implement fallback to metadata extraction on AI failure
- [x] 2.4 Add logic to update saved block with AI-generated title
- [x] 2.5 Handle edge cases (content too long, API errors, etc.)

## 3. Storage Schema Update

- [x] 3.1 Add optional `aiGenerated: boolean` field to Block interface
- [x] 3.2 Update StorageService to handle `aiGenerated` flag in save/update operations
- [x] 3.3 Add method to update block title with AI generation flag
- [x] 3.4 Ensure backward compatibility (existing records without `aiGenerated` field)

## 4. Sidebar UI - AI Features

- [x] 4.1 Create `RegenerateTitleButton` component in Sidebar
- [x] 4.2 Add loading indicator for AI generation in progress
- [x] 4.3 Implement "Regenerate Title" button click handler
- [x] 4.4 Add conditional rendering: show/hide AI features based on API availability
- [x] 4.5 Add success notification when AI title generation completes
- [x] 4.6 Update UI to refresh display when title is updated asynchronously

## 5. Sidebar UI - Title Editing

- [x] 5.1 Ensure AI-generated titles are editable (reuse existing edit functionality)
- [x] 5.2 Update `aiGenerated` flag to false when user manually edits title
- [x] 5.3 Add visual indicator to show which titles are AI-generated
- [ ] 4.4 Handle title edit state changes reactively

## 6. Error Handling and User Experience

- [x] 6.1 Add user-friendly error messages for AI generation failures
- [x] 6.2 Implement silent fallback (no error shown) for automatic generation
- [x] 6.3 Add informational message for first-time model download
- [x] 6.4 Add tooltip/explanation for unsupported browsers
- [x] 6.5 Prevent duplicate generation requests (debounce/throttle)

## 7. Testing

- [ ] 7.1 Test AI title generation in Chrome 138+ with supported hardware
- [ ] 7.2 Test fallback mechanism in unsupported browsers
- [ ] 7.3 Test automatic title generation after clipping
- [ ] 7.4 Test manual title regeneration in Sidebar detail view
- [ ] 7.5 Test editing AI-generated titles
- [ ] 7.6 Test error scenarios (network failure, API unavailable, etc.)
- [ ] 7.7 Test backward compatibility with existing saved blocks

## 8. Documentation

- [x] 8.1 Update README.md with AI title generation feature description
- [x] 8.2 Add hardware and browser requirements documentation
- [x] 8.3 Document the AI title generation workflow
- [x] 8.4 Add usage instructions for "Regenerate Title" feature

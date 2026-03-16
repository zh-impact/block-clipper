# Design Document: Page Saving Feature

## Context

**Background and Current State**

Block Clipper is a browser extension that allows users to save and organize web content. Currently, it only supports:
- Saving user-selected text content via keyboard shortcut (Ctrl+Shift+Y) or right-click context menu
- Manual content selection required

**User Pain Point**
- Users want to save entire articles/blog posts without manually selecting text
- Manual selection is tedious for long-form content
- Need automatic extraction of main content while filtering out navigation, ads, sidebars

**Constraints**
- Pure client-side architecture (no backend)
- Manifest V3 requirements
- Must work across all websites
- Pre-rendering during build (browser APIs unavailable)

## Goals / Non-Goals

**Goals:**
- Add one-click "Save page" functionality in Popup
- Integrate Mozilla Readability for automatic content extraction
- Preserve all existing functionality (selected text saving)
- Store full-page saved content with proper metadata
- Provide clear user feedback during the saving process

**Non-Goals:**
- NO page caching or snapshot (only extract text content)
- NO multi-page batch saving
- NO changes to existing selection-based saving workflow
- NO server-side processing or storage
- NO user authentication required

## Decisions

### 1. Content Extraction: Mozilla Readability

**Decision**: Use `@mozilla/readability` library for content extraction

**Rationale**:
- Battle-tested by Firefox Reader View
- Actively maintained by Mozilla
- Excellent content extraction accuracy
- Built specifically for article/content detection
- Lightweight (~20KB gzipped)

**Alternatives Considered**:
- *Custom DOM parsing*: Too error-prone, high maintenance cost
- *Mercury Parser*: Requires backend, not suitable for client-side only
- *Readability.js*: Similar but less actively maintained

### 2. Execution Location: Background Service Worker

**Decision**: Execute page saving logic in Background Service Worker

**Rationale**:
- Popup closes immediately after user action (can't wait for async operations)
- Background has access to scripting API to inject scripts
- Centralized message handling (consistent with existing architecture)
- More reliable for cross-page operations

**Alternatives Considered**:
- *Content Script Execution*: Popup might close before completion
- *Popup Direct*: Popup lifecycle too short for async operations

### 3. Content Script Injection Strategy

**Decision**: Use scripting API with temporary script injection

**Rationale**:
- Content script needs access to page DOM
- scripting API is already available (manifest permission)
- Clean separation: extraction script injected only when needed
- Avoids persistent content script overhead

**Process**:
1. Background receives `SAVE_PAGE` message from Popup
2. Background injects temporary content script into active tab
3. Content script uses Readability to extract content
4. Content script returns extracted content to Background
5. Background saves content via storage service
6. Temporary script is automatically removed after execution

### 4. Block Model Extension

**Decision**: Add `contentSource` field to distinguish saving method

**Rationale**:
- Minimal change to existing schema
- Clear distinction between selection-saved vs page-saved blocks
- Enables filtering/sorting by save method later
- Backward compatible (existing blocks default to "selection")

**Schema Extension**:
```typescript
interface Block {
  id: string;
  content: string;
  source: {
    title: string;
    url: string;
    contentSource: 'selection' | 'full-page'; // NEW FIELD
  };
  createdAt: string;
  title?: string;
  aiGenerated?: boolean;
}
```

### 5. Message Flow Design

**Decision**: New message type `SAVE_PAGE` with dedicated handler

**Rationale**:
- Consistent with existing message-based architecture
- Clear separation of concerns
- Easy to test and debug

**Message Flow**:
```
Popup → Background → Content Script
  ↓
  SAVE_PAGE message
  ↓
Background injects script → Content Script
  ↓
Content Script extracts DOM → Background
  ↓
Background saves to IndexedDB
  ↓
Background broadcasts to Sidebar/Options
```

### 6. UI/UX: Popup Button Design

**Decision**: Add "Save page" button in Popup with icon

**Design**:
- Button with document/page icon (📄)
- Positioned near existing clip count
- Shows loading state during extraction
- Success/error feedback via notification

**Rationale**:
- Simple and discoverable
- Consistent with existing Popup UI patterns
- Minimal UI changes (Popup is for quick actions)

### 7. Error Handling Strategy

**Decision**: Graceful degradation with user-friendly messages

**Rationale**:
- Web content is highly variable
- Readability may fail on some pages
- Users should understand what went wrong

**Error Scenarios**:
- No active tab → Show error notification
- Readability parsing fails → Show "Cannot extract content" error
- Storage quota exceeded → Show existing quota warning
- Timeout → Show "Extraction timed out" error

## Risks / Trade-offs

### Risk 1: Readability May Fail on Complex Pages

**Risk**: Some pages (SPA, infinite scroll, heavily dynamic) may not extract well

**Mitigation**:
- Provide clear error messages
- Suggest user fall back to manual selection
- Document known limitations

### Risk 2: Content Script Injection May Fail

**Risk**: Some websites block script injection

**Mitigation**:
- Try-catch injection with user notification
- Provide clear error message explaining site restrictions
- Fallback to manual selection workflow

### Risk 3: Performance Impact on Large Pages

**Risk**: DOM parsing may be slow for very large pages

**Mitigation**:
- Add timeout mechanism (10 seconds)
- Show loading indicator during extraction
- Allow cancellation via popup close

### Risk 4: Duplicate Content

**Risk**: User might save same page multiple times

**Mitigation**:
- Add URL-based duplicate detection (optional, future enhancement)
- For now, allow duplicates (user can delete manually)
- Clear timestamp distinguishes saves

### Trade-off: Feature Complexity vs. Simplicity

**Decision**: Prioritize simplicity for MVP

**Trade-offs**:
- ✅ Simple one-click operation
- ✅ No complex settings or options
- ❌ No batch saving (could be added later)
- ❌ No scheduling or automation (not a goal)
- ❌ No content preview before saving (UX acceptable)

## Data Flow Diagram

```
┌─────────┐         ┌──────────┐         ┌──────────────┐
│  Popup  │         │ Background│         │ Content Script│
└────┬────┘         └────┬─────┘         └──────┬───────┘
     │                   │                      │
     │  SAVE_PAGE        │                      │
     ├───────────────────>│                      │
     │                   │                      │
     │                   │  scripting API        │
     │                   │  inject script        │
     │                   ├──────────────────────>│
     │                   │                      │
     │                   │                      │  Readability.parse()
     │                   │                      │  extract main content
     │                   │<─────────────────────┤
     │                   │                      │
     │                   │  extracted content     │
     │                   ├──────────────────────────>│  (storage)
     │                   │                      │
     │                   │                      │  broadcast BLOCK_UPDATED
     │                   │<───────────────────────┘
     │                   │
     │<──────────────────┘
     │
   Show notification
   (success/error)
```

## Migration Plan

### Phase 1: Dependency Installation
```bash
pnpm add @mozilla/readability
```

### Phase 2: Storage Layer Extension
1. Update `Block` interface to include `contentSource` field
2. Update storage service to handle new field
3. Add migration logic for existing blocks (default to 'selection')

### Phase 3: Content Script Logic
1. Create page extraction script in `entrypoints/content-scripts/page-saver.ts`
2. Integrate Readability library
3. Return extracted content to background

### Phase 4: Background Handler
1. Add `SAVE_PAGE` message type to background.ts
2. Implement `handleSavePage()` function
3. Add script injection logic
4. Integrate with storage service

### Phase 5: Popup UI
1. Add "Save page" button to Popup
2. Add loading state management
3. Wire up click handler to send SAVE_PAGE message

### Phase 6: Testing
1. Test on various page types (articles, blogs, news sites)
2. Test error scenarios
3. Verify cross-page sync works

**Rollback Strategy**:
- Feature is additive (no breaking changes)
- Can be disabled by removing button from UI
- No database schema migrations required (new field has default)

## Open Questions

1. **Q**: Should we show a preview of extracted content before saving?
   - **A**: No, keeps it simple. Users can delete if unsatisfied.

2. **Q**: Should we auto-detect and skip duplicate pages?
   - **A**: Not for MVP. Let users manage duplicates manually.

3. **Q**: Should we preserve images or links from content?
   - **A**: Readability already handles this appropriately (keeps relevant links).

4. **Q**: Should we show word count or content length preview?
   - **A**: Not necessary for MVP. Can be added in popup if requested.

5. **Q**: How should we handle pages with infinite scroll?
   - **A**: Readability extracts what's currently visible in DOM. Acceptable for MVP.

## Implementation Notes

### Package Installation
```bash
pnpm add @mozilla/readability
```

### TypeScript Types
```typescript
// Extended Block interface
interface Block {
  // ... existing fields
  contentSource: 'selection' | 'full-page';
}
```

### Content Script Example
```typescript
import { Readability } from '@mozilla/readability/Readability';
import { isProbablyReaderable } from '@mozilla/readability/isProbablyReaderable';

function extractPageContent() {
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone, document).parse();

  if (!article) {
    throw new Error('Cannot extract article content');
  }

  return {
    title: article.title,
    content: article.textContent,
    excerpt: article.excerpt,
    length: article.length
  };
}
```

### Message Types
```typescript
type MessageType =
  | ... // existing types
  | 'SAVE_PAGE'; // NEW

interface SavePageMessage {
  type: 'SAVE_PAGE';
}
```

### IndexedDB Schema
No schema migration needed. New field has default value:

```typescript
// Existing blocks automatically get contentSource: 'selection'
const block: Block = {
  // ... other fields
  contentSource: 'selection' // Default for existing
};

// New blocks saved via "Save page" get contentSource: 'full-page'
const savedBlock: Block = {
  // ... other fields
  contentSource: 'full-page'
};
```

### Success Criteria
- [ ] User can click "Save page" button in Popup
- [ ] Main content is extracted using Readability
- [ ] Content is saved to IndexedDB with contentSource: 'full-page'
- [ ] Loading state shown during extraction
- [ ] Success/error notifications displayed
- [ ] Sidebar/Options updates to show new block
- [ ] Existing selection-based saving still works
- [ ] No breaking changes to existing functionality

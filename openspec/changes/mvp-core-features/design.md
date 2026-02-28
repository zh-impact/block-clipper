# MVP Core Features - Technical Design

## Context

Block Clipper is a browser extension built with WXT (Manifest V3) and React 19. The project currently has only the basic WXT starter template with entrypoints for background scripts, content scripts, popup, and sidebar placeholders.

This design establishes the core technical architecture for:
- Content clipping from web pages (text only in MVP)
- Block-based content model (inspired by Notion/Contentful)
- Unified IndexedDB storage layer
- Sidebar UI for browsing and managing clipped items
- Export to JSON and Markdown formats

### Constraints

- **Manifest V3**: Background scripts run as Service Workers with no persistent state, must handle termination gracefully
- **No server backend**: All data stored locally in browser
- **MV3 permissions**: Need `activeTab`, `storage`, and `scripting` permissions; `<all_urls>` host permissions may concern users
- **IndexedDB limits**: Quota varies by browser (typically 50-60% of available disk space)
- **Performance targets**: Clipping < 500ms, Sidebar load < 1s, support 1000+ items

### Stakeholders

- End users: Researchers, students, knowledge workers who need to capture web content
- Future maintainers: Extension developers building on this architecture

---

## Goals / Non-Goals

**Goals:**

1. Establish extensible Block data model that can grow to support images, video, audio in future versions
2. Create storage abstraction that hides IndexedDB complexity and provides consistent CRUD interface
3. Implement content script that captures selections and converts HTML to Markdown reliably
4. Build Sidebar as primary UI with responsive, accessible, and performant list/detail views
5. Provide export functionality validating the "distribution pipeline" value proposition

**Non-Goals:**

- Image/video/audio capture (deferred to v1.1)
- Floating panel configuration UI (MVP uses sensible defaults)
- Tag system (time permitting in v1.1)
- Third-party storage integration (WebDAV, S3, etc.)
- Hook mechanism for extensibility (v2 consideration)
- Cloud sync or authentication
- Real-time collaboration features

---

## Decisions

### D1: Block Data Model Structure

**Decision:** Use a flat, extensible Block structure with type discriminator pattern.

```typescript
interface Block {
  id: string;                    // UUID v4
  type: BlockType;               // Discriminator: 'text' | 'heading' | 'code' | 'quote' | 'list'
  content: string;               // Primary content (Markdown-formatted)
  metadata: {
    [key: string]: unknown;      // Extensible metadata
  };
  source: {
    url: string;                 // Origin page URL
    title: string;               // Origin page title
    favicon?: string;            // Optional favicon URL
  };
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

**Rationale:**
- Flat structure simplifies IndexedDB queries and indexing
- Type discriminator allows future extension without schema migration
- Extensible metadata supports diverse content types without changing core structure
- Separation of `content` (displayable) and `metadata` (searchable/organizable) enables efficient search

**Alternatives Considered:**
- *Nested block structure (Notion-style)*: Too complex for MVP, adds query complexity
- *Separate tables per content type*: Adds JOIN complexity, harder to query across types
- *Document-based (all content in one field)*: Loses type-specific features (syntax highlighting, etc.)

---

### D2: IndexedDB Schema Design

**Decision:** Single object store `blocks` with compound indexes.

```typescript
// Database: 'block-clipper-db', Version: 1
// Object Store: 'blocks'

// Indexes
- 'by-created': 'createdAt'        // For chronological listing
- 'by-type': 'type'                // For filtering by content type
- 'by-source': 'source.url'        // For finding clips from same origin

// Primary Key
- 'id' (auto-generated UUID)
```

**Rationale:**
- Single store simplifies CRUD operations and queries
- Compound indexes support common query patterns (list by date, filter by type, find by source)
- Using `createdAt` as primary sort order matches user mental model (most recent first)
- Version 1 schema leaves room for migration in future versions

**Migration Strategy:**
```typescript
// Version 1 → Version 2 (example: add tags)
if (oldVersion < 2) {
  const store = transaction.objectStore('blocks');
  store.createIndex('by-tags', 'metadata.tags', { multi: true });
}
```

**Alternatives Considered:**
- *Multiple stores (blocks, metadata, sources)*: Adds transaction overhead, complexity
- *Full-text search index*: Overkill for MVP; browser's native search sufficient for 1000+ items

---

### D3: Storage Abstraction Layer

**Decision:** Create a `StorageService` class providing async CRUD interface with pagination.

```typescript
class StorageService {
  private db: IDBDatabase;

  async create(block: Omit<Block, 'id' | 'createdAt' | 'updatedAt'>): Promise<Block>
  async read(id: string): Promise<Block | null>
  async query(options: QueryOptions): Promise<{ items: Block[], total: number }>
  async update(id: string, updates: Partial<Block>): Promise<Block>
  async delete(id: string): Promise<void>
  async deleteMany(ids: string[]): Promise<number>
  async search(query: SearchQuery): Promise<Block[]>
  async getUsage(): Promise<{ bytes: number, percentage: number }>
}
```

**Rationale:**
- Async/await interface matches modern JavaScript patterns
- Pagination built into `query()` prevents memory issues with large datasets
- `search()` method encapsulates full-text search logic over multiple fields
- Error handling in one place ensures consistent user-facing error messages
- Service class is testable and mockable

**Alternatives Considered:**
- *Direct IndexedDB calls throughout code*: Duplicates logic, harder to test, inconsistent errors
- *Higher-level library (Dexie.js)*: Additional dependency, WXT may have conflicts

---

### D4: HTML to Markdown Conversion Library

**Decision:** Use `turndown` library for HTML → Markdown conversion.

```typescript
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',        // Use # ## ### headings
  codeBlockStyle: 'fenced',   // Use ``` code blocks
  bulletListMarker: '-',       // Use - for lists
});
```

**Rationale:**
- Battle-tested library with 10k+ stars, active maintenance
- Preserves heading hierarchy, links, lists, code blocks
- Configurable rules for custom HTML patterns
- Lightweight (~20KB gzipped)
- Works in browser environment

**Alternatives Considered:**
- *Custom regex-based parser*: Error-prone, hard to maintain, edge cases
- *html-to-markdown*: Less mature, fewer features
- *markdown-it (reverse)*: Designed for MD → HTML, not reverse

---

### D5: Component Architecture for Sidebar

**Decision:** Use React 19 with simple state management (Context + hooks), component co-location.

```
entrypoints/sidebar/
├── App.tsx                    # Root, routing, state providers
├── views/
│   ├── ListView.tsx           # Main list view with search
│   ├── DetailView.tsx         # Single item detail
│   └── EmptyState.tsx         # No clips yet
├── components/
│   ├── ItemCard.tsx           # List item component
│   ├── SearchBar.tsx          # Search input with clear button
│   ├── MarkdownRenderer.tsx   # Safe MD → HTML rendering
│   ├── ConfirmDialog.tsx      # Reusable delete confirmation
│   └── ExportMenu.tsx         # Format selection dropdown
└── hooks/
    ├── useStorage.ts          # Hook for StorageService
    ├── usePagination.ts       # Pagination logic
    └── useKeyboardNav.ts      # Keyboard navigation
```

**Rationale:**
- Component co-location (components with their hooks/styles) improves maintainability
- Context API sufficient for MVP state (no Redux needed)
- Custom hooks encapsulate business logic and improve testability
- Views pattern separates layout from components

**Alternatives Considered:**
- *Redux/Zustand*: Overkill for MVP, adds boilerplate
- *Single-file components*: Harder to navigate as codebase grows
- *Class components*: Less idiomatic in React 19

---

### D6: Content Script Architecture

**Decision:** Content script delegates to background service worker for storage operations.

```typescript
// content.ts - Content Script
chrome.runtime.sendMessage({
  type: 'CLIP_CONTENT',
  payload: { content, metadata }
});

// background.ts - Service Worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLIP_CONTENT') {
    await storageService.create(message.payload);
    chrome.tabs.sendMessage(sender.tab.id, { type: 'CLIP_SUCCESS' });
  }
});
```

**Rationale:**
- Background service worker has persistent access to IndexedDB (content scripts can be terminated)
- Centralized storage logic prevents race conditions
- Message passing is async and non-blocking
- MV3-compliant pattern

**Alternatives Considered:**
- *Direct IndexedDB access from content script*: Risky, content scripts may be terminated mid-operation
- *chrome.storage API*: Limited capacity (10MB), unsuitable for large content

---

### D7: Sidebar vs Popup Responsibilities

**Decision:** Sidebar is primary UI, Popup shows quick status only.

```
Sidebar (Primary):
- Browse and search clips
- View details and delete
- Export functionality
- Keyboard navigation

Popup (Minimal):
- Current clip count
- Quick link to open Sidebar
- Last clipped item preview
- Keyboard shortcut hint
```

**Rationale:**
- Sidebar has more space for list/detail views and better usability
- Popup loads faster for quick status checks
- Clear separation prevents feature duplication
- Popup can be entry point to Sidebar

**Alternatives Considered:**
- *All functionality in Popup*: Too cramped, poor UX for 1000+ items
- *Sidebar only (no Popup)*: No quick status check, harder to discover

---

### D8: Performance Optimization Strategy

**Decision:** Use pagination, virtual scrolling, and debounced search.

```typescript
// Pagination: Load 50 items at a time
const { items, total } = await storage.query({ page: 1, limit: 50 });

// Virtual scrolling: Only render visible items
import { useVirtualizer } from '@tanstack/react-virtual';

// Debounced search: Wait 300ms after user stops typing
const debouncedSearch = useDebounce(searchTerm, 300);
```

**Rationale:**
- Pagination reduces initial load time (50 items vs 1000+)
- Virtual scrolling prevents DOM bloat (only 10-20 items rendered at once)
- Debounced search reduces database hits during typing
- All strategies combine to meet < 1s load target

**Alternatives Considered:**
- *Load all items at once*: Fails performance target with 1000+ items
- *Infinite scroll*: Harder to implement, less predictable than pagination
- *No search debouncing*: Excessive database hits, laggy UX

---

## Data Flow Diagrams

### Clipping Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clipping Flow                            │
└─────────────────────────────────────────────────────────────────┘

  User Action               Content Script              Background
┌─────────────┐          ┌───────────────┐          ┌─────────────┐
│             │          │               │          │             │
│ Select +    │   1.     │ Capture       │  2.      │ Storage     │
| Shortcut    │─────────▶│ selection     │─────────▶│ Service     │
│             │          │ + metadata    │          │ .create()   │
│             │          │               │          │             │
│             │          │ turndown      │          │             │
│             │          │ conversion    │          │             │
└─────────────┘          └───────────────┘          └─────────────┘
                                │                         │
                                │  3. Success             │
                                │  notification           │
                                │◀────────────────────────┘
                                │
                          ┌─────┴─────┐
                          │   Notify  │
                          │   User    │
                          └───────────┘
```

### Storage Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Storage Layer                            │
└─────────────────────────────────────────────────────────────────┘

  Sidebar/Content            StorageService            IndexedDB
┌───────────────┐          ┌──────────────┐         ┌─────────────┐
│               │  CRUD    │              │  IDB    │             │
│   Components  │─────────▶│   Methods    │────────▶│  Database   │
│               │          │              │         │             │
│               │◀─────────│              │◀────────│             │
│               │  Result  │              │  Result │             │
└───────────────┘          └──────────────┘         └─────────────┘
                                  │
                                  │  Events
                                  │  (quota warning)
                                  ▼
                          ┌──────────────┐
                          │   UI Update  │
                          └──────────────┘
```

### Export Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          Export Flow                            │
└─────────────────────────────────────────────────────────────────┘

   Sidebar              ExportService              File System
┌───────────┐         ┌──────────────┐          ┌─────────────┐
│           │   1.    │              │  3.      │             │
│  Select   │────────▶│   Format     │─────────▶│  Download   │
│  Items    │         |   Convert    │          │  Triggered  │
│           │         │              │          │             │
│           │◀────────│              │  2.      │             │
│  Notify   │  4.     │   Generate   │◀─────────│             │
│           │ Success │   File       │  Fetch   │             │
└───────────┘         └──────────────┘          └─────────────┘
```

---

## IndexedDB Schema

### Database Structure

```typescript
// Database Name: 'block-clipper-db'
// Version: 1

interface BlockClipperDB extends IDBDatabase {
  blocks: {
    key: string;
    value: Block;
    indexes: {
      'by-created': string;
      'by-type': BlockType;
      'by-source': string;
    };
  };
}

// Block Type (repeated for clarity)
interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata: Record<string, unknown>;
  source: {
    url: string;
    title: string;
    favicon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

type BlockType = 'text' | 'heading' | 'code' | 'quote' | 'list';
```

### Index Usage

| Index | Query Pattern | Use Case |
|-------|---------------|----------|
| `by-created` | `getAll()` descending | List view (most recent first) |
| `by-type` | `getAll(index: 'by-type')` | Filter by content type |
| `by-source` | `getAll(index: 'by-source')` | Find all clips from same URL |

### Transaction Handling

```typescript
// All write operations use readwrite transactions
const tx = db.transaction(['blocks'], 'readwrite');
const store = tx.objectStore('blocks');

// Read operations use readonly transactions (concurrent)
const tx = db.transaction(['blocks'], 'readonly');
```

---

## Component Structure

### EntryPoints

```
entrypoints/
├── background.ts              # Service worker
├── content.ts                 # Content script
├── popup/
│   └── App.tsx                # Minimal status popup
└── sidebar/
    ├── App.tsx                # Root with routing
    ├── main.tsx               # Entry point
    └── index.css              # Global styles
```

### Shared Utilities

```
utils/
├── block-model.ts            # Block types and factory functions
├── storage/
│   ├── StorageService.ts     # IndexedDB wrapper
│   └── migrations.ts         # DB version migrations
├── converter.ts              # HTML → Markdown (turndown wrapper)
├── exporter.ts               # JSON/MD export logic
└── constants.ts              # Shared constants (DB name, version, etc.)
```

### Types

```typescript
// utils/block-model.ts
export type BlockType = 'text' | 'heading' | 'code' | 'quote' | 'list';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata: Record<string, unknown>;
  source: BlockSource;
  createdAt: string;  // ISO 8601
  updatedAt: string;  // ISO 8601
}

export interface BlockSource {
  url: string;
  title: string;
  favicon?: string;
}

export interface CreateBlockInput {
  type: BlockType;
  content: string;
  metadata?: Record<string, unknown>;
  source: BlockSource;
}
```

---

## MV3 Constraints & Mitigations

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Service Worker termination | Cannot hold state in memory | All state in IndexedDB, re-initialize on wake |
| No `eval()` or `<script>` tags | Cannot execute arbitrary code | Use React JSX compiled at build time |
| CSP restrictions | No inline scripts/styles | All JS/CSS in separate files |
| `chrome.storage` API limits | Only 10MB for `storage.local` | Use IndexedDB for data, `chrome.storage` for settings only |
| Host permissions | Users concerned about privacy | Request `activeTab` only, explain permissions in install flow |

---

## Risks / Trade-offs

### R1: IndexedDB Quota Exhaustion

**Risk:** Users accumulate large amounts of data, hitting browser quota limits.

**Mitigation:**
- Monitor storage usage (`navigator.storage.estimate()`)
- Emit warning event at 80% quota
- Prompt user to export or clean up old items
- Show storage usage in Sidebar settings

### R2: HTML → Markdown Conversion Quality

**Risk:** Poor conversion produces unreadable Markdown, frustrating users.

**Mitigation:**
- Use mature library (`turndown`) with extensive test coverage
- Add custom rules for edge cases discovered in testing
- Provide "edit before save" option in future version
- Show preview of converted content before saving

### R3: Sidebar Performance with Large Datasets

**Risk:** 1000+ items cause Sidebar to lag or freeze.

**Mitigation:**
- Pagination (50 items per page)
- Virtual scrolling (render only visible items)
- Debounced search (300ms delay)
- Performance testing with synthetic data

### R4: Cross-Origin iframe Limitations

**Risk:** Content script cannot access selections within iframes from different origins.

**Mitigation:**
- MVP accepts this limitation
- Document in user guide
- Future version may use `all_frames` permission with caution

### R5: Firefox Sidebar API Differences

**Risk:** Firefox's `sidebar_action` API differs from Chrome's `sidePanel`.

**Mitigation:**
- Use WXT's browser-agnostic APIs where possible
- Test on both Chrome and Firefox
- Provide fallback to Popup if Sidebar not available
- Document browser differences

### R6: Service Worker Race Conditions

**Risk:** Multiple rapid clips may cause race conditions in storage.

**Mitigation:**
- Use IndexedDB transactions (atomic operations)
- Generate UUIDs in content script before sending
- Queue operations if service worker is busy
- Add retry logic for failed operations

---

## Open Questions

1. **Search algorithm**: Should search prioritize title matches over content matches? Need user research.

2. **Keyboard shortcuts**: What default shortcut for clipping? Need to check for conflicts with common extensions.

3. **Export format for Markdown**: Should we use YAML frontmatter or a different metadata format? Need to test with popular knowledge base tools.

4. **Block type detection**: How to automatically detect if selection is code vs text? May use `<code>` tag presence, syntax analysis, or manual user selection.

5. **Sidebar persistence**: Should Sidebar remember scroll position and selected item across sessions? Implementation complexity vs user value unclear.

---

## Migration Plan

### Phase 1: Foundation (Week 1)
- Set up project structure (directories, entry points)
- Implement Block data model and types
- Create StorageService with IndexedDB integration
- Write migration system

### Phase 2: Clipping (Week 1-2)
- Implement content script with selection capture
- Integrate turndown for HTML → Markdown
- Add keyboard shortcut and context menu
- Connect to StorageService via background script

### Phase 3: Sidebar UI (Week 2)
- Build ListView with search and pagination
- Implement DetailView with Markdown rendering
- Add delete functionality with confirmation
- Keyboard navigation

### Phase 4: Export (Week 3)
- Implement JSON export
- Implement Markdown export with YAML frontmatter
- Add export UI in Sidebar
- Batch export with selection mode

### Phase 5: Polish (Week 3-4)
- Performance testing and optimization
- Error handling and user notifications
- Browser testing (Chrome, Firefox, Edge)
- Documentation (README, user guide)

### Rollback Strategy

No server-side changes mean rollback is simple:
- Extension can be uninstalled without data loss (data remains in browser's IndexedDB)
- Export functionality allows users to backup before uninstall
- Previous version can be installed if needed (IndexedDB migrations handle version downgrades)

---

## Testing Strategy

### Unit Tests (Vitest)
- Block model factory functions
- StorageService CRUD operations
- HTML → Markdown conversion
- Export formatters

### Integration Tests
- End-to-end clipping flow
- Sidebar UI interactions
- Export functionality

### Manual Testing Checklist
- [ ] Clip from various websites (news, blogs, docs)
- [ ] Test with 1000+ items in database
- [ ] Export and verify JSON/Markdown formats
- [ ] Test keyboard shortcuts don't conflict
- [ ] Verify IndexedDB migrations
- [ ] Test on Chrome, Firefox, Edge
- [ ] Test with private/incognito mode
- [ ] Verify CSP compliance

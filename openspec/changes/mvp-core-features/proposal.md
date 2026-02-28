# MVP Core Features: Block-based Content Clipping

## Why

Existing content clipping tools have significant limitations: most only support plain text or full-page saving, lock data in closed ecosystems making integration difficult, and lack flexible distribution options to external knowledge bases. This change implements the foundation of an open clipping tool with a unified block-based content model (inspired by Notion/Contentful) and flexible export capabilities, validating the core value proposition of "knowledge hub frontend + content distribution pipeline."

## What Changes

- **Block-based Content Model**: Implement unified content abstraction using block-based structure that can represent various content types (text, headings, lists, code blocks, quotes, etc.) with extensible metadata
- **Unified Storage Layer**: Create IndexedDB-based storage with CRUD abstraction layer, hiding complexity and providing consistent interface
- **Content Clipping**: Add content script to capture user-selected content from web pages with HTML to Markdown conversion
- **Trigger Mechanisms**: Implement keyboard shortcut binding and context menu integration for quick clipping access
- **Sidebar UI**: Build main interface for browsing, searching, viewing details, and deleting clipped items
- **Simplified Popup**: Reduce popup to quick status display only (main functionality moved to sidebar)
- **Export Functionality**: Implement export to JSON and Markdown formats, validating the "distribution pipeline" value

## Capabilities

### New Capabilities

- `content-clipping`: Capture selected content from web pages, convert HTML to Markdown, and extract metadata (URL, title, timestamp)

- `block-storage`: Unified IndexedDB storage layer providing CRUD operations for block-based content model with extensible metadata support

- `sidebar-ui`: Browse clipped items with list view, search functionality, detail view, and delete operations

- `content-export`: Export clipped items to JSON (for data portability) and Markdown (for integration with knowledge bases)

### Modified Capabilities

None - this is the initial implementation establishing core capabilities.

## Impact

### New EntryPoints
- `entrypoints/sidebar/` - Main UI for browsing and managing clipped items
- `entrypoints/content/` - Content script for capturing web page content

### Modified EntryPoints
- `entrypoints/background.ts` - Add storage layer integration
- `entrypoints/popup/` - Simplify to status display only

### New Utilities
- `utils/block-model.ts` - Block data structure definitions and type definitions
- `utils/db/` - Unified storage abstraction over IndexedDB
- `utils/converter.ts` - HTML to Markdown conversion utilities

### Dependencies
- HTML to Markdown conversion library (e.g., turndown)
- IndexedDB wrapper or native IndexedDB API

### Configuration Changes
- `wxt.config.ts` - Add sidebar configuration
- Manifest permissions - Add activeTab, storage, and scripting permissions

## Success Criteria

MVP is considered successful when users can:

1. **Clip Content**: Select content on any webpage → Press shortcut (or use context menu) → Content saved with metadata (URL, title, timestamp) in under 500ms

2. **Manage Items**: Open sidebar to view clipping history, search/filter by keywords, view item details, and delete unwanted entries

3. **Export Data**: Select single or multiple items → Export as JSON or Markdown → Files are usable by other tools

4. **Performance**: Sidebar loads in under 1 second; system supports 1000+ entries without performance degradation

## Non-Goals

- Image/video/audio support (deferred to v1.1)
- Cloud sync or remote storage integration
- User authentication system
- Real-time collaboration features
- Floating panel configuration UI (MVP uses sensible defaults)
- Third-party storage (WebDAV, S3, etc.)
- Hook mechanism for extensibility (considered for v2)
- Tag system (optional, time permitting)
- Batch operations beyond export
- Import functionality from other tools

## Context

Block Clipper currently supports file-based export and (newly added) file-based import. The next enhancement expands transfer channels to clipboard for both import/export and aligns export UI across side panel and options page.

This change spans shared data utilities and two UI surfaces, and must handle browser clipboard constraints (secure context, permission failures, user gesture requirements).

## Goals / Non-Goals

**Goals:**
- Add clipboard export path using same JSON contract as file export.
- Add clipboard import path using same validation/dedup pipeline as file import.
- Expose export UI in both side panel and options page.
- Keep error feedback consistent across file/clipboard channels.

**Non-Goals:**
- Third-party format support.
- Popup full import/export workflow.
- Cloud sync or cross-device clipboard transport.
- Advanced merge conflict resolution.

## Decisions

### D1: Single transfer contract for file and clipboard

Both file export and clipboard export produce the same JSON string. File import and clipboard import consume the same parser/validator/normalizer.

**Rationale:** prevents channel-specific drift and simplifies testing.

### D2: Add clipboard helpers in shared utility layer

Introduce utility functions:
- `copyExportToClipboard(content: string)`
- `readImportFromClipboard()`

These wrap `navigator.clipboard` and normalize errors into user-friendly messages.

**Alternative considered:** direct clipboard calls inside each UI component. Rejected due to duplication and inconsistent error handling.

### D3: Reuse existing import pipeline for clipboard input

Clipboard import text is routed through the same `runImportFlow` and `StorageService.importRecords` path as file import.

**Rationale:** dedup/validation behavior stays identical and verifiable.

### D4: Export UI responsibilities in side panel and options page

- **Side panel:** keep quick actions (export file / export clipboard / import file / import clipboard).
- **Options page:** add equivalent export actions for parity.
- **Popup:** remains lightweight (no full workflow).

### D5: IndexedDB schema unchanged

No schema migration required.

**IndexedDB Schema**
- Database: `block-clipper-db`
- Version: `1`
- Store: `blocks`
- Indexes: `by-created`, `by-type`, `by-source`

### Data Flow

```text
Export (file): query blocks -> serialize JSON -> download
Export (clipboard): query blocks -> serialize JSON -> clipboard.writeText

Import (file): file.text -> parse/validate -> dedup/import -> summary -> refresh
Import (clipboard): clipboard.readText -> parse/validate -> dedup/import -> summary -> refresh
```

### MV3/Browser Constraints

- Clipboard read/write may fail without user gesture or permission.
- Options page and side panel run in extension context but still need robust fallback messaging.

## Risks / Trade-offs

- **[Risk] Clipboard API denied/unavailable** → **Mitigation:** explicit error feedback + suggest file path fallback.
- **[Risk] Clipboard content not JSON** → **Mitigation:** reuse strict parser and show actionable parse errors.
- **[Risk] UI inconsistency across options/panel** → **Mitigation:** shared messaging and action naming.
- **[Trade-off] Clipboard payload size can be large** → **Mitigation:** keep existing import size guard and warn users.

## Migration Plan

1. Add shared clipboard utility wrappers.
2. Wire export-to-clipboard in side panel and options page.
3. Wire import-from-clipboard in side panel (and options if selected later) using existing import pipeline.
4. Add tests for clipboard success/failure and channel parity.
5. Validate manual roundtrip (export->clipboard->import).

Rollback:
- Remove clipboard actions while leaving file import/export paths intact.
- No storage migration rollback needed.

## Open Questions

1. Should options page also include clipboard import in this iteration or export-only parity first?
2. Do we cap clipboard export size with warning before copy?
3. Should copied JSON include optional metadata marker for easier support diagnostics?

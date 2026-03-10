## Context

Block Clipper already supports export (JSON/Markdown) but cannot restore exported data back into local IndexedDB. This creates a one-way data pipeline and makes migration/recovery difficult. Stage-1 import will only accept Block Clipper’s own JSON export format and import it into local storage with validation, deduplication, and result reporting.

Current architecture provides:
- Storage abstraction via `StorageService`
- Block schema with UUID-based records
- Side panel + options-style management UI

Import affects UI + parsing + storage transaction flow, so a design artifact is needed.

## Goals / Non-Goals

**Goals:**
- Add a user-facing import entry in management UI.
- Parse and validate Block Clipper export JSON safely.
- Import valid records into IndexedDB with duplicate skipping.
- Provide deterministic import report: imported / skipped / failed.
- Keep implementation local-only with no backend and no new remote dependency.

**Non-Goals:**
- Third-party format import (Notion/Readwise/CSV/ZIP).
- Conflict merge UI or field-level reconciliation.
- Streaming/huge-file optimization beyond normal JSON load.
- Cloud sync and cross-device auto-merge.

## Decisions

### D1: Import source contract is Block Clipper JSON export only

Import accepts JSON matching current exported shape:
- array of entries
- each entry includes `type`, `content`, `source`, `createdAt` (and optional metadata-compatible fields)

Rejected files return explicit validation errors.

**Why:** minimizes ambiguity and prevents malformed/hostile input entering storage.

### D2: Import workflow lives in UI surface + storage utility layer

- UI (sidepanel/options) handles file pick, trigger, and result display.
- Utility/import service handles parse/validate/normalize.
- `StorageService` handles persistence and dedupe checks.

**Why:** clear separation of concerns and testability.

### D3: Dedup strategy = keep existing, skip duplicates

Duplicate rule for stage-1:
- Duplicate if same `content` + same `source.url` + near-equal `createdAt` (exact timestamp match after normalization).

Duplicates are skipped and counted; no overwrite.

**Why:** safe default that avoids accidental data mutation.

### D4: Batch import with bounded async processing

Import processes records in bounded batches (e.g., 50) to avoid UI freeze and long single transactions.

**Why:** balances performance and reliability in MV3/browser environments.

### D5: IndexedDB schema remains unchanged

No migration required. Imported records map into existing `blocks` store.

**IndexedDB Schema**
- DB: `block-clipper-db` (v1)
- Store: `blocks`
- Key: `id`
- Indexes: `by-created`, `by-type`, `by-source`

Imported records get generated IDs when missing and normalized timestamps.

### D6: Sidebar vs Popup responsibilities

- **Sidebar/Options:** full import operation + report UI.
- **Popup:** no import workflow (kept lightweight).

**Why:** import needs space for file selection, progress, and result details.

### Data Flow

```text
User selects JSON file
  -> UI reads file (FileReader)
  -> Import parser validates schema
  -> Records normalized
  -> Dedup check against storage
  -> Batch write via StorageService
  -> Result summary (imported/skipped/failed)
  -> UI refresh list
```

### MV3 Considerations

- Keep heavy parsing in foreground UI context (not service worker long-lived tasks).
- Avoid dependence on background persistence state.
- Explicit error messaging for user recovery.

## Risks / Trade-offs

- **[Risk] Corrupted/invalid JSON** → **Mitigation:** strict validation + fail-fast with line-level reason when possible.
- **[Risk] Large file causes memory pressure** → **Mitigation:** size guard + user warning + batch processing.
- **[Risk] False dedup matches** → **Mitigation:** conservative duplicate key (content + source + timestamp) and skip-only policy.
- **[Trade-off] Skip-only dedup may keep stale duplicates with tiny differences** → acceptable for stage-1 simplicity.

## Migration Plan

1. Add import parser/validator utility and result model.
2. Add storage import helper (dedup + batch create).
3. Add UI entry + file picker + import report display.
4. Add tests for validation, dedup, and error paths.
5. Validate with real exported file roundtrip.

Rollback:
- Remove import UI and utility; no schema rollback required.
- Existing export and clip data remain unaffected.

## Open Questions

1. Should stage-1 impose a hard max file size (e.g., 10MB) or only warn?
2. Should imported entries preserve original `createdAt` always, or fallback to import time if invalid?
3. Should import be available in sidepanel, options page, or both in stage-1?

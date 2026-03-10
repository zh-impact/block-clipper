## 1. Import Contract & Parsing Foundation

- [x] 1.1 Define stage-1 import data contract based on current JSON export shape (depends on: none)
- [x] 1.2 Implement JSON file parsing and schema validation utility with structured error reasons (depends on: 1.1)
- [x] 1.3 Implement normalization utility for timestamps/metadata defaults before persistence (depends on: 1.2)

## 2. Storage Import Pipeline

- [x] 2.1 Add dedup helper in storage layer using stage-1 duplicate criteria (content + source.url + createdAt) (depends on: 1.3)
- [x] 2.2 Implement batch import write flow with imported/skipped/failed counters (depends on: 2.1)
- [x] 2.3 Ensure import flow preserves existing data on partial failures and returns deterministic summary model (depends on: 2.2)

## 3. UI Integration

- [x] 3.1 Add import entry UI (file picker + trigger action) in selected management surface (depends on: 2.3)
- [x] 3.2 Wire import action to parser + storage pipeline and refresh list view after success (depends on: 3.1)
- [x] 3.3 Add import result feedback UI for imported/skipped/failed counts and key error messages (depends on: 3.2)

## 4. Error Handling & Safeguards

- [x] 4.1 Add invalid-file and non-JSON handling with actionable user messages (depends on: 3.2)
- [x] 4.2 Add guard for oversized file behavior (warn/limit per implementation decision) (depends on: 3.2)
- [x] 4.3 Verify duplicate records are skipped without overwriting existing entries (depends on: 2.2, 3.2)

## 5. Testing & Validation

- [x] 5.1 Add unit tests for import parser/validator and normalization logic (depends on: 1.3)
- [x] 5.2 Add unit/integration tests for dedup + batch import result accounting (depends on: 2.3)
- [x] 5.3 Add UI-level tests for import success, invalid file, and partial failure paths (depends on: 3.3, 4.1)
- [x] 5.4 Run validators (`pnpm run compile`, `pnpm run test:run`) and fix regressions (depends on: 5.1, 5.2, 5.3)
- [x] 5.5 Manual roundtrip check: export data -> import same file -> confirm imported/skipped behavior and UI refresh (depends on: 5.4)

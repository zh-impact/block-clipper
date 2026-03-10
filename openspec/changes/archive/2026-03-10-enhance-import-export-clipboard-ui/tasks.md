## 1. Clipboard Export Foundation

- [x] 1.1 Add shared clipboard export helper with normalized success/failure responses (depends on: none)
- [x] 1.2 Reuse existing export serializer to guarantee file/clipboard JSON contract parity (depends on: 1.1)
- [x] 1.3 Add export-to-clipboard action wiring in side panel (depends on: 1.2)

## 2. Clipboard Import Foundation

- [x] 2.1 Add shared clipboard import reader helper with permission/unavailable handling (depends on: none)
- [x] 2.2 Route clipboard text into existing import parser/validator/dedup pipeline (depends on: 2.1)
- [x] 2.3 Ensure clipboard import uses same summary model as file import (imported/skipped/failed/errors) (depends on: 2.2)

## 3. UI Enhancements Across Surfaces

- [x] 3.1 Update side panel UI to expose both export channels (file + clipboard) with consistent labels (depends on: 1.3)
- [x] 3.2 Update side panel UI to expose import from clipboard action and feedback (depends on: 2.3)
- [x] 3.3 Add export UI parity in options page for file + clipboard export (depends on: 1.2)

## 4. Error Handling and UX Consistency

- [x] 4.1 Add actionable messages for clipboard write failure and clipboard read failure (depends on: 1.1, 2.1)
- [x] 4.2 Ensure invalid clipboard JSON follows same validation errors as file import (depends on: 2.2)
- [x] 4.3 Add oversized payload guard/warning behavior consistency for clipboard-import path (depends on: 2.2)

## 5. Testing and Validation

- [x] 5.1 Add unit tests for clipboard helper success/failure branches (depends on: 1.1, 2.1)
- [x] 5.2 Add tests for file vs clipboard export contract equivalence (depends on: 1.2)
- [x] 5.3 Add UI-level tests for side panel and options export actions (depends on: 3.1, 3.3)
- [x] 5.4 Add UI/import-flow tests for clipboard import valid/invalid scenarios (depends on: 3.2, 4.2)
- [x] 5.5 Run validators (`pnpm run compile`, `pnpm run test:run`) and fix regressions (depends on: 5.1, 5.2, 5.3, 5.4)
- [x] 5.6 Manual roundtrip: export to clipboard -> import from clipboard -> verify counts, dedup behavior, and UI feedback (depends on: 5.5)

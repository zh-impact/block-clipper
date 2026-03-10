## 1. Options React Entrypoint Migration

- [x] 1.1 Create React-based options entrypoint (`entrypoints/options/main.tsx`, `App.tsx`) and wire it to options page shell (depends on: none)
- [x] 1.2 Move options page initialization flow from imperative script into React lifecycle-safe hooks (depends on: 1.1)
- [x] 1.3 Keep MV3-safe browser API access (clipboard/indexedDB only on interaction/runtime) and remove pre-render unsafe access paths (depends on: 1.2)

## 2. Core Clip Management UI Parity

- [x] 2.1 Implement React list view with search, clip cards, and empty/loading/error states (depends on: 1.2)
- [x] 2.2 Implement React detail view with back navigation and delete action parity (depends on: 2.1)
- [x] 2.3 Integrate storage query/refresh/delete flows via existing storage abstraction without schema changes (depends on: 2.1, 2.2)

## 3. Import/Export Flow Unification

- [x] 3.1 Implement standard mode controls for channel + format selection (file/clipboard + JSON/Markdown) (depends on: 1.2)
- [x] 3.2 Connect export actions to shared exporter/clipboard utilities for file and clipboard channels (depends on: 3.1)
- [x] 3.3 Connect import actions to shared importer pipeline and summary reporting for file and clipboard channels (depends on: 3.1)

## 4. Compact Mode and Icon Semantics

- [x] 4.1 Implement compact mode toggle that collapses controls to quick actions and defaults transfer format to JSON (depends on: 3.1)
- [x] 4.2 Apply semantic transfer icon mapping with `@tabler/icons-react` (file actions vs clipboard actions) across options React UI (depends on: 4.1)
- [x] 4.3 Ensure compact and standard mode behavior/messages stay consistent with sidepanel interaction expectations (depends on: 4.1, 4.2)

## 5. Cleanup, Tests, and Validation

- [x] 5.1 Remove or minimize legacy `public/options.js` runtime logic after React migration is fully wired (depends on: 2.3, 3.3, 4.3)
- [x] 5.2 Add/update tests covering options React behaviors and import/export channel+format combinations (depends on: 5.1)
- [x] 5.3 Run validators (`pnpm run compile`, `pnpm run test:run`) and fix regressions (depends on: 5.2)

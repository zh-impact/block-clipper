## 1. Message Contracts & Trigger Wiring

- [x] 1.1 Add visual-selector message types in popup/background/content contracts (`OPEN_VISUAL_SELECTOR`, `START_VISUAL_SELECTOR`) (depends on: none)
- [x] 1.2 Update background routing to prepare active tab content script then forward selector-start signal (depends on: 1.1)
- [x] 1.3 Add popup visual-selector entry and launch action with failure feedback (depends on: 1.1)

## 2. Content Script Selector Mode Core

- [x] 2.1 Implement selector mode lifecycle (enter/exit, singleton guard, cleanup listeners) (depends on: 1.2)
- [x] 2.2 Implement hover hit-testing with auto-best candidate heuristic and overlay-ignore rules (depends on: 2.1)
- [x] 2.3 Implement highlight overlay rendering with performant update loop (rAF throttle) (depends on: 2.2)
- [x] 2.4 Implement click-to-freeze candidate behavior and transition to preview state (depends on: 2.3)

## 3. Preview Confirm & Pure Text Extraction

- [x] 3.1 Implement selected-node visible text extraction and normalization utility (depends on: 2.4)
- [x] 3.2 Implement in-page preview modal with Confirm/Cancel actions (depends on: 3.1)
- [x] 3.3 Block empty/whitespace-only text saves with actionable error notification (depends on: 3.1, 3.2)
- [x] 3.4 On confirm, submit through existing `CLIP_CONTENT` pipeline with `captureMode` metadata (depends on: 3.2)

## 4. Persistence, Exit Behavior, and UX Hardening

- [x] 4.1 Ensure success/failure responses produce correct notifications and deterministic selector teardown (depends on: 3.4)
- [x] 4.2 Ensure cancel path always exits cleanly and restores page interaction (depends on: 3.2)
- [x] 4.3 Add keyboard escape handling to exit selector mode safely (depends on: 2.1)

## 5. Testing & Validation

- [x] 5.1 Add/extend unit tests for candidate selection heuristic and text extraction normalization (depends on: 2.2, 3.1)
- [x] 5.2 Add/extend unit tests for selector lifecycle and message handling happy/error paths (depends on: 1.2, 4.1)
- [x] 5.3 Run project validators (`pnpm run test:run`; run compile command used by repo) and fix failures related to this change (depends on: 5.1, 5.2)
- [x] 5.4 Execute manual flow check: popup trigger -> hover highlight -> click preview -> confirm save -> clip visible in side panel/options (depends on: 4.2, 5.3)

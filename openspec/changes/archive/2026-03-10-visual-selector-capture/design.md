## Context

Block Clipper currently clips only pre-selected text (keyboard shortcut / context menu). This change adds a visual element-picker flow triggered from Popup, similar to uBlock's picker interaction: hover to auto-highlight a candidate region, click to pick, preview extracted text, then confirm save.

Current architecture already supports content capture and storage through `content.ts -> background.ts -> StorageService`. The new feature must reuse this path, keep Manifest V3 constraints in mind, and avoid adding new dependencies.

### Constraints

- MV3 service worker may suspend; stateful picker session must live in content script, not background.
- Existing popup is lightweight and should remain a trigger surface, not a full workflow UI.
- First version handles pure text only: selected node visible text only.
- Must not affect existing keyboard/context-menu clipping behavior.

## Goals / Non-Goals

**Goals:**
- Add Popup-only entry to start visual selector mode on current page.
- Provide hover-based "auto best" highlight and click-to-select behavior.
- Show confirm preview before saving.
- Reuse existing clip persistence pipeline and metadata extraction.
- Keep implementation dependency-free and testable.

**Non-Goals:**
- Nested candidate cycling or manual depth controls.
- Side panel entry for starting picker mode.
- Rich content reconstruction (Markdown structure fidelity, image/code block handling).
- Server-side processing or sync.

## Decisions

### D1: Picker session runs in content script with overlay layer

Implement a lightweight overlay/controller in `entrypoints/content.ts`:
- listens for `START_VISUAL_SELECTOR` message
- tracks pointer movement
- computes current "best" candidate element
- draws highlight box
- handles click to finalize candidate and open preview modal

**Rationale:** DOM hit-testing and visual feedback are page-local concerns and must stay in content script.

**Alternatives considered:**
- Background-driven DOM logic: impossible because service worker has no page DOM access.
- Injecting a separate UI framework: unnecessary complexity for MVP.

### D2: Popup triggers mode via background relay

Popup sends `OPEN_VISUAL_SELECTOR` to background, background ensures content script readiness (reuse existing injection helper) and forwards `START_VISUAL_SELECTOR` to active tab.

**Rationale:** keeps permissions/message routing centralized and consistent with existing clipping triggers.

**Alternatives considered:**
- Popup sending directly to tab without background coordination: weaker reliability when content script not ready.

### D3: Candidate selection heuristic = "auto best only"

On hover, start from `event.target` and climb ancestors until finding first block-like container satisfying heuristics:
- visible (non-zero client rect, not hidden)
- meaningful text length threshold
- not inside extension overlay
- prefer semantic containers (`article`, `section`, `main`, `p`, `li`, `blockquote`, etc.)

No user cycling between nested candidates in this phase.

**Rationale:** matches requested behavior with minimal interaction cost.

**Alternatives considered:**
- Nested cycling UI: more discoverability, but out of MVP scope.

### D4: Text extraction rule = selected node visible text only

After click, extract using selected node text representation only (node `innerText`-based visible text normalization), trim whitespace, collapse excessive blank lines, and preview before save.

**Rationale:** aligned with confirmed requirement and reduces unexpected capture scope.

**Alternatives considered:**
- Include descendant semantic enrichment/headings: higher ambiguity and inconsistent outputs.

### D5: Confirmation modal in-page before persistence

Show small modal attached to overlay with:
- preview text (truncated viewport with scroll)
- Confirm / Cancel actions

Confirm sends `CLIP_CONTENT` with `type: 'text'`, plain text content, metadata flag `{ captureMode: 'visual-selector' }`.

**Rationale:** avoids accidental saves and satisfies explicit requirement.

### D6: Responsibilities split (Popup vs Sidebar)

- **Popup responsibility**: start visual selector mode only.
- **Sidebar responsibility**: unchanged (browse/search/manage existing clips).

**Rationale:** preserves existing product surface boundaries.

## Data Flow

```text
Popup(App) -> runtime message OPEN_VISUAL_SELECTOR
          -> Background ensures content script ready
          -> Background -> tab message START_VISUAL_SELECTOR
          -> Content Script enters picker mode
             [hover] compute candidate + render highlight
             [click] freeze candidate + extract visible text
             [preview confirm] send CLIP_CONTENT to Background
          -> Background persists via StorageService.create
          -> Background returns CLIP_SUCCESS / CLIP_ERROR
          -> Content Script shows user notification and exits picker mode
```

## IndexedDB Schema Impact

No schema migration required.

- Database: `block-clipper-db` (version 1)
- Store: `blocks`
- Existing indexes remain unchanged (`by-created`, `by-type`, `by-source`)
- New clips use existing `Block` model with optional metadata extension:
  - `metadata.captureMode = 'visual-selector'`

## Risks / Trade-offs

- **[Risk] Overlay conflicts with site CSS/z-index** -> **Mitigation:** isolate overlay class names, high z-index, minimal style surface, pointer-event control.
- **[Risk] Wrong auto-selected region on complex DOM** -> **Mitigation:** conservative heuristics, minimum text-length checks, easy cancel path.
- **[Risk] Performance jitter on mousemove** -> **Mitigation:** throttle hover processing with `requestAnimationFrame`.
- **[Risk] Inconsistent visible text extraction across sites** -> **Mitigation:** rely on `innerText` normalization and add targeted tests for representative DOM structures.
- **[Trade-off] No nested candidate cycling** -> simpler UX/implementation now, less precision for edge pages.

## Migration Plan

1. Add message types and routing for visual selector trigger (popup/background/content).
2. Implement picker controller and overlay lifecycle in content script.
3. Implement preview-confirm step and persistence call.
4. Add popup trigger button and minimal UI state (launch/failure feedback).
5. Add tests for candidate selection, extraction, and message flow.
6. Validate with manual scenarios on article/documentation/news pages.

Rollback:
- Remove popup trigger and message routing.
- Disable picker mode handler in content script.
- Existing clipping paths remain unaffected and data schema unchanged.

## Open Questions

1. Should ESC key always cancel picker mode globally, including when preview is open?
2. What is the minimum acceptable text length threshold for candidate auto-selection?
3. Should the saved content include lightweight source context prefix (e.g., selected element tag) in metadata now or later?

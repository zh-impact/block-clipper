## 1. Tailwind Infrastructure Setup

- [x] 1.1 Add Tailwind CSS toolchain dependencies (`tailwindcss`, `postcss`, `autoprefixer`) and initialize config files (depends on: none)
- [x] 1.2 Configure Tailwind content scanning paths for all extension entrypoints and shared components (depends on: 1.1)
- [x] 1.3 Wire Tailwind base stylesheet into WXT/Vite build pipeline and verify MV3 build output loads styles correctly (depends on: 1.2)

## 2. Options-page Style Migration

- [x] 2.1 Replace existing options-page layout/container/typography classes with Tailwind utility classes (depends on: 1.3)
- [x] 2.2 Migrate transfer controls, density mode styles, and feedback states to Tailwind while preserving behavior (depends on: 2.1)
- [x] 2.3 Remove obsolete options-page legacy style declarations after Tailwind parity is confirmed (depends on: 2.2)

## 3. Popup and Sidepanel Style Migration

- [x] 3.1 Refactor popup page styles to Tailwind classes and preserve current interaction affordances (depends on: 1.3)
- [x] 3.2 Refactor sidepanel styles to Tailwind classes for list/detail/search/toolbar states (depends on: 1.3)
- [x] 3.3 Ensure file vs clipboard transfer action visual semantics remain clear after migration (depends on: 3.1, 3.2)

## 4. Cleanup and Consistency

- [x] 4.1 Remove or reduce redundant inline `<style>` blocks and duplicated CSS files replaced by Tailwind classes (depends on: 2.3, 3.2)
- [x] 4.2 Normalize shared visual tokens (spacing, color, border radius, focus styles) across popup/sidepanel/options-page (depends on: 3.3, 4.1)
- [x] 4.3 Verify compact mode style behavior remains consistent with existing quick-action expectations (depends on: 2.2, 4.2)

## 5. Testing and Validation

- [x] 5.1 Update/add targeted tests for UI mode/state regressions affected by style refactor (depends on: 4.3)
- [x] 5.2 Run validators (`pnpm run compile`, `pnpm run test:run`) and fix regressions (depends on: 5.1)
- [ ] 5.3 Perform manual smoke checks on popup, sidepanel, and options-page in built extension output (depends on: 5.2)

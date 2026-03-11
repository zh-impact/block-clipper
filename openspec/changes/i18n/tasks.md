## 1. Setup: Create message files and types

- [x] 1.1 Scan all UI components and extract hardcoded text strings
- [x] 1.2 Create `public/_locales/en/messages.json` with English translations
- [x] 1.3 Create `public/_locales/zh_CN/messages.json` with Chinese translations
- [x] 1.4 Create `types/i18n.ts` with I18nKey union type definition
- [x] 1.5 Add hierarchical message keys using `feature.entity.action` naming convention

## 2. Create i18n Hook

- [x] 2.1 Create `hooks/useI18n.ts` with getMessage wrapper function
- [x] 2.2 Add TypeScript type safety for i18n keys in hook
- [x] 2.3 Implement pre-rendering safe translation loading

## 3. Update Components: Popup UI

- [x] 3.1 Replace hardcoded text in `entrypoints/popup/App.tsx` with chrome.i18n.getMessage()
- [x] 3.2 Use useI18n hook for dynamic translations in Popup
- [x] 3.3 Update aria-labels and accessibility text in Popup

## 4. Update Components: Options Page

- [x] 4.1 Replace hardcoded text in `entrypoints/options-page/App.tsx` with chrome.i18n.getMessage()
- [x] 4.2 Update shared components (SearchBar, ImportControls, ExportControls) to use i18n
- [x] 4.3 Translate form labels, buttons, and status messages in Options page

## 5. Update Components: Sidepanel UI

- [x] 5.1 Replace hardcoded text in `entrypoints/sidepanel/App.tsx` with chrome.i18n.getMessage()
- [x] 5.2 Update ClipsList, ClipCard, DetailView components to use i18n
- [x] 5.3 Translate navigation, headers, and action buttons in Sidepanel

## 6. Update Components: Shared Components

- [x] 6.1 Update `components/clips/ClipCard.tsx` to use i18n for time labels and aria-labels
- [x] 6.2 Update `components/clips/DetailView.tsx` to use i18n for buttons and metadata
- [x] 6.3 Update `components/search/SearchBar.tsx` to use i18n for placeholder and labels
- [x] 6.4 Update `components/import-export/` components to use i18n
- [ ] 6.5 Update `components/ui/Toast.tsx` to support i18n for toast messages

## 7. Update Background Service Worker

- [x] 7.1 Update notification messages in `entrypoints/background.ts` to use chrome.i18n.getMessage()
- [x] 7.2 Translate context menu items if any

## 8. Update Content Scripts

- [x] 8.1 Update injected UI text in content scripts to use i18n
- [x] 8.2 Handle pre-rendering scenarios for content script UI

## 9. WXT Configuration

- [x] 9.1 Verify `wxt.config.ts` has `default_locale: 'en'` configured
- [x] 9.2 Ensure `public/_locales` directory is included in build output
- [x] 9.3 Test build output includes all message files

## 10. Testing: English Language

- [ ] 10.1 Test extension in Chrome with browser language set to English
- [ ] 10.2 Verify all UI components display English text correctly
- [ ] 10.3 Check all buttons, labels, and messages are in English

## 11. Testing: Chinese Language

- [ ] 11.1 Test extension in Chrome with browser language set to Chinese (Simplified)
- [ ] 11.2 Verify all UI components display Chinese text correctly
- [ ] 11.3 Check Chinese translations for accuracy and natural phrasing

## 12. Testing: Edge Cases

- [ ] 12.1 Test with unsupported browser language (should fallback to English)
- [ ] 12.2 Verify missing translation keys fallback to default locale
- [ ] 12.3 Test date/time formatting with different locales
- [ ] 12.4 Verify pre-rendering doesn't cause build errors

## 13. Documentation

- [ ] 13.1 Update README.md with i18n support information
- [ ] 13.2 Add translation workflow documentation to contributors guide
- [ ] 13.3 Document how to add new translations for future languages

## ADDED Requirements

### Requirement: Chrome Extension i18n API integration
The system SHALL integrate Chrome Extension i18n API to provide multilingual support for all user-facing interface elements.

#### Scenario: Get translated message
- **WHEN** component requests a translated message by key
- **THEN** system returns the translated string from the appropriate locale file

#### Scenario: Fallback to default locale
- **WHEN** requested translation key does not exist in the user's locale
- **THEN** system falls back to the default locale (en) translation

#### Scenario: Message with placeholders
- **WHEN** message contains placeholders like `$1$`, `$2$`
- **THEN** system substitutes placeholders with provided values

### Requirement: Bilingual interface support
The system SHALL support both English (en) and Simplified Chinese (zh_CN) languages for all user interface text.

#### Scenario: Chinese browser language
- **WHEN** user's browser language is set to zh-CN
- **THEN** system displays all interface text in Simplified Chinese

#### Scenario: English browser language
- **WHEN** user's browser language is set to en
- **THEN** system displays all interface text in English

#### Scenario: Unsupported browser language
- **WHEN** user's browser language is neither en nor zh-CN
- **THEN** system defaults to English interface

### Requirement: Message file structure
The system SHALL store translation files in the Chrome Extension standard `_locales/{locale}/messages.json` directory structure.

#### Scenario: English message file
- **WHEN** system loads English translations
- **THEN** system reads from `public/_locales/en/messages.json`

#### Scenario: Chinese message file
- **WHEN** system loads Chinese translations
- **THEN** system reads from `public/_locales/zh_CN/messages.json`

### Requirement: Hierarchical key naming
The system SHALL use hierarchical dot-notation keys organized by feature and context (e.g., `clips.delete.title`, `export.success.message`).

#### Scenario: Key naming convention
- **WHEN** developer adds a new translation key
- **THEN** key follows pattern `{feature}.{entity}.{action}` format

#### Scenario: Key uniqueness
- **WHEN** multiple features define translation keys
- **THEN** each key remains unique through namespacing

### Requirement: Pre-rendering compatibility
The system SHALL handle Chrome Extension API unavailability during WXT build-time pre-rendering.

#### Scenario: Component with i18n in pre-render
- **WHEN** component is pre-rendered during build
- **THEN** system gracefully handles missing chrome.i18n API

#### Scenario: Runtime translation loading
- **WHEN** component mounts in browser environment
- **THEN** system loads translations using chrome.i18n.getMessage()

### Requirement: TypeScript type safety
The system SHALL provide TypeScript type definitions for all translation keys to enable compile-time validation.

#### Scenario: Type-safe translation key
- **WHEN** developer calls chrome.i18n.getMessage()
- **THEN** TypeScript validates key exists in I18nKey union type

#### Scenario: Dynamic key support
- **WHEN** developer needs dynamic key (e.g., from API response)
- **THEN** I18nKey type includes `string` fallback

### Requirement: Cross-context i18n support
The system SHALL provide translations in all extension contexts including Content Scripts, Background Service Worker, Popup, Options page, and Sidepanel.

#### Scenario: Background notification
- **WHEN** Background Service Worker displays a notification
- **THEN** notification message uses translated text

#### Scenario: Content script UI
- **WHEN** Content Script injects UI into web page
- **THEN** injected UI displays translated text

#### Scenario: Popup interface
- **WHEN** user opens extension Popup
- **THEN** Popup displays translated interface elements

### Requirement: Locale-aware date formatting
The system SHALL format date and time values according to user's browser locale settings.

#### Scenario: Localized date display
- **WHEN** component displays a timestamp
- **THEN** system uses JavaScript's toLocaleString() with user's locale

### Requirement: WXT configuration
The system SHALL configure WXT to support i18n with default locale setting.

#### Scenario: Build includes locale files
- **WHEN** developer builds the extension
- **THEN** WXT bundles all _locales directories into output

#### Scenario: Manifest generation
- **WHEN** WXT generates manifest.json
- **THEN** manifest includes default_locale: 'en' configuration

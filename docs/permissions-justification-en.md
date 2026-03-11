# Block Clipper Permission Usage Justification

This document provides detailed explanations for each permission requested by the Block Clipper extension.

## 🔐 Extension Permissions List

### 1. `activeTab`

**Usage**: Access the currently browsing webpage to extract selected text content and retrieve page information (title, URL) for saving clips.

**Purpose**:
- Read user-selected text content
- Get current page title and URL
- Support keyboard shortcut for quick clipping (without leaving the current page)

---

### 2. `storage`

**Usage**: Store user's clipped content locally for offline storage.

**Purpose**:
- Store all clipped text content
- Save clip metadata (source, timestamp, title)
- Support import/export functionality
- Enable search and filtering
- **Completely local storage, no server uploads**

---

### 3. `scripting`

**Usage**: Inject content scripts into the current webpage when users click to clip or use keyboard shortcuts, enabling visual content selector and text extraction features.

**Purpose**:
- Automatically inject content scripts into the current page
- Ensure clipping functionality works on all webpages
- Support visual content selection mode

---

### 4. `contextMenus`

**Usage**: Add a "Clip Selection" option to the browser's right-click context menu, allowing users to quickly clip selected text.

**Purpose**:
- Add context menu item
- Provide convenient clipping entry point
- Work alongside keyboard shortcuts for multiple interaction methods

---

### 5. `sidePanel`

**Usage**: Display the extension interface in the browser side panel, allowing users to manage, search, and export clips without leaving the current webpage.

**Purpose**:
- Display all clips in the side panel
- Support real-time search and filtering
- Provide import/export functionality
- Show clip details and editing features

---

### 6. `notifications`

**Usage**: Display system notifications when clips are created successfully or fail, providing users with operation feedback.

**Purpose**:
- Show notification on successful clipping
- Display error message when clipping fails
- Show notification when import/export completes
- Alert users when storage space is low

---

### 7. `windows`

**Usage**: Retrieve current browser window information to open the side panel in the correct window.

**Purpose**:
- Get the currently active window
- Open side panel in the current window
- Ensure side panel displays in the correct window

---

## 🌐 Host Permissions: `<all_urls>`

### Host Permission: `<all_urls>`

**Permission Description**: This extension requires access to all websites to enable universal content clipping functionality. The content script is injected on every webpage to:

**Specific Purposes**:

1. **Extract Selected Content**: Read text selected by users on any webpage
2. **Visual Content Selection**: Enable hover-to-select mode for choosing specific page elements
3. **Page Context Information**: Retrieve page title and URL as clip source attribution
4. **User-Initiated Actions**: Only activate when users explicitly trigger clipping via:
   - Keyboard shortcut (Ctrl+Shift+Y / Cmd+Shift+Y)
   - Right-click context menu
   - Extension popup/sidebar interface

**Privacy Commitment**:
- ✅ The content script runs passively and only activates on user action
- ✅ No data is collected or transmitted without explicit user consent
- ✅ All clipped content is stored locally on the user's device
- ✅ No tracking or analytics code included
- ✅ Users have full control over what content is clipped
- ✅ No background monitoring or tracking of user behavior

---

## Why All Websites?

**Block Clipper** is a universal content clipping tool designed to work on any website the user visits. Restricting to specific sites would limit the core functionality – users should be able to clip from any webpage they browse, not just a pre-approved list.

**Key Points**:
- **User-Initiated**: Clipping only happens when users explicitly trigger it
- **No Background Monitoring**: The script doesn't track or collect data automatically
- **Local Storage**: All clipped content stays on the user's device
- **Transparency**: Users see exactly what content is being clipped before saving
- **Privacy-First**: No analytics, tracking, or data transmission

---

## 🛡️ Privacy Commitment

**Block Clipper** promises:

- ✅ All data stored locally, no server uploads
- ✅ No user browsing history collection
- ✅ No user behavior tracking
- ✅ No analytics or tracking code
- ✅ Works completely offline

---

## 📝 Permission Configuration Summary

| Permission | Purpose | Required |
|------------|---------|----------|
| `activeTab` | Access current webpage for content extraction | ✅ Yes |
| `storage` | Local storage for clips | ✅ Yes |
| `scripting` | Inject content scripts | ✅ Yes |
| `contextMenus` | Right-click menu integration | ✅ Yes |
| `sidePanel` | Side panel interface | ✅ Yes |
| `notifications` | Operation feedback notifications | ✅ Yes |
| `windows` | Window management | ✅ Yes |
| `<all_urls>` | Work on all websites | ✅ Yes |

---

## 💡 Chrome Web Store Submission Tips

When submitting to the Chrome Web Store, reviewers typically look for:

1. **Principle of Least Privilege** - Your extension only requests necessary permissions ✅
2. **Clear Descriptions** - Each permission has a clear purpose ✅
3. **Privacy Protection** - Local storage with no data uploads ✅

Your permission configuration is very reasonable and fully aligns with these principles!

---

## 📝 Simplified Version for Store Listing

**Short Description** (for the permission justification field):

```
This extension needs access to all websites to enable content clipping functionality. The content script is injected to:

• Extract text selected by the user on any webpage
• Enable visual content selection mode (hover to select elements)
• Retrieve page title and URL for clip attribution
• Support keyboard shortcuts and right-click menu for quick clipping

The script only activates when users explicitly trigger clipping actions. All data is stored locally and never transmitted. Users have full control over what content is saved.
```

---

## 🔍 For Reviewers: Additional Context

If you need more information about any specific permission:

**Why `<all_urls>` instead of specific sites?**

Block Clipper is designed as a universal clipping tool that works seamlessly across the entire web. Users should be able to clip from:
- News articles
- Blog posts
- Academic papers
- Social media
- Documentation sites
- Any other webpage they find valuable

Limiting to specific sites would severely restrict the utility and go against the core purpose of a general-purpose clipping tool.

**How we protect user privacy:**

1. **Passive Injection**: Content script is injected but remains dormant until user action
2. **Explicit Activation**: Only responds to direct user triggers (shortcuts, clicks)
3. **Local-Only Architecture**: All data stays on user's device, nothing leaves the browser
4. **No Telemetry**: Zero tracking, analytics, or data collection
5. **User Control**: Users explicitly choose what to clip before saving

We believe this architecture respects user privacy while delivering maximum functionality across the web.

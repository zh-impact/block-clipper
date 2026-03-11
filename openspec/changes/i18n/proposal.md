## Why

当前 Block Clipper 扩展程序仅支持英文界面，对于中文用户不够友好。随着扩展功能增多，需要支持中英文双语，并预留多语言扩展能力，提升国际化用户体验。

## What Changes

- **新增 Chrome Extension i18n 支持**：使用 Chrome Extension API 的 i18n 系统，支持动态语言切换
- **双语支持**：支持中文（简体）和英文，默认根据浏览器语言自动选择
- **提取硬编码文本**：将所有用户可见的硬编码文本字符串提取到消息文件
- **构建时预渲染优化**：确保 i18n 在 WXT 预渲染过程中正常工作（避免浏览器 API 依赖）

## Capabilities

### New Capabilities

- **i18n-support**: Chrome 扩展国际化支持
  - 支持中英文双语界面
  - 使用 Chrome Extension i18n API (`chrome.i18n.getMessage()`)
  - 语言文件存储在 `_locales/{locale}/messages.json`
  - 支持复数形式和占位符
  - 可扩展至更多语言

## Impact

**技术栈变更：**
- 新增 Chrome Extension i18n API 使用
- WXT 配置需支持 `default_locale`

**目录结构变化：**
```
public/_locales/
├── en/messages.json    # 英文消息
└── zh_CN/messages.json  # 中文（简体）消息
```

**组件影响：**
- **所有 UI 组件**：需要将硬编码文本替换为 `chrome.i18n.getMessage()` 调用
- **Background Service Worker**：通知消息需要支持多语言
- **Content Scripts**：注入的 UI 文本需要支持多语言
- **Popup/Options/Sidepanel**：所有用户界面文本

**开发体验：**
- 新增翻译文件维护流程
- 文本字符串需要通过 key 而非硬编码
- 构建时验证翻译完整性

**用户体验：**
- 根据浏览器语言自动选择界面语言
- 支持手动切换语言（可选）
- 一致的多语言体验

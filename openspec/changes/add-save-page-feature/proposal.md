## Why

当前 Block Clipper 仅支持用户手动选择并保存文本内容。用户希望能够保存整个页面的主要内容（如文章、博客文章等），而不是手动选择文本。需要一种方式来提取页面的主要内容，同时去除广告、导航栏、侧边栏等无关元素。Mozilla Readability 是一个经过验证的内容提取库，已被 Firefox 的阅读器视图广泛使用，非常适合这个需求。

## What Changes

### 新增功能

- **Popup 界面新增"Save page"按钮**：在 popup 中添加一个新的按钮，用于快速保存当前页面的主要内容
- **集成 @mozilla/readability**：安装并集成 Mozilla Readability 库用于内容提取和清理
- **内容保存逻辑**：实现完整的页面保存流程，包括 DOM 提取、内容清理、创建 Block
- **新的 Block 类型标识**：为完整页面保存的 Block 添加标识或元数据，以便与选中文本保存的 Block 区分

### 技术实现

- 添加 `@mozilla/readability` npm 依赖
- 在 content script 或 background 中实现页面内容提取逻辑
- 扩展现有的 `CreateBlockInput` 类型以支持页面保存场景
- 在 Popup 中添加"Save page"按钮和相关 UI

### 无破坏性变更

- 所有现有功能保持不变
- 新增功能是可选的，不影响现有用户工作流

## Capabilities

### New Capabilities

- `page-saving`: 完整页面内容保存功能，包括内容提取、清理、存储和用户界面集成

### Modified Capabilities

无

## Impact

### 受影响的代码模块

- **Popup UI** (`entrypoints/popup/App.tsx`)
  - 添加"Save page"按钮
  - 添加保存状态指示（加载中、成功/失败提示）

- **Content Script** (`entrypoints/content.ts`)
  - 可能需要添加页面内容提取逻辑
  - 或在 background 中通过 scripting API 注入提取脚本

- **Background Service Worker** (`entrypoints/background.ts`)
  - 添加新的消息类型 `SAVE_PAGE`
  - 处理页面保存请求
  - 调用 Readability 库处理内容

- **存储层** (`utils/storage.ts`, `utils/block-model.ts`)
  - 可能需要扩展 Block 模型以支持页面保存的元数据
  - 或添加新的字段标识内容来源（selected-text vs full-page）

### 新增依赖

- `@mozilla/readability`: Mozilla 的内容提取库，用于清理页面 DOM 并提取主要内容

### 用户工作流变化

- **之前**：用户选中文本 → 点击图标/快捷键 → 保存选区
- **新增**：用户浏览页面 → 点击 popup 中"Save page"按钮 → 自动提取并保存主要内容

### 非目标

- 不实现页面缓存或快照功能（只提取文本内容）
- 不支持多页面批量保存
- 不改变现有选区保存的工作流

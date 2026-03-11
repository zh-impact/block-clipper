## Why

当前 Block Clipper 在保存内容时，标题需要用户手动输入或从页面元数据提取，经常出现：
- 标题不够准确或描述性不足
- 用户需要额外时间思考合适的标题
- 从页面提取的标题可能过长或不符合用户需求

Chrome 138+ 提供了内置的 Summarizer API，可以利用设备本地的 Gemini Nano 模型生成高质量摘要。通过使用 AI 自动生成简洁的标题（headline 类型），可以显著改善用户体验，减少手动操作。

## What Changes

- **集成 Chrome Summarizer API**
  - 使用 `type: "headline"` 和 `length: "short"` 生成 12-22 词的简洁标题
  - 添加 API 可用性检测（检查 `self.Summarizer`）
  - 支持用户激活要求（user activation requirement）

- **自动标题生成流程**
  - 在内容剪贴成功后自动触发 AI 标题生成
  - 首次使用时自动下载 Gemini Nano 模型（需要 22GB+ 可用空间）
  - 生成完成后自动填充到内容项的 title 字段

- **失败回退机制**
  - 当 AI 生成失败时（硬件不满足要求、API 不可用、网络错误等）
  - 自动回退到现有行为：使用页面元数据提取标题或提示用户手动输入
  - 记录失败原因以便调试

- **详情页重新生成**
  - 在 Sidebar 内容详情页添加"重新生成标题"按钮
  - 允许用户对已保存的内容再次触发 AI 标题生成
  - 支持用户编辑 AI 生成的标题

- **兼容性处理**
  - 检测 Chrome 版本（138+）和硬件要求
  - 对于不支持的浏览器/设备，隐藏 AI 功能或显示友好提示
  - 不影响核心剪贴功能的正常使用

## Capabilities

### New Capabilities

- `ai-title-generation`: 使用 Chrome Summarizer API 自动为剪贴内容生成简洁标题，包含失败回退和重新生成能力

### Modified Capabilities

_（无现有功能的需求级别变更，仅实现增强）_

## Impact

**技术栈：**
- Chrome Built-in AI Summarizer API (Chrome 138+)
- 现有 WXT 框架和 React 19

**组件影响：**

- **Content Script (`entrypoints/content.ts`)**
  - 添加 `generateAITitle()` 函数调用 Summarizer API
  - 在剪贴成功后触发标题生成
  - 处理生成失败并回退到现有逻辑

- **Sidebar UI (`entrypoints/sidepanel/App.tsx`)**
  - 在内容卡片/详情页显示 AI 生成的标题
  - 添加"重新生成标题"按钮和相关 UI
  - 处理标题编辑功能

- **Background Service Worker (可选)**
  - 可能需要处理跨上下文的 API 调用协调

**存储影响：**
- 现有 IndexedDB schema 无需变更（使用已有 `title` 字段）
- 可能需要添加 `aiGenerated: boolean` 标记区分 AI 和手动标题

**依赖和环境要求：**
- Chrome 138+ stable 版本
- 硬件要求：22GB+ 可用磁盘空间，4GB+ VRAM 或 16GB+ RAM
- 首次使用需要下载 Gemini Nano 模型

**用户体验：**
- 支持 AI 的用户：获得自动生成的简洁标题
- 不支持 AI 的用户：保持现有体验，无功能降级

## Why

当前 Block Clipper 存在以下问题需要优化：

1. **代码重复和逻辑不同步**：Options、Panel、Popup 页面有重复的组件实现，导致逻辑不同步（如在 Options 导入数据后，Panel 没有立即同步变化）
2. **样式不统一**：各页面样式缺乏一致性，未充分利用 Tailwind CSS 的最佳实践
3. **组件组织混乱**：UI 组件分散在各页面目录中，缺乏统一管理
4. **代码结构不清晰**：缺乏 hooks 目录，自定义 hooks 组织不佳
5. **性能问题**：Popup 首次点击弹出有延迟卡住现象
6. **潜在 Bug**：需要系统性检测和修复

## What Changes

### 组件架构重构
- 提取 Options、Panel、Popup 的公共组件到 `components/` 目录
- 实现统一的组件自动导入机制（遵循 WXT 规范）
- 解决页面间数据同步问题

### 样式系统优化
- 基于 Tailwind CSS 最佳实践统一样式
- 优化页面布局，提升视觉一致性和美观度
- 建立设计系统（颜色、间距、排版等）

### 代码结构重组
- 创建根目录 `components/` 组织所有 UI 组件
- 创建根目录 `hooks/` 组织自定义 React hooks
- 遵循 WXT 自动导入规则（`components/auto-imports` 和 `hooks/auto-imports`）

### 性能优化
- 诊断并修复 Popup 首次点击延迟问题
- 优化组件加载和渲染性能

### Bug 修复
- 系统性检测代码中的潜在 bug
- 修复已知问题（如数据同步、状态管理等）

## Capabilities

### New Capabilities

- `shared-components`: 公共组件库，提供可复用的 UI 组件
  - 统一的列表组件（ClipsList, ClipCard）
  - 统一的详情组件（DetailView, DetailHeader）
  - 统一的导入/导出组件（ImportControls, ExportControls）
  - 统一的搜索组件（SearchBar）
  - 统一的通知组件（Toast, Notification）

- `shared-hooks`: 自定义 React hooks 库
  - `useBlocks`: 管理 blocks 数据的 hook
  - `useSearch`: 搜索功能的 hook
  - `useImportExport`: 导入/导出功能的 hook
  - `useNotification`: 通知功能的 hook
  - `useAI`: AI 相关功能的 hook

- `cross-page-sync`: 跨页面数据同步能力
  - 实时监听数据变化（通过 chrome.runtime.onMessage）
  - 自动更新本地状态
  - 保持 Options、Panel、Popup 数据一致性

- `performance-optimization`: 性能优化能力
  - Popup 快速加载优化
  - 组件懒加载
  - 状态更新优化

### Modified Capabilities

- `data-import`: 优化数据导入体验
  - 导入后立即通知其他页面更新
  - 显示导入进度和结果

- `data-export`: 优化数据导出体验
  - 统一导出 UI 和逻辑
  - 支持更多导出选项

## Impact

**技术栈：**
- WXT 自动导入机制
- React 19 hooks 最佳实践
- Tailwind CSS 设计系统

**目录结构变化：**
```
block-clipper/
├── components/          # NEW: 公共 UI 组件
│   ├── clips/           # Clips 相关组件
│   ├── import-export/   # 导入/导出组件
│   ├── search/          # 搜索组件
│   └── ui/              # 通用 UI 组件
├── hooks/               # NEW: 自定义 hooks
│   ├── useBlocks.ts
│   ├── useSearch.ts
│   ├── useImportExport.ts
│   └── useNotification.ts
├── entrypoints/
│   ├── popup/           # REFACTOR: 简化，使用共享组件
│   ├── options-page/    # REFACTOR: 简化，使用共享组件
│   └── sidepanel/       # REFACTOR: 简化，使用共享组件
```

**WXT 配置变化：**
- 启用 `components` 自动导入
- 启用 `hooks` 自动导入
- 配置 Tailwind CSS 路径包含

**组件影响：**
- **Popup UI**: 大幅简化，复用共享组件
- **Options UI**: 大幅简化，复用共享组件
- **Sidepanel UI**: 提取共享组件，保持功能完整
- **Background**: 添加数据同步通知

**存储影响：**
- 无 IndexedDB schema 变更
- 增强跨页面消息传递机制

**用户体验：**
- 导入/导出操作在所有页面保持一致
- 数据变化实时同步到所有打开的页面
- Popup 响应更快
- 更统一美观的视觉设计

**开发体验：**
- 组件复用，减少代码重复
- hooks 抽象，简化状态管理
- 自动导入，提高开发效率
- 更清晰的代码组织

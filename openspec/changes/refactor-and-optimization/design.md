## Context

Block Clipper 是一个基于 WXT 框架的浏览器扩展，当前存在代码组织和架构问题：

**当前状态：**
- 三个独立页面（Popup、Options、Sidepanel）各自实现了大量重复代码
- 组件分散在各页面目录，无法复用
- 缺乏统一的 hooks 抽象，状态管理逻辑重复
- 样式代码分散，未充分利用 Tailwind CSS
- Popup 首次加载有性能问题
- 数据变化无法跨页面同步（如 Options 导入后 Panel 不更新）

**技术约束：**
- WXT 框架的自动导入机制需要正确配置
- Manifest V3 的 Service Worker 生命周期限制
- Chrome Extension API 的消息传递机制
- React 19 和 TypeScript 5.9
- Tailwind CSS 作为样式解决方案

**相关方：**
- 用户：期望快速响应和一致的用户体验
- 开发者：需要清晰的代码组织和高效的开发流程

## Goals / Non-Goals

**Goals:**
- 建立统一的组件库，消除代码重复
- 实现跨页面数据同步，确保状态一致性
- 优化 Popup 加载性能，提升用户体验
- 建立清晰的代码组织结构（components/ 和 hooks/）
- 统一样式系统，基于 Tailwind CSS 最佳实践
- 修复已知 bug，提升代码质量

**Non-Goals:**
- 不改变核心功能（剪藏、存储、导出）
- 不修改 IndexedDB schema
- 不引入新的外部依赖（除 WXT 模块外）
- 不改变用户交互流程
- 不实现服务端功能

## Decisions

### 1. 组件目录结构：根目录 components/

**决策：** 在项目根目录创建 `components/` 目录，按功能组织组件

**理由：**
- WXT 支持根目录组件自动导入
- 便于跨 entrypoints 复用
- 清晰的代码组织

**子目录组织：**
```
components/
├── clips/              # Clips 列表相关
│   ├── ClipsList.tsx
│   ├── ClipCard.tsx
│   └── DetailView.tsx
├── import-export/      # 导入/导出相关
│   ├── ImportControls.tsx
│   ├── ExportControls.tsx
│   └── FormatSelector.tsx
├── search/             # 搜索相关
│   └── SearchBar.tsx
└── ui/                 # 通用 UI 组件
    ├── Button.tsx
    ├── Toast.tsx
    └── LoadingSpinner.tsx
```

**替代方案考虑：**
- 保持在各 entrypoint 的 components/ 目录：导致重复代码，无法复用
- 使用 node_modules/@shared：复杂且不符合 WXT 最佳实践

### 2. Hooks 目录结构：根目录 hooks/

**决策：** 在项目根目录创建 `hooks/` 目录，组织自定义 hooks

**理由：**
- WXT 支持根目录 hooks 自动导入
- 集中管理状态逻辑
- 符合 React 19 hooks 最佳实践

**核心 Hooks：**
```
hooks/
├── useBlocks.ts          # 管理 blocks 数据
├── useSearch.ts          # 搜索功能
├── useImportExport.ts    # 导入/导出
├── useNotification.ts    # 通知/Toast
├── useAI.ts              # AI 功能
└── useCrossPageSync.ts   # 跨页面同步
```

### 3. 跨页面数据同步：通过 chrome.runtime.onMessage

**决策：** 使用消息广播机制实现跨页面同步

**实现：**
- Background 在数据变更时发送广播消息（`BLOCK_UPDATED`, `BLOCKS_RELOADED`）
- 各页面监听消息并更新本地状态
- 不依赖复杂的状态管理库（如 Redux）

**理由：**
- Chrome Extension API 原生支持
- 轻量级，无需额外依赖
- 符合扩展程序架构模式

**消息类型：**
```typescript
type SyncMessage =
  | { type: 'BLOCK_UPDATED'; data: { block: Block } }
  | { type: 'BLOCKS_RELOADED'; data: { timestamp: number } }
  | { type: 'IMPORT_COMPLETED'; data: { count: number } }
```

### 4. Popup 性能优化：懒加载和预渲染优化

**决策：** 通过代码分割和懒加载优化 Popup 初始加载

**诊断：**
当前 Popup 延迟可能由以下原因导致：
1. 首次渲染时执行了昂贵的操作（如大量数据查询）
2. 组件未分割，加载了不必要的代码
3. HMR 或预渲染配置问题

**优化方案：**
- 延迟数据加载（在 Popup 打开后加载，而不是在初始化时）
- 使用 React.lazy() 懒加载非关键组件
- 优化 initial render，减少首次渲染工作量
- 检查 WXT 预渲染配置，避免在 build 时执行浏览器 API

### 5. 样式系统：Tailwind CSS + 设计令牌

**决策：** 建立基于 Tailwind CSS 的设计系统

**设计令牌（在 CSS 中定义）：**
```css
@layer base {
  :root {
    /* 颜色 */
    --color-primary: #3b82f6;
    --color-success: #10b981;
    --color-danger: #ef4444;
    --color-warning: #f59e0b;

    /* 间距 */
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 1.5rem;

    /* 圆角 */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
  }
}
```

**组件样式原则：**
- 使用 Tailwind utility classes 优先
- 复杂组件使用 @apply 抽取
- 保持一致的间距、颜色和字体

### 6. WXT 自动导入配置

**决策：** 配置 WXT 自动识别 components/ 和 hooks/

**wxt.config.ts 更新：**
```typescript
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  experimental: {
    // 启用根目录组件自动导入
    includeComponents: ["components/**/*"],
    // 启用根目录 hooks 自动导入
    includeHooks: ["hooks/**/*"],
  },
  // ... rest of config
});
```

### 7. Bug 修复策略

**决策：** 在重构过程中系统性修复发现的 bug

**已知问题：**
1. Options 导入数据后 Panel 不同步 → 通过跨页面同步解决
2. 列表排序问题（reverse() 查询） → 已在之前修复
3. 类型定义不一致 → 统一使用导出的类型

## Data Flow

### 跨页面同步流程

```
User Action (e.g., Import in Options)
    ↓
Options updates IndexedDB
    ↓
Options sends message to Background
    ↓
Background broadcasts to all pages
    ↓
Sidepanel/Popup receive message
    ↓
Each page updates local state
    ↓
UI reflects changes immediately
```

### 组件复用流程

```
Component (in components/)
    ↓
WXT Auto-Import
    ↓
Available in all entrypoints
    ↓
Used by Popup/Options/Sidepanel
    ↓
Consistent behavior across pages
```

## Migration Plan

**阶段 1：目录结构和自动导入（1-2 小时）**
1. 创建 `components/` 和 `hooks/` 目录
2. 更新 wxt.config.ts 启用自动导入
3. 验证自动导入工作正常

**阶段 2：提取 Hooks（2-3 小时）**
1. 从 Sidepanel 提取 `useBlocks`
2. 提取 `useSearch`, `useNotification`
3. 提取 `useImportExport`, `useAI`
4. 在各页面应用新的 hooks

**阶段 3：提取公共组件（3-4 小时）**
1. 提取 ClipsList, ClipCard 组件
2. 提取 ImportControls, ExportControls
3. 提取 SearchBar, Toast 组件
4. 更新各页面使用共享组件

**阶段 4：实现跨页面同步（2-3 小时）**
1. 在 Background 添加广播逻辑
2. 各页面添加消息监听
3. 测试数据同步功能

**阶段 5：样式优化（2-3 小时）**
1. 建立设计令牌
2. 统一组件样式
3. 优化布局和间距

**阶段 6：性能优化和 Bug 修复（2-3 小时）**
1. 诊断并修复 Popup 延迟
2. 系统性测试
3. 修复发现的 bug

**阶段 7：清理和验证（1-2 小时）**
1. 删除重复代码
2. 更新文档
3. 完整测试

**回滚策略：**
- 使用 Git 分支进行开发
- 每个阶段完成后提交
- 如遇到问题可回滚到任意阶段
- 保持 `main` 分支稳定

## Risks / Trade-offs

### Risk 1: 自动导入配置错误导致组件无法加载
**风险：** WXT 自动导入配置不当可能导致组件引用失败
**缓解措施：**
- 在开发分支逐步配置和测试
- 每次配置后验证组件能否正常导入
- 查看 WXT 文档确认正确配置方式

### Risk 2: 重构过程引入新 Bug
**风险：** 大规模重构可能破坏现有功能
**缓解措施：**
- 逐组件迁移，每步测试
- 保留原有代码作为备份
- 使用 TypeScript 类型检查捕获错误
- 完整的回归测试

### Risk 3: 性能优化可能适得其反
**风险：** 过度优化或不当优化可能降低性能
**缓解措施：**
- 先诊断性能瓶颈（DevTools Performance）
- 有针对性的优化
- 优化前后对比测量
- 保留回退方案

### Risk 4: 跨页面同步消息泛滥
**风险：** 频繁的消息传递可能影响性能
**缓解措施：**
- 使用防抖/节流控制消息频率
- 只在必要时发送同步消息
- 监控消息处理性能

### Trade-off 1: 代码组织 vs 文件数量
**权衡：** 更细的组件划分增加文件数量
**决策：** 接受更多文件以换取更好的代码组织和复用性
**理由：** 文件数量影响不大，复用性提升显著

### Trade-off 2: 一次性重构 vs 渐进式重构
**权衡：** 大规模一次性重构风险高，渐进式耗时
**决策：** 阶段性渐进式重构
**理由：** 降低风险，可随时停止或回滚

## Open Questions

1. **Q: Popup 是否需要保留所有功能？**
   - A: Popup 应保持轻量级，主要功能应在 Sidepanel。Popup 只做快速操作和状态显示。

2. **Q: 是否需要引入状态管理库（如 Zustand）？**
   - A: 当前不需要。自定义 hooks + 消息同步足够。如有复杂状态需求再考虑。

3. **Q: 组件是否需要支持主题切换？**
   - A: 不在 MVP 范围内。当前只需统一现有样式。

4. **Q: 如何处理各页面特有的 UI 差异？**
   - A: 共享组件接受 props 自定义，必要时使用组合模式。

5. **Q: 是否需要为共享组件写单元测试？**
   - A: 理想情况应该有，但不是此次重构的重点。可后续补充。

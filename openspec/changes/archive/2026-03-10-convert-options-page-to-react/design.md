## Context

当前 options 页面由 `public/options.html + public/options.js` 直接驱动，和 sidepanel 的 React 架构分离，存在以下问题：
- UI 状态管理与事件绑定散落在脚本中，功能扩展成本高。
- 导入/导出、剪切板、紧凑模式等逻辑在 sidepanel 与 options 间难以保持一致。
- 图标、交互密度、错误反馈等 UI 规范容易漂移。

本次改造目标是在不改变数据契约与存储模型的前提下，将 options 页面迁移为 React 实现，并与现有工具层与交互模式对齐。

## Goals / Non-Goals

**Goals:**
- 将 options 页面切换为 React entrypoint 与组件化实现。
- 保持现有能力等价：列表/详情、搜索、删除、文件与剪切板导入导出、JSON/Markdown 格式切换、紧凑模式。
- 复用现有 `utils/storage`、`utils/importer`、`utils/exporter`、`utils/clipboard` 能力，避免重复实现。
- 在 MV3/WXT 环境下保持构建稳定，避免 pre-render 阶段访问浏览器特有 API。

**Non-Goals:**
- 不变更 IndexedDB schema 与 block 数据结构。
- 不改造 sidepanel/popup 主体架构。
- 不引入远程服务、账号体系与同步能力。

## Decisions

1. **Options 改为 React entrypoint（替代 public/options.js 主逻辑）**
   - 方案：新增 `entrypoints/options/`（例如 `main.tsx` + `App.tsx`），由 WXT 管理构建与注入；`public/options.html` 保持最小壳层。
   - 原因：与 sidepanel 技术栈统一，复用 React 状态模型与组件拆分方式。
   - 备选：继续维护原生脚本并做模块化；放弃原因是长期维护成本仍高。

2. **导入导出流程统一为“通道 + 格式”双维模型**
   - 方案：UI 层仅做参数选择（file/clipboard + json/markdown），执行层统一走 shared utility。
   - 原因：避免页面内散落分支，降低行为偏差风险。
   - 备选：每个按钮独立实现；放弃原因是重复逻辑多且测试难覆盖。

3. **紧凑模式定义为快捷动作模式**
   - 方案：紧凑模式仅保留快捷导入导出按钮（默认 JSON），隐藏格式选择控件。
   - 原因：满足“快速操作、低占用”的预期。
   - 备选：仅缩小尺寸但保留全部控件；放弃原因是视觉密度高且不够“快捷”。

4. **图标策略统一**
   - 方案：React 页面使用 `@tabler/icons-react`，文件动作使用文件系图标，剪切板动作使用剪切板系图标。
   - 原因：语义清晰、风格一致，避免手写 SVG 维护成本。

5. **MV3 约束处理**
   - 方案：所有浏览器 API 调用（clipboard、indexedDB）仅在事件触发后执行；组件初始化阶段只做惰性准备。
   - 原因：避免 pre-render/build 时机访问环境特有对象导致异常。

### Data Flow

```text
Options React UI
  ├─ Query/Refresh -> StorageService.query(...) -> IndexedDB(blocks)
  ├─ Export(File/Clipboard, Format)
  │    ├─ exporter (JSON/Markdown serialize)
  │    └─ downloadFile OR clipboard.writeText
  └─ Import(File/Clipboard, Format)
       ├─ read text (file or clipboard)
       ├─ importer (parse + validate + normalize)
       └─ StorageService.importRecords(...) -> IndexedDB(blocks)
```

### IndexedDB Schema (Explicit)

- DB: `block-clipper-db`
- Version: `1`
- Store: `blocks` (keyPath: `id`)
- Index: `by-created` (`createdAt`, non-unique)
- Block fields（保持不变）:
  - `id`, `type`, `content`, `source`, `metadata`, `createdAt`, `updatedAt`

### Sidebar vs Popup Responsibilities

- **Sidebar**：主管理界面，承担全量浏览与管理（不在本变更范围内）。
- **Popup**：轻量快捷入口（不在本变更范围内）。
- **Options（本次）**：补全管理面，采用与 sidebar 对齐的交互结构与导入导出模型。

## Risks / Trade-offs

- **[Risk] 迁移过程中行为回归（导入导出分支多）** → **Mitigation**：复用 shared utility，新增/更新覆盖 file+clipboard+format 组合的测试。
- **[Risk] options 打包入口切换导致构建配置偏差** → **Mitigation**：按现有 entrypoint 约定创建目录并通过 `pnpm run compile` 验证。
- **[Risk] 紧凑模式默认 JSON 可能与用户预期不一致** → **Mitigation**：在标准模式保留格式切换；紧凑模式文案明确“快捷 JSON”。
- **[Trade-off] React 化增加初始代码量** → **Benefit**：换取长期可维护性、可测试性与跨页面一致性。

## Migration Plan

1. 新建 options React entrypoint 与基础组件骨架。
2. 迁移列表/详情/搜索/删除逻辑到 React 状态管理。
3. 接入 shared import/export/clipboard 工具，完成标准模式交互。
4. 加入紧凑模式快捷动作与 Tabler 图标语义。
5. 清理/降级旧 `public/options.js` 逻辑（保留最小静态壳）。
6. 运行 `pnpm run compile` 与 `pnpm run test:run`，补齐回归测试。

回滚策略：若出现严重问题，可临时回退到旧 options 脚本版本（git 回滚入口与页面绑定改动）。

## Open Questions

- options React 页面是否复用 sidepanel 的部分子组件（如卡片渲染）还是先独立实现后再抽象？
- 紧凑模式是否需要持久化到本地配置，或仅会话级切换？

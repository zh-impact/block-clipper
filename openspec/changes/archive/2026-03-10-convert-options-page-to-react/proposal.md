## Why

当前 `options` 页面仍是原生 HTML + JS 实现，和 sidepanel 的 React 架构分离，导致状态管理、组件复用、样式一致性与后续功能演进成本持续上升。现在进行 React 化可以统一前端实现范式，降低维护复杂度并减少未来功能迭代的重复开发。

## What Changes

- 将 `options` 页面从原生脚本改造为 React 入口与组件化实现。
- 保持现有核心能力不回退：搜索、详情查看、删除、导入/导出（文件与剪切板）、格式切换与紧凑模式切换。
- 复用现有工具层（import/export/clipboard/storage）并梳理 UI 逻辑边界，减少页面内脚本耦合。
- 调整构建与入口组织，使 `options` 页面与其他 React entrypoint 在工程结构上保持一致。

## Capabilities

### New Capabilities
- `options-page-react-ui`: 定义 options 页面由 React 渲染、并保持既有用户能力与交互一致性的规范要求。

### Modified Capabilities
- 无。

## Impact

- 受影响代码：`public/options.html`、`public/options.js`、新增/调整 React entrypoint 与相关组件。
- 受影响系统：WXT 多入口页面装配（options 页面入口从静态脚本迁移为 React 应用）。
- 依赖影响：使用并统一 `@tabler/icons-react`（已引入）作为 options/sidepanel 图标来源。
- API/数据影响：不引入后端变更，不修改 IndexedDB 数据模型与现有导入导出数据契约。

## Success Criteria

- options 页面由 React 完整渲染并可正常加载。
- 用户可在 options 页面完成与当前版本等价的导入/导出与管理流程（文件/剪切板、JSON/Markdown）。
- 与 sidepanel 在交互结构上保持一致（含紧凑模式快捷操作）。
- `pnpm run compile` 与 `pnpm run test:run` 全量通过。

## Non-goals

- 不新增后端服务、账号体系或云同步能力。
- 不改变现有导入导出数据格式与存储 schema。
- 不在本次变更中重做 sidepanel 架构，仅做 options 页 React 化与必要对齐。

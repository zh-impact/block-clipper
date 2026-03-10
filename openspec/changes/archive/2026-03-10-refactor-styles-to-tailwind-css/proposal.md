## Why

当前各页面样式以分散的内联 `<style>` 与局部 CSS 文件为主，维护成本高且跨页面一致性难以保障。引入 Tailwind CSS 进行统一重构，可以在不改变业务能力的前提下提升样式复用性、可维护性和迭代效率。

## What Changes

- 将 popup、sidepanel、options-page 等现有 UI 样式重构为 Tailwind CSS 工具类实现。
- 统一按钮、输入框、卡片、状态提示等设计 token 与交互态（hover/focus/disabled）。
- 替换当前大量内联样式与重复 CSS 规则，保留必要的全局基础样式。
- 保证现有功能行为不变（导入/导出、搜索、详情、可视化选择等逻辑不变）。

## Capabilities

### New Capabilities
- `tailwind-styling-system`: 定义扩展 UI 使用 Tailwind CSS 统一实现样式系统并保持现有行为一致。

### Modified Capabilities
- 无。

## Impact

- 受影响代码：`entrypoints/popup/*`、`entrypoints/sidepanel/*`、`entrypoints/options-page/*` 及相关样式文件。
- 新增/调整依赖：Tailwind CSS 与其构建配置（如 PostCSS/Tailwind config）。
- 构建影响：WXT + Vite 样式构建链将纳入 Tailwind 处理流程。
- 测试影响：需要回归验证 UI 关键交互（搜索、导入导出、详情操作）未退化。

## Success Criteria

- 主要 UI 页面（popup、sidepanel、options-page）完成 Tailwind 样式迁移。
- 核心功能行为与当前版本一致，无功能回归。
- 样式重复度下降，内联样式显著减少。
- `pnpm run compile` 与 `pnpm run test:run` 全部通过。

## Non-goals

- 不引入新的业务功能或改变现有数据结构。
- 不更换 React/WXT/IndexedDB 等核心技术栈。
- 不在本次改造中重做信息架构与功能流程。

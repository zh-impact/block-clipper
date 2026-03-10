## Context

当前扩展 UI 样式存在三类并行实现：内联 `<style>`、局部 CSS 文件、以及散落在页面脚本中的样式控制。随着 options-page React 化和导入导出交互增加，样式维护成本与一致性风险持续上升。此次改造属于跨 popup / sidepanel / options-page 的横切变更，且引入 Tailwind 作为新样式依赖，需要先明确技术方案和迁移路径。

## Goals / Non-Goals

**Goals:**
- 在不改变现有业务行为的前提下，将主要 UI 样式迁移为 Tailwind CSS 工具类。
- 建立统一的 UI token 与状态样式（按钮、输入框、卡片、提示、密度模式）。
- 降低重复样式与内联样式比例，便于后续快速迭代。
- 保持 MV3/WXT 构建稳定，确保扩展多页面样式打包可用。

**Non-Goals:**
- 不新增业务功能，不改动数据模型和导入导出协议。
- 不重写现有核心逻辑（storage/import/export/clipboard 逻辑保持复用）。
- 不引入服务端主题系统或运行时远程样式配置。

## Decisions

1. **使用 Tailwind + PostCSS 集成到 WXT 构建链**
   - 选择：引入 `tailwindcss`、`postcss`、`autoprefixer`，在项目级配置统一处理样式。
   - 原因：减少自定义 CSS 维护负担，提升样式复用与一致性。
   - 备选：继续纯 CSS 重构。放弃原因：跨页面复用与状态管理仍成本高。

2. **采用“先保行为、后收敛样式”的迁移策略**
   - 选择：先逐页替换 class 与布局，不改动业务方法签名与数据流。
   - 原因：将风险限定在展示层，降低回归概率。

3. **统一组件级样式约定（Utility-first + 少量语义封装）**
   - 选择：页面内优先使用 Tailwind utility class；对高复用模式通过小型样式组合抽象。
   - 原因：避免再次回到散落样式定义，保持清晰可追踪。

4. **密度模式继续保留，使用 Tailwind 条件类切换**
   - 选择：`standard` / `compact` 通过状态驱动 class 组合切换。
   - 原因：保持现有交互预期并减少样式分支文件。

### Data Flow (UI 行为不变)

```text
User Action
  -> React State Update
  -> Existing business logic (storage/import/export/clipboard)
  -> UI render with Tailwind classes
```

### IndexedDB Schema (No Change)

- DB: `block-clipper-db`
- Version: `1`
- Store: `blocks` (keyPath: `id`)
- Index: `by-created` (`createdAt`, non-unique)
- 字段保持不变：`id/type/content/source/metadata/createdAt/updatedAt`

### Sidebar vs Popup Responsibilities (No Change)

- **Popup**：快捷入口与轻量状态查看。
- **Sidepanel**：主管理界面与批量操作核心承载。
- **Options Page**：独立页面管理视图，与 sidepanel 对齐交互模式。

## Risks / Trade-offs

- **[Risk] 样式替换导致交互区域错位** → **Mitigation**：关键操作（导入/导出/删除/详情切换）逐页手动回归。
- **[Risk] Tailwind 体积膨胀** → **Mitigation**：启用 content 扫描精确路径，避免无用类进入构建产物。
- **[Risk] 多入口样式行为不一致** → **Mitigation**：建立统一基础样式层和共享 class 约定。
- **[Trade-off] 初次迁移改动面较大** → **Mitigation**：按页面拆分提交并保持功能逻辑不改。

## Migration Plan

1. 配置 Tailwind 基础依赖与构建接入（config + content 路径）。
2. 先迁移 options-page（最新改造页面）作为模板。
3. 迁移 popup 与 sidepanel 样式实现，清理内联 `<style>` 与重复 CSS。
4. 保留必要全局样式，删除冗余样式文件。
5. 执行 compile/test 与人工 UI 回归。

回滚策略：若出现严重 UI 回归，可按页面回退到迁移前 commit；业务逻辑层因不改动可保持稳定。

## Open Questions

- 是否在本次迁移中同步引入深色主题基础变量，还是仅保留浅色主题？
- 对高复用样式块是否提取 `@apply` 语义类，还是全部保留 utility 直写？

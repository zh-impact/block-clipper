## Why

当前导入导出以文件为主，用户在轻量场景（临时迁移、跨窗口粘贴、快速备份）下操作路径偏长。补充剪切板导入导出并统一 options/panel 的导出入口，可以明显提升效率和一致性。

## What Changes

- 新增导出到剪切板能力（在现有导出到文件之外提供并行路径）。
- 新增从剪切板导入能力（在现有从文件导入之外提供并行路径）。
- 优化导入导出交互：统一反馈成功/失败与结果统计。
- 在 **options** 与 **side panel** 两个界面都提供导出 UI（文件导出 + 剪切板导出）。

## Capabilities

### New Capabilities
- `data-export-clipboard`: 支持将导出数据写入系统剪切板，并提供可用的结果反馈与失败提示。

### Modified Capabilities
- `data-import`: 在现有文件导入能力基础上，新增剪切板导入路径与对应校验/错误处理要求。

## Impact

- 受影响模块：`utils/exporter/*`、`utils/importer/*`、`entrypoints/sidepanel/*`、`public/options.*`。
- 浏览器能力影响：使用剪切板 API（`navigator.clipboard` 或受限回退方案），需处理权限与失败场景。
- 数据契约影响：导出到剪切板与文件导出保持同一 JSON 契约，导入同样复用该契约。

## Success Criteria

- 用户可在 side panel 与 options 执行“导出到文件”与“导出到剪切板”。
- 用户可通过剪切板内容完成导入，并得到与文件导入一致的校验与统计反馈。
- 文件与剪切板两条路径的导出/导入数据契约一致，重复处理与错误提示行为一致。
- 在剪切板不可用或被拒绝时，系统提供明确可执行的错误提示。

## Non-goals

- 不引入第三方格式导入导出（仍仅支持 Block Clipper JSON 契约）。
- 不实现云端同步、跨设备自动共享。
- 不在本阶段实现复杂冲突合并策略（字段级交互合并）。
- 不扩展到 popup 全量导入导出工作流（保持 popup 轻量）。

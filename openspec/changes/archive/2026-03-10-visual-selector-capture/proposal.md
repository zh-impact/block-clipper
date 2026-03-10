## Why

当前剪藏仅支持“先手动选中文本再触发”，对只想快速抓取页面某个内容区域的用户不够高效。增加类似 uBlock Origin 的可视化选择器，可以通过悬停高亮与点击选择，降低操作门槛并提升剪藏成功率。

## What Changes

- 在 Popup 中新增“吸管/区域选择”入口（MVP 仅 Popup）。
- 触发后在当前网页进入可视化选择模式：鼠标悬停时自动高亮候选内容区域（仅“Auto best”策略）。
- 用户点击后弹出确认预览，再决定是否保存。
- 首期仅提取“被选中节点的可见纯文本”（不做富文本、Markdown结构化、邻近标题拼接）。
- 选择确认后沿用现有剪藏保存链路，保存为文本类型内容。

## Capabilities

### New Capabilities
- `visual-selector-capture`: 提供基于悬停高亮与点击确认的页面区域可视化文本剪藏能力（Popup 触发）。

### Modified Capabilities
- 无

## Success Criteria

- 用户可在 Popup 中一键进入可视化选择模式。
- 悬停时页面出现明确的候选区域高亮，点击后可看到文本预览确认。
- 用户确认后能成功生成一条新剪藏记录，且内容为“选中节点可见纯文本”。
- 用户取消确认时不写入任何新数据。

## Non-goals

- 不实现多层候选循环切换（nested cycle）。
- 不在 Side Panel 增加同入口（本期仅 Popup）。
- 不支持图片、代码块结构保真、Markdown 高级格式还原。
- 不实现跨设备同步、云端处理或服务端能力。

## Impact

- 受影响模块：`entrypoints/popup/*`（新增触发入口）、`entrypoints/content.ts`（新增可视化选择模式与文本提取逻辑）、`entrypoints/background.ts`（可能增加模式触发消息路由）。
- 受影响数据流：新增“Popup -> Content Script 可视化选择 -> 预览确认 -> Background 存储”的链路。
- 依赖变化：预计不新增第三方依赖，优先复用现有消息机制与存储能力。

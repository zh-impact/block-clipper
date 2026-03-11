## Context

Block Clipper 目前使用传统的标题提取方式（从页面元数据提取或用户手动输入）。随着 Chrome 138+ 发布内置的 Summarizer API，我们可以利用设备本地的 Gemini Nano 模型自动生成高质量标题。

**当前架构：**
- Content Script 负责捕获内容并调用 `StorageService.saveBlock()`
- Sidebar UI 负责展示和管理已保存的 blocks
- 标题在保存时一次性设置，后续可手动编辑

**技术约束：**
- Chrome Summarizer API 仅在 Chrome 138+ 中可用
- 需要满足硬件要求（22GB+ 可用空间，4GB+ VRAM 或 16GB+ RAM）
- 首次使用需下载 Gemini Nano 模型（约数 GB）
- API 需要用户激活（user activation）
- WXT 框架的预渲染限制（构建时浏览器 API 不可用）
- Manifest V3 的 Service Worker 生命周期限制

## Goals / Non-Goals

**Goals:**
- 集成 Chrome Summarizer API 实现自动标题生成
- 在不支持的浏览器上优雅降级，不影响核心功能
- 提供失败回退机制，确保用户体验连续性
- 允许用户在详情页重新生成标题
- 保持现有数据模型和存储结构最小化变更

**Non-Goals:**
- 不实现服务器端 AI 标题生成
- 不支持其他浏览器的 AI API（如 Firefox、Safari）
- 不修改核心 Block 数据模型的现有字段
- 不实现标题版本历史记录
- 不实现批量重新生成标题

## Decisions

### 1. API 调用位置：Content Script vs Background Service Worker

**决策：在 Content Script 中调用 Summarizer API**

**理由：**
- 用户触发剪贴动作时已经满足用户激活要求
- Content Script 直接访问剪贴的页面内容，无需传递数据
- 避免跨上下文通信的复杂性
- Service Worker 可能会被休眠，中断生成过程

**替代方案考虑：**
- Background Service Worker：API 调用可能被休眠中断，且需要通过消息传递内容

### 2. 标题生成时机：同步 vs 异步

**决策：异步生成，先保存后更新标题**

**理由：**
- AI 生成可能需要数秒时间（特别是首次下载模型）
- 不应阻塞用户继续浏览或操作
- 用户可以立即看到内容已保存，标题稍后更新
- 避免因生成失败导致整个保存流程失败

**流程：**
1. 用户触发剪贴 → 立即保存到 IndexedDB（使用默认标题或页面标题）
2. 在后台异步调用 AI 生成标题
3. 生成完成后更新 IndexedDB 中的 title 字段
4. Sidebar UI 响应式更新显示新标题

### 3. 数据模型变更：添加 aiGenerated 标记

**决策：添加可选的 `aiGenerated: boolean` 字段到 Block schema**

**理由：**
- 区分 AI 生成和手动编辑的标题
- 允许用户识别哪些标题是自动生成的
- 支持未来的"重新生成"功能（仅对 AI 生成的标题显示重新生成按钮）
- 不影响现有数据（字段可选）

**Schema 变更：**
```typescript
interface Block {
  // ... existing fields
  title?: string;
  aiGenerated?: boolean; // NEW: optional field
  // ... other fields
}
```

### 4. 失败回退策略：多层级回退

**决策：实现三级回退机制**

**回退顺序：**
1. **AI 生成**（首选）
   - 检查 API 可用性
   - 调用 Summarizer API

2. **页面元数据提取**（备选 1）
   - 尝试从 `<meta>` 标签、`<h1>` 标签提取标题
   - 使用 `document.title` 作为备选
   - 这是现有的回退逻辑

3. **用户手动输入**（备选 2）
   - 显示输入框让用户输入
   - 可以留空（title 为 undefined）

**实现：**
```typescript
async function generateTitle(content: string): Promise<string | undefined> {
  // Try AI generation
  if (await isAIAvailable()) {
    try {
      return await generateAITitle(content);
    } catch (error) {
      console.warn('AI generation failed:', error);
    }
  }
  // Fallback to metadata extraction
  return extractTitleFromMetadata();
}
```

### 5. 重新生成功能的实现：Sidebar UI 直接调用

**决策：在 Sidebar UI 中直接调用 AI 生成，不通过 Content Script**

**理由：**
- Sidebar 是用户查看详情的主要界面
- 用户点击"重新生成"按钮满足用户激活要求
- 避免跨上下文通信（Sidebar ↔ Content Script ↔ Background）
- 简化实现，降低出错风险

**技术实现：**
- Sidebar 导入 AI 生成工具函数
- 直接从已保存的 Block 内容中提取文本
- 调用 Summarizer API
- 更新 IndexedDB 并刷新 UI

### 6. API 可用性检测：运行时检测 + 缓存结果

**决策：在运行时检测 API 可用性，并缓存检测结果**

**理由：**
- 浏览器版本和硬件条件不会在运行时改变
- 避免重复检测的性能开销
- 可以在首次检测后隐藏/显示相关 UI

**实现：**
```typescript
let aiAvailableCache: boolean | null = null;

async function isAIAvailable(): Promise<boolean> {
  if (aiAvailableCache !== null) {
    return aiAvailableCache;
  }
  aiAvailableCache = 'Summarizer' in self;
  return aiAvailableCache;
}
```

### 7. 用户通知策略

**决策：使用非侵入式通知，不阻塞用户操作**

**通知类型：**
- **生成成功**：小 Toast 通知"AI 标题已生成"
- **生成失败**：静默处理，使用回退标题（不显示错误）
- **首次使用**：显示提示"首次使用需要下载 AI 模型（约 X GB）"
- **重新生成中**：显示加载指示器

**理由：**
- 标题生成是辅助功能，不应打断用户主要流程
- 失败时有回退机制，不需要显示错误
- 减少用户认知负担

## Data Flow

### Clipping Flow (with AI Title Generation)

```
User triggers clip
    ↓
Content Script captures content
    ↓
Generate initial title (metadata extraction or empty)
    ↓
Save to IndexedDB via StorageService
    ↓
Show "Saved" notification
    ↓
[Async] Check AI availability
    ↓
[Async] If available, generate AI title
    ↓
[Async] Update IndexedDB with AI title
    ↓
Sidebar UI updates (reactive)
```

### Regeneration Flow

```
User views item in Sidebar
    ↓
Click "Regenerate Title" button
    ↓
Sidebar checks AI availability
    ↓
Generate new AI title from content
    ↓
Update IndexedDB
    ↓
Refresh UI to show new title
```

## Component Architecture

### Content Script (`entrypoints/content.ts`)

**新增函数：**
```typescript
async function generateAITitle(content: string): Promise<string>
async function isAIAvailable(): Promise<boolean>
async function updateBlockTitle(id: string, title: string, aiGenerated: boolean): Promise<void>
```

**修改函数：**
- 在剪贴保存逻辑后添加异步标题生成调用

### Sidebar UI (`entrypoints/sidepanel/App.tsx`)

**新增组件：**
- `RegenerateTitleButton`: 显示"重新生成标题"按钮
- `TitleEditor`: 支持编辑标题（复用现有编辑功能）

**新增功能：**
- 重新生成标题处理函数
- AI 可用性状态管理

### Shared Utilities (`utils/ai/aiTitleGenerator.ts`)

**新文件：**
```typescript
export async function isAIAvailable(): Promise<boolean>
export async function generateAITitle(content: string): Promise<string>
export interface AITitleGenerationOptions {
  type?: 'headline' | 'key-points' | 'tldr' | 'teaser';
  length?: 'short' | 'medium' | 'long';
}
```

## IndexedDB Schema Changes

**Blocks Store:**
```typescript
{
  key: "aiGenerated",
  type: "boolean",
  optional: true,
  description: "Flag indicating if title was AI-generated"
}
```

**Migration:** No migration needed (field is optional, existing records remain unchanged)

## Risks / Trade-offs

### Risk 1: AI Model Download Failure
**风险：** 首次使用时下载 Gemini Nano 模型可能因网络问题失败
**缓解措施：**
- 检测下载失败，自动回退到元数据提取
- 显示友好提示，建议用户稍后重试
- 不阻塞核心剪贴功能

### Risk 2: Hardware Incompatibility
**风险：** 部分用户硬件不满足要求，AI 功能不可用
**缓解措施：**
- 运行时检测 API 可用性
- 不支持的浏览器隐藏 AI 相关 UI
- 保持现有手动输入功能完全可用

### Risk 3: Performance Impact
**风险：** AI 生成可能消耗较多 CPU/内存，影响页面性能
**缓解措施：**
- 异步生成，不阻塞主线程
- 使用 Web Worker（如果 API 支持）
- 提供禁用 AI 选项（未来增强）

### Risk 4: User Activation Requirement
**风险：** 某些场景下可能不满足用户激活要求
**缓解措施：**
- 确保在用户点击剪贴按钮时调用 API
- 对于重新生成，用户主动点击按钮满足要求
- 失败时静默回退，不显示错误

### Risk 5: Content Script Lifecycle
**风险：** Content Script 可能被页面导航卸载，中断生成
**缓解措施：**
- 使用异步非阻塞生成
- 在生成完成前如果页面导航，放弃生成（不影响已保存的内容）
- 考虑在 Background Service Worker 中重试（未来增强）

### Trade-off 1: Async vs Immediate Title
**权衡：** 异步生成导致标题不会立即显示
**决策：** 优先保证响应性，接受标题延迟更新
**理由：** 用户立即看到"已保存"反馈比等待 AI 生成更重要

### Trade-off 2: Browser Compatibility
**权衡：** AI 功能仅在 Chrome 138+ 中可用
**决策：** 接受功能限制，确保不支持的浏览器体验不受影响
**理由：** 渐进增强，核心功能在所有浏览器可用

## Open Questions

1. **Q: 是否需要保存原始 AI 生成的标题？**
   - A: 暂不需要。如果用户编辑后想恢复，可以重新生成。

2. **Q: 是否支持批量重新生成所有标题？**
   - A: 不在 MVP 范围内。可以单独触发每个项目的重新生成。

3. **Q: 如何处理生成内容过长的情况？**
   - A: Summarizer API 对输入长度有限制。如果超出限制，截取前 N 个字符。

4. **Q: 是否需要支持其他 AI 类型（key-points, tldr）？**
   - A: 不在 MVP 范围内。仅使用 headline 类型生成标题。

5. **Q: 用户如何禁用 AI 功能？**
   - A: 不在 MVP 范围内。未来可以添加设置选项。

## Migration Plan

**部署步骤：**
1. 添加 `aiTitleGenerator.ts` 工具函数
2. 更新 Content Script 集成 AI 生成
3. 更新 Sidebar UI 添加重新生成按钮
4. 更新 IndexedDB schema（添加可选字段，无迁移）
5. 测试在支持和不支持 AI 的浏览器中表现

**回滚策略：**
- 移除 AI 生成调用，恢复原有标题提取逻辑
- 保留 `aiGenerated` 字段（可选，不影响现有功能）
- 部署前准备 rollback 分支

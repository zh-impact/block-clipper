## Context

Block Clipper 是一个基于 WXT 框架的浏览器扩展，当前仅支持英文界面。项目采用：
- **技术栈**: WXT + React 19 + TypeScript 5.9 + IndexedDB
- **架构**: Content Scripts（内容捕获）、Background Service Worker（存储和导出）、Sidebar UI（主界面）、Popup UI（快捷操作）
- **现状**: 所有用户界面文本硬编码为英文

用户已在 `public/_locales/` 创建了 `en` 和 `zh_CN` 目录，准备添加国际化支持。

## Goals / Non-Goals

**Goals:**
- 支持中英文双语界面，根据浏览器语言自动选择
- 使用 Chrome Extension i18n API 实现国际化
- 提取所有硬编码用户文本到消息文件
- 确保 i18n 在 WXT 预渲染构建过程中正常工作
- 提供清晰的翻译文件结构，便于后续扩展更多语言

**Non-Goals:**
- 不修改核心功能逻辑（clipping、存储、导出）
- 不增加服务器端组件
- 不实现用户语言偏好设置（使用浏览器语言）
- 不支持实时语言切换（需要扩展重新加载）

## Decisions

### 1. 使用 Chrome Extension i18n API

**决策**: 采用 Chrome 原生 i18n API (`chrome.i18n.getMessage()`)

**理由**:
- Chrome Extension 内置支持，无需额外依赖
- 自动根据浏览器语言加载对应消息文件
- 支持复数形式和占位符替换
- 构建时 WXT 自动处理 locales

**实现**:
```typescript
// 在组件中使用
const title = chrome.i18n.getMessage('extensionName');
const deleteConfirm = chrome.i18n.getMessage('confirmDelete', { count: 1 });
```

### 2. 消息文件组织结构

**决策**: 在 `public/_locales/{locale}/messages.json` 中组织翻译

**理由**:
- Chrome Extension 标准目录结构
- WXT 自动识别并处理
- 每个语言独立文件，便于维护

**文件结构**:
```
public/_locales/
├── en/messages.json
└── zh_CN/messages.json
```

### 3. 消息 Key 命名规范

**决策**: 使用层次化 key 命名，以功能区域为前缀

**规范**:
- 使用点号分隔的命名空间：`feature.entity.action`
- 示例：`clips.delete.title`, `export.success.message`

**好处**:
- 避免命名冲突
- 清晰的上下文组织
- 便于批量查找和维护

### 4. TypeScript 类型安全

**决策**: 创建类型定义文件，确保 i18n key 的类型安全

**实现**:
```typescript
// types/i18n.ts
export type I18nKey =
  | 'extensionName'
  | 'clips.delete.title'
  | 'export.success.message'
  // ... 其他 keys
  | string; // 允许动态 key
```

### 5. 预渲染兼容性处理

**决策**: 在预渲染环境中避免调用浏览器 API

**实现**:
- 在组件中使用 `chrome.i18n.getMessage()` 时包装在 useEffect 中
- 或使用环境检测避免预渲染时访问

**示例**:
```typescript
// 预渲染安全
const [t, setT] = useState('');
useEffect(() => {
  setT(chrome.i18n.getMessage('extensionName'));
}, []);
```

### 6. Hook 封装

**决策**: 创建 `useI18n` hook 简化 i18n 使用

**实现**:
```typescript
// hooks/useI18n.ts
export function useI18n() {
  const getMessage = (key: string, substitutions?: Record<string, string | number>) => {
    return chrome.i18n.getMessage(key, substitutions);
  };

  return { t: getMessage };
}
```

## Data Flow

```
User Component (renders)
    ↓
chrome.i18n.getMessage(key, substitutions)
    ↓
Chrome Extension i18n API
    ↓
Retrieves message from _locales/{locale}/messages.json
    ↓
Returns translated string
    ↓
Component displays translated text
```

## Migration Plan

**阶段 1：创建消息文件和类型（1-2 小时）**
1. 扫描所有组件，提取硬编码文本
2. 创建 `public/_locales/en/messages.json`
3. 创建 `public/_locales/zh_CN/messages.json`
4. 创建 `types/i18n.ts` 类型定义文件

**阶段 2：创建 i18n Hook（0.5 小时）**
1. 实现 `hooks/useI18n.ts`
2. 添加类型安全的 getMessage 包装器

**阶段 3：更新组件使用 i18n（2-3 小时）**
1. 更新 Popup UI 组件
2. 更新 Options 页面组件
3. 更新 Sidepanel 主界面组件
4. 更新 Background 通知消息
5. 更新 Content Scripts UI（如 visual selector）

**阶段 4：更新 WXT 配置（0.5 小时）**
1. 在 `wxt.config.ts` 添加 `default_locale: 'en'`
2. 确保 `public/_locales` 目录正确配置

**阶段 5：测试和验证（1 小时）**
1. 测试中文环境下扩展显示
2. 测试英文环境下扩展显示
3. 验证所有组件文本正确翻译
4. 检查构建输出包含所有消息文件

**回滚策略**:
- 每个阶段完成后提交 Git commit
- 如遇问题可快速回滚到上一个稳定版本
- 保持 `main` 分支稳定

## Risks / Trade-offs

### Risk 1: 预渲染时浏览器 API 不可用
**风险**: WXT 预渲染时调用 `chrome.i18n.getMessage()` 可能失败

**缓解措施**:
- 在组件中使用 useEffect 延迟调用
- 或使用环境检测避免预渲染时访问
- 在 WXT 配置中正确处理预渲染

### Risk 2: 消息 Key 命名冲突
**风险**: 不同模块可能使用相同的 key 名称

**缓解措施**:
- 使用层次化命名空间（feature.entity.action 格式）
- 在开始创建全局 key 注册表
- 代码审查时检查 key 重复

### Risk 3: 翻译文件维护负担
**风险**: 每次添加新功能需要更新两个语言文件

**缓解措施**:
- 在 tasks.md 中记录添加新文本的流程
- 考虑未来使用脚本辅助提取未翻译的文本
- 保持中英文翻译同步更新

### Trade-off 1: 翻译准确 vs 实时性
**权衡**: 使用专业翻译更准确，但更新较慢；机器翻译快速但可能不够准确

**决策**: 当前由开发者维护翻译，未来可考虑导入专业翻译服务

### Trade-off 2: 语言切换体验
**权衡**: 实时切换语言体验更好，但实现复杂；需要重新加载体验简单但可接受

**决策**: 使用浏览器语言，重新加载扩展生效（符合 Chrome Extension 标准）

## Open Questions

1. **Q: 是否需要支持繁体中文？**
   - A: 不在 MVP 范围内。当前仅支持简体中文（zh_CN）。如需支持可在未来添加 zh_TW。

2. **Q: 如何处理动态内容（如用户保存的网页标题）的翻译？**
   - A: 用户生成的内容（如 block title、source.title）不翻译，仅翻译 UI 界面文本。

3. **Q: 是否需要 RTL（从右到左）语言支持？**
   - A: 不在 MVP 范围内。英文和中文都是 LTR 语言，无需特殊处理。

4. **Q: 日期/时间格式是否需要本地化？**
   - A: 使用 `toLocaleString()` 等 JavaScript 内置 API 自动处理日期时间本地化。

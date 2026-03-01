# Chrome Web Store 列表素材

本文档包含发布到 Chrome Web Store 所需的所有素材和信息。

---

## 📦 发布包信息

**文件位置**: `.output/block-clipper-1.0.0-chrome.zip`
**文件大小**: 99.59 KB
**版本**: 1.0.0
**Manifest 版本**: 3

---

## 📝 商店列表内容

### 基本信息

| 字段 | 内容 |
|------|------|
| **扩展名称** | Block Clipper |
| **简短描述** (最多 132 字符) | Clip, save, and organize web content instantly. Local storage, Markdown export, full-text search. |
| **详细描述** | 见下方完整描述 |

### 详细描述

```
📋 Block Clipper - Save Web Content Instantly

Clip, save, and organize web content with one click. Perfect for researchers, students, and anyone who wants to build a personal knowledge base.

✨ KEY FEATURES

🚀 Quick Clipping
• One-click clipping with keyboard shortcut (Ctrl+Shift+Y / Cmd+Shift+Y)
• Right-click menu option for easy access
• Automatic HTML to Markdown conversion
• Captures source URL, page title, and timestamp automatically

🔍 Powerful Search
• Full-text search across all clipped content
• Perfect Chinese input method support
• Instant results as you type

📦 Easy Export
• Export as JSON or Markdown format
• Batch export all clips at once
• Export individual clips
• Smart file naming with date and count

🎨 Multiple Viewing Options
• Side Panel for browsing and managing
• Quick preview via extension popup
• Full-screen options page

🔒 Privacy First
• 100% local storage using IndexedDB
• No servers, no tracking, no data collection
• You own your data - export anytime
• Open source and transparent

⌨️ KEYBOARD SHORTCUTS

• Clip Selection: Ctrl+Shift+Y (Mac: Cmd+Shift+Y)
• Open Side Panel: Ctrl+Shift+S (Mac: Cmd+Shift+S)

🌐 USE CASES

• Research: Save articles, blog posts, and documentation
• Study: Clip lecture notes, tutorials, and examples
• Writing: Collect inspiration and reference material
• Knowledge Base: Build your personal wiki

🔧 PERMISSIONS

We request only essential permissions:

• activeTab: Access current tab content for clipping
• storage: Save your clips locally
• scripting: Inject content script for clipping
• contextMenus: Add right-click menu option
• sidePanel: Display the sidebar interface
• notifications: Show success/error messages
• windows: Open side panel in current window

Your data never leaves your device.

📖 HOW TO USE

1. Install the extension
2. Select text on any webpage
3. Press Ctrl+Shift+Y or right-click and select "Clip Selection"
4. View your clips in the Side Panel (Ctrl+Shift+S)
5. Search, export, or delete as needed

💡 TIPS

• Use keyboard shortcuts for faster workflow
• Export regularly to backup your data
• Search works in both English and Chinese
• Clips are stored permanently until you delete them

🙏 FEEDBACK

This is an open-source project. Your feedback helps us improve!

Report issues or request features at:
https://github.com/yourusername/block-clipper/issues

---

Version: 1.0.0
Category: Productivity
License: MIT
```

---

## 🖼️ 图片素材要求

### 图标 (Icons)

**已有素材** ✅

项目已包含以下尺寸的图标：
- `icon/16.png` - 16x16 px (浏览器工具栏)
- `icon/32.png` - 32x32 px (Windows 托盘)
- `icon/48.png` - 48x48 px (扩展管理页面)
- `icon/96.png` - 96x96 px (Chrome Web Store)
- `icon/128.png` - 128x128 px (Chrome Web Store、安装对话框)

### 商店截图 (Screenshots)

**需要准备** - 5 张截图 (1280x800 px 或 640x400 px)

建议的截图场景：

#### 截图 1: 主界面 - 剪藏功能
**内容**: 展示在网页上选中文字并使用快捷键剪藏的场景
**建议**:
- 在维基百科或博客文章页面
- 展示选中的文字
- 显示剪藏成功的通知

#### 截图 2: Side Panel - 列表视图
**内容**: 展示侧边栏中的剪藏列表
**建议**:
- 显示多个剪藏项
- 展示卡片式布局
- 显示搜索框

#### 截图 3: Side Panel - 详情视图
**内容**: 展示单个剪藏的详情
**建议**:
- Markdown 渲染效果
- 元数据（来源 URL、时间）
- 返回按钮和删除按钮

#### 截图 4: 搜索功能
**内容**: 展示搜索功能
**建议**:
- 搜索框中的关键词
- 搜索结果高亮
- 结果数量显示

#### 截图 5: 导出功能
**内容**: 展示导出功能
**建议**:
- 导出按钮
- 导出格式选择 (JSON/Markdown)
- 或者展示下载的文件

### 宣传图 (Promotional Images)

**需要准备** - 可选但推荐

#### 小宣传图 (Marquee Tile)
- **尺寸**: 440x280 px (最小) 到 1080x720 px
- **用途**: Chrome Web Store 首页展示
- **建议内容**:
  - 扩展名称 "Block Clipper"
  - 简短标语 "Save Web Content Instantly"
  - 剪藏图标或插图
  - 简洁的设计，突出主要功能

#### 大宣传图 (Promotional Tile)
- **尺寸**: 1280x800 px (最小) 到 1920x1080 px
- **用途**: 活动和营销材料
- **建议内容**:
  - 与小宣传图相同的设计
  - 更高分辨率

---

## 🏷️ 分类和标签

### 主分类
**Productivity** (生产力工具)

### 子分类
**Tools** (工具)

### 关键词 (用于搜索)
- clip
- save
- notes
- markdown
- highlight
- web clipper
- content saver
- research tool
- knowledge management
- productivity

---

## 🌐 语言

**主要语言**: English
**支持的语言**: 所有语言（界面是英文，但支持中文输入和内容）

---

## 🔗 链接

### 隐私政策
建议使用 GitHub 仓库的 PRIVACY.md 或创建简单的隐私政策页面：

```
 PRIVACY POLICY

Block Clipper respects your privacy and protects your data.

Data Storage:
• All data is stored locally on your device using IndexedDB
• No data is sent to any server or third-party service
• No analytics, tracking, or telemetry

Data Access:
• Only you can access your clipped content
• You can export or delete your data at any time

Permissions:
• We only request essential permissions for the extension to function
• See the extension description for detailed permission usage

Data Retention:
• Your clips are stored until you delete them
• Uninstalling the extension will delete all data
• Export your data regularly to prevent loss

Contact:
• For privacy concerns, please open an issue on GitHub
```

### 网站主页
GitHub 仓库: `https://github.com/yourusername/block-clipper`

### 支持页面
GitHub Issues: `https://github.com/yourusername/block-clipper/issues`

---

## 📋 发布检查清单

### 发布前检查

- [ ] **构建测试**
  - [ ] 生产构建成功 (`pnpm build`)
  - [ ] ZIP 包创建成功 (`pnpm zip`)
  - [ ] 在 Chrome 中加载并测试 (`chrome://extensions/`)

- [ ] **功能测试**
  - [ ] 剪藏功能正常
  - [ ] 搜索功能正常
  - [ ] 导出功能正常
  - [ ] 删除功能正常
  - [ ] 快捷键工作正常
  - [ ] 通知显示正常

- [ ] **素材准备**
  - [ ] 图标文件正确
  - [ ] 准备 5 张商店截图
  - [ ] 准备宣传图 (可选但推荐)
  - [ ] 编写隐私政策

- [ ] **文档准备**
  - [ ] README.md 更新
  - [ ] LICENSE 文件存在
  - [ ] 版本号正确 (1.0.0)

### 发布步骤

1. **注册开发者账号**
   - 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - 支付 $5 注册费（一次性）

2. **创建新项目**
   - 点击 "New Item"
   - 上传 ZIP 文件: `.output/block-clipper-1.0.0-chrome.zip`

3. **填写商店列表信息**
   - 使用本文档中的内容
   - 上传截图
   - 设置分类和标签

4. **隐私政策**
   - 上传隐私政策或提供链接
   - 确保与扩展功能一致

5. **提交审核**
   - 检查所有必填字段
   - 提交审核
   - 等待审核（通常 1-3 个工作日）

6. **发布后**
   - 监控用户反馈
   - 及时回复评论和问题
   - 准备后续版本更新

---

## 🎨 设计建议

### 截图设计

**一致性**:
- 使用相同的配色方案
- 统一的字体和样式
- 清晰的品牌标识

**清晰度**:
- 高分辨率，不模糊
- 关键元素突出显示
- 避免过多文字说明

**真实性**:
- 展示实际功能
- 使用真实内容（而非 Lorem Ipsum）
- 反映实际用户体验

---

## 📊 版本历史

### v1.0.0 (首次发布)
- ✅ 一键剪藏功能
- ✅ Side Panel 界面
- ✅ 全文搜索
- ✅ JSON/Markdown 导出
- ✅ 本地存储
- ✅ 键盘快捷键
- ✅ 右键菜单支持
- ✅ 错误处理和重试机制
- ✅ 并发请求队列
- ✅ 错误边界保护

---

## 🔧 后续改进 (v1.1+)

- [ ] 批量删除功能
- [ ] 搜索高亮
- [ ] 状态持久化
- [ ] 标签/文件夹功能
- [ ] 云同步支持
- [ ] 更多导出格式
- [ ] 主题定制

---

## 📧 联系信息

**开发者**: [Your Name]
**Email**: [your.email@example.com]
**GitHub**: https://github.com/yourusername/block-clipper
**问题反馈**: https://github.com/yourusername/block-clipper/issues

---

**准备发布日期**: [填写日期]
**实际发布日期**: [待填写]

祝你发布顺利！🚀

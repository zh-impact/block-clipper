# Block Clipper

<div align="center">

![Block Clipper Logo](public/icon/128.png)

# 📋 Block Clipper

**一个简单而强大的浏览器扩展，帮你快速保存和管理网页内容**

[![Chrome Version](https://img.shields.io/badge/Chrome-114%2B-brightgreen)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[功能特性](#功能特性) • [安装指南](#安装指南) • [使用说明](#使用说明) • [快捷键](#快捷键) • [常见问题](#常见问题)

</div>

---

## ✨ 功能特性

### 🚀 快速剪藏
- **一键剪藏**：选中文本，按快捷键或右键菜单即可保存
- **自动转换**：HTML 自动转为 Markdown 格式
- **智能提取**：自动保存页面 URL、标题和剪藏时间
- **即时反馈**：桌面通知告诉你剪藏是否成功
- **可视化选择**：Popup 中可启动 Visual Select Tool，点击页面元素后预览并确认保存

### 🔍 强大的搜索
- **全文搜索**：在所有剪藏内容中搜索关键词
- **中文支持**：完美支持中文输入法搜索
- **即时结果**：输入即搜索，无需等待

### 📦 导入导出增强
- **多种格式**：支持 JSON / Markdown
- **双通道**：支持文件与剪切板两种导入/导出通道
- **批量与单条**：可导出全部剪藏，也可在详情中导出单条
- **导入校验**：导入时会进行格式校验、错误汇总与去重跳过

### 🎨 多种查看方式
- **Popup 预览**：点击扩展图标快速查看最近剪藏
- **Options 页面**：在完整页面中管理所有剪藏
- **Side Panel**：在侧边栏中浏览和管理内容

---

## 📥 安装指南

### 开发版安装

1. 下载或克隆此仓库
```bash
git clone https://github.com/zh-impact/block-clipper.git
cd block-clipper
```

2. 安装依赖
```bash
pnpm install
```

3. 构建扩展
```bash
pnpm run build
```

4. 在 Chrome 中加载扩展
   - 打开 Chrome，访问 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `.output/chrome-mv3` 目录

### Chrome Web Store（即将推出）

> 🎯 即将发布到 Chrome Web Store，敬请期待！

---

## 📖 使用说明

### 剪藏内容

有三种方式可以剪藏网页内容：

#### 方式 1: 键盘快捷键 ⚡
1. 在网页上选中你想要保存的文本
2. 按 `Ctrl+Shift+Y`（Mac: `Cmd+Shift+Y`）
3. 完成！你会看到剪藏成功的通知

#### 方式 2: 右键菜单 🖱️
1. 选中文本
2. 右键点击
3. 选择"Clip Selection"

#### 方式 3: Popup 按钮 🔲
1. 点击扩展图标
2. 点击"🔲 Side Panel"打开侧边栏
3. 浏览和管理你的剪藏

#### 方式 4: Visual Select Tool 🎯
1. 点击扩展图标
2. 点击 "Visual Select Tool"
3. 在网页上悬停并点击目标区域
4. 在预览弹窗中确认后保存

### 查看剪藏

#### Popup（快速预览）
点击扩展图标，可以看到：
- 最近的 3 条剪藏
- 剪藏总数
- 快速访问 Options 页面和 Side Panel

#### Options 页面（完整管理，独立标签页）
右键扩展图标 → 选择"选项"，或者点击 Popup 中的"📋 Options"按钮：
- 查看所有剪藏
- 搜索和筛选
- 删除不需要的内容
- 文件/剪切板导入与导出
- 标准/紧凑两种操作密度

#### Side Panel（侧边栏）
按 `Ctrl+Shift+S` 或从 Popup 打开：
- 浏览剪藏列表
- 查看详情（Markdown 渲染）
- 快速搜索
- 单条删除和导出

### 搜索剪藏

在 Options 页面或 Side Panel 的搜索框中输入关键词：
- 支持中英文搜索
- 输入拼音时不会触发搜索（选择词组后立即搜索）
- 清空搜索框显示所有剪藏

### 导入与导出

#### 批量导出（Options / Side Panel）
1. 选择格式（JSON 或 Markdown，紧凑模式默认 JSON）
2. 选择通道：文件导出或复制到剪切板

#### 批量导入（Options / Side Panel）
1. 选择格式（JSON 或 Markdown，紧凑模式默认 JSON）
2. 选择通道：从文件导入或从剪切板导入
3. 查看导入结果（imported / skipped / failed）

#### 单条导出（详情页）
1. 打开某条剪藏详情
2. 可导出或复制 JSON / Markdown

---

## ⌨️ 快捷键

| 功能 | Windows/Linux | Mac |
|------|---------------|-----|
| 剪藏选中内容 | `Ctrl+Shift+Y` | `Cmd+Shift+Y` |
| 打开侧边栏 | `Ctrl+Shift+S` | `Cmd+Shift+S` |

> 💡 **提示**：如果快捷键与其他扩展冲突，可以在 `chrome://extensions/shortcuts` 中自定义快捷键。

---

## 🔧 隐私说明

Block Clipper 非常重视你的隐私：

### 数据存储
- ✅ **本地存储**：所有数据都存储在你的浏览器本地（IndexedDB）
- ✅ **无服务器**：不会上传任何数据到远程服务器
- ✅ **完全控制**：你可以随时删除或导出你的数据

### 权限说明
Block Clipper 请求以下权限：

| 权限 | 用途 |
|------|------|
| `activeTab` | 获取当前标签页的内容用于剪藏 |
| `storage` | 存储扩展配置和剪藏数据 |
| `scripting` | 在页面中注入内容脚本 |
| `contextMenus` | 添加右键菜单选项 |
| `sidePanel` | 显示侧边栏界面 |
| `notifications` | 显示剪藏成功/失败通知 |
| `windows` | 获取窗口信息用于打开侧边栏 |

---

## ❓ 常见问题

### Q: 剪藏的内容保存在哪里？
A: 所有剪藏内容都保存在你浏览器的 IndexedDB 中，完全在本地，不会上传到任何服务器。

### Q: 可以在不同设备间同步剪藏吗？
A: 目前不支持自动同步。但你可以通过文件或剪切板导出，再在另一台设备导入。

### Q: 支持哪些浏览器？
A: 目前仅支持 Chrome 114+ 版本（因为使用了 Side Panel API）。Firefox 和 Edge 支持在计划中。

### Q: 为什么快捷键无法关闭侧边栏？
A: Chrome Side Panel API 的限制，无法通过编程方式关闭侧边栏。你需要手动点击侧边栏的 X 按钮来关闭它。

### Q: 可以剪藏图片或视频吗？
A: 目前不支持直接剪藏图片和视频，但会保留图片和视频的链接。

### Q: 剪藏的内容大小有限制吗？
A: 没有硬性限制，但超过 50,000 字符会提示确认。建议对于超大内容，分多次剪藏。

### Q: 如何批量删除剪藏？
A: 目前需要在 Options 页面逐条删除。批量删除功能正在开发中。

### Q: 导出的文件在哪里？
A: 文件会下载到你的浏览器默认下载文件夹。

---

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与开发。

### 开发相关
- 项目使用 [WXT](https://wxt.dev/) 框架
- 前端使用 React + TypeScript
- 数据存储使用 IndexedDB
- HTML 转 Markdown 使用 [Turndown](https://github.com/mixmark-io/turndown)

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🙏 致谢

- [WXT](https://wxt.dev/) - 强大的 Web 扩展开发框架
- [Turndown](https://github.com/mixmark-io/turndown) - HTML 转 Markdown 库
- Chrome Extensions 文档和社区

---

<div align="center">

**如有问题或建议，请提交 [Issue](https://github.com/yourusername/block-clipper/issues)**

Made with ❤️ by the Block Clipper team

</div>

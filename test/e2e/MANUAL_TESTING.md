# E2E测试 - 手动测试指南

由于浏览器扩展E2E测试需要复杂的环境配置，我们提供了详细的手动测试清单。

## 如何进行手动测试

### 1. 构建扩展

```bash
pnpm run build
```

这会在 `.output/chrome-mv3` 目录生成扩展文件。

### 2. 加载扩展到浏览器

#### Chrome/Edge:
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `.output/chrome-mv3` 目录
5. 确认扩展已加载

#### Firefox:
1. 打开 `about:debugging`
2. 点击"此Firefox"
3. 点击"加载临时附加组件"
4. 选择 `.output/firefox-mv3` 目录

### 3. 测试清单

#### 第5点：Content Script Clipping测试

**博客文章测试：**
- [ ] 访问 https://dev.to 或 https://medium.com
- [ ] 选中文章标题
- [ ] 按 `Ctrl+Shift+Y` (Mac: `Cmd+Shift+Y`)
- [ ] 验证：显示"✓ Content clipped!"通知
- [ ] 打开侧边栏，验证内容已保存
- [ ] 验证Markdown转换正确

**新闻文章测试：**
- [ ] 访问 https://news.ycombinator.com 或 https://bbc.com
- [ ] 选中新闻标题和摘要
- [ ] 按 `Ctrl+Shift+Y`
- [ ] 验证：通知显示成功
- [ ] 在侧边栏中查看保存的内容

**文档页面测试：**
- [ ] 访问 https://developer.mozilla.org
- [ ] 选中包含代码的文档部分
- [ ] 按 `Ctrl+Shift+Y`
- [ ] 验证：代码块被正确转换
- [ ] 检查侧边栏中显示的Markdown

**代码块测试：**
- [ ] 访问 https://github.com
- [ ] 选中代码块
- [ ] 按 `Ctrl+Shift+Y`
- [ ] 验证：代码保留正确的格式

**边界情况：**
- [ ] 不选择任何文本，按快捷键
  - 预期：显示"✗ No content selected"错误
- [ ] 选择非常长的内容（>50KB）
  - 预期：显示确认对话框
- [ ] 选择包含特殊字符的内容（表情符号、Unicode）
  - 预期：正确保存和显示

#### 第7点：触发机制测试

**键盘快捷键测试：**
- [ ] 在任何网页选中文本
- [ ] 按 `Ctrl+Shift+Y`
- [ ] 验证：内容被剪藏
- [ ] 重复按快捷键多次
  - 预期：只剪藏一次（重复防护）

**快捷键冲突测试：**
- [ ] 访问 `chrome://extensions/shortcuts`
- [ ] 验证：可以看到"Block Clipper"快捷键
- [ ] 尝试修改快捷键
  - 预期：可以自定义
- [ ] 测试与其他扩展共存
  - 安装 LastPass、Grammarly等
  - 验证：Block Clipper快捷键仍然工作

**上下文菜单测试：**
- [ ] 在任何网页选中文本
- [ ] 右键点击
- [ ] 验证：菜单中显示"Clip Selection"选项
- [ ] 点击"Clip Selection"
- [ ] 验证：内容被剪藏

- [ ] 不选择任何文本
- [ ] 右键点击
- [ ] 验证：菜单中不显示"Clip Selection"选项

**不同页面类型测试：**
- [ ] 纯文本页面
- [ ] 富文本页面（HTML格式）
- [ ] 代码文档页面
- [ ] 表单页面（输入框、文本域）
- [ ] 包含iframe的页面

#### 完整工作流测试

**端到端剪藏流程：**
1. [ ] 在浏览器中打开任意网页
2. [ ] 选择要剪藏的内容
3. [ ] 使用快捷键或上下文菜单触发剪藏
4. [ ] 等待成功通知
5. [ ] 打开侧边栏（按 `Ctrl+Shift+S` 或点击扩展图标）
6. [ ] 在侧边栏中查看剪藏的内容
7. [ ] 点击内容查看详情
8. [ ] 验证Markdown渲染正确
9. [ ] 测试搜索功能
10. [ ] 测试删除功能

## 测试记录模板

```
测试日期：____
测试人员：____
浏览器：Chrome [ ] Edge [ ] Firefox [ ] 版本：____

测试结果：
✓ 博客文章剪藏 - 通过 / 失败
✓ 新闻文章剪藏 - 通过 / 失败
✓ 代码块剪藏 - 通过 / 失败
✓ 快捷键功能 - 通过 / 失败
✓ 上下文菜单 - 通过 / 失败

问题记录：
_________________________________________
_________________________________________
_________________________________________
```

## 常见问题

**Q: 侧边栏打不开？**
A: Chrome Side Panel API限制，无法通过编程方式打开。需要手动点击或使用快捷键。

**Q: 快捷键不工作？**
A: 检查 `chrome://extensions/shortcuts` 中是否正确设置，可能与其他扩展冲突。

**Q: 剪藏的内容格式不对？**
A: 检查控制台日志（F12），查看是否有错误信息。

**Q: 通知不显示？**
A: 检查浏览器通知权限是否已启用。

## 测试数据建议

**测试用网站：**
- 博客：https://dev.to, https://medium.com
- 新闻：https://news.ycombinator.com, https://bbc.com
- 文档：https://developer.mozilla.org, https://docs.github.com
- 代码：https://github.com, https://stackoverflow.com
- 维基：https://wikipedia.org
- 论坛：https://reddit.com

**测试内容类型：**
- 纯文本段落
- 标题（H1-H6）
- 代码块（各种语言）
- 列表（有序、无序）
- 引用块
- 表格
- 链接
- 图片
- 混合内容
- 特殊字符（Unicode、表情符号）

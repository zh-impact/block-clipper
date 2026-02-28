# Feature: Content Clipping 功能测试

## 场景1: 剪藏博客文章内容

### Given 用户在博客网站
- When 打开 https://dev.to 或 https://medium.com
- And 页面已完全加载

### When 用户选择文章标题
- Given 用户用鼠标选中文章标题（h1元素）
- And 标题文本被高亮显示

### When 触发剪藏命令
- When 按下键盘快捷键 `Ctrl+Shift+Y` (Mac: `Cmd+Shift+Y`)
- Or 右键点击并选择"Clip Selection"菜单项

### Then 剪藏应该成功
- Then 应该显示通知："✓ Content clipped!"
- And 通知在几秒后自动消失
- And 控制台日志显示："[Content Script] Clipping successful"

### When 打开侧边栏查看
- When 按下 `Ctrl+Shift+S` 打开侧边栏
- 或点击扩展图标

### Then 内容应该在侧边栏中显示
- Then 应该看到新剪藏的内容卡片
- And 卡片显示文章标题
- And 显示相对时间（如"2m ago"）
- And 显示来源网站图标

---

## 场景2: 剪藏新闻文章

### Given 用户在新闻网站
- When 打开 https://news.ycombinator.com
- And 页面已完全加载

### When 用户选择新闻标题和摘要
- Given 用户选中新闻标题
- And 选中新闻摘要段落

### When 执行剪藏操作
- When 按下 `Ctrl+Shift+Y`

### Then 剪藏成功并保存
- Then 显示成功通知
- And 内容保存到IndexedDB
- And 侧边栏中可以看到新内容

### When 查看剪藏详情
- When 在侧边栏中点击该内容

### Then 应该显示完整的Markdown格式
- Then 标题正确显示
- And 正文内容正确显示
- And 来源链接可点击
- And 时间戳正确显示

---

## 场景3: 剪藏代码块

### Given 用户在技术文档网站
- When 打开 https://developer.mozilla.org
- And 页面包含代码示例

### When 用户选择代码块
- Given 用户选中 `<pre><code>` 元素内的代码
- And 代码被高亮显示

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 代码应该正确保存
- Then 显示成功通知
- And 代码以 fenced code block 格式保存（```language）
- And 代码缩进和格式保持不变
- And 侧边栏中正确渲染代码

---

## 场景4: 剪藏包含图片的内容

### Given 用户在图文混排的文章页面
- When 打开包含图片的博客文章

### When 用户选择包含图片的内容
- Given 选中标题、段落和图片

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该保存Markdown内容
- Then 显示成功通知
- And 图片转换为Markdown图片语法 `
![alt](url)
`
- And 文本内容正确转换

---

## 场景5: 剪藏列表内容

### Given 用户在包含列表的页面
- When 打开包含列表项的文章

### When 用户选择列表
- Given 选中有序列表或无序列表

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 列表应该正确转换
- Then 显示成功通知
- And 无序列表转换为 `- item` 格式
- And 有序列表转换为 `1. item` 格式
- And 嵌套列表保持缩进结构

---

## 场景6: 剪藏引用块

### Given 用户在包含引用的页面
- When 打开包含blockquote的新闻文章

### When 用户选择引用内容
- Given 选中 `<blockquote>` 元素

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 引用应该正确转换
- Then 显示成功通知
- And 引用转换为 `> 引用内容` 格式

---

## 场景7: 剪藏包含链接的内容

### Given 用户在包含超链接的页面
- When 打开任意网页文章

### When 用户选择包含链接的文本
- Given 选中包含 `<a>` 标签的段落

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 链接应该正确转换
- Then 显示成功通知
- And 链接转换为 `[文本](url)` Markdown格式
- And 链接的title属性保留（如果有）

---

## 场景8: 大内容剪藏（>50KB）

### Given 用户在长文章页面
- When 打开一篇长文章

### When 用户选择大量内容
- Given 选中的内容超过50KB
- And 内容非常大

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该显示确认对话框
- Then 浏览器弹出确认对话框
- And 对话框显示内容大小
- And 询问是否继续

### When 用户确认继续
- When 点击"确定"按钮

### Then 应该继续剪藏
- Then 显示"Clipping..."加载通知
- And 完成后显示成功通知
- And 大内容成功保存

### When 用户取消
- When 点击"取消"按钮

### Then 剪藏应该中止
- Then 不显示成功通知
- And 内容未保存

---

## 场景9: 大内容加载指示（>5KB）

### Given 用户在包含较多内容的页面
- When 打开文章页面
- And 选中约10KB的内容

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该显示加载指示
- Then 显示通知："Clipping... Processing large content, please wait..."
- And 通知在剪藏完成后自动消失

---

## 场景10: 空选择处理

### Given 用户在任意网页
- When 打开任意网站
- And 页面已加载完成

### When 用户未选择任何内容
- Given 没有选中任何文本
- And 页面没有高亮内容

### When 尝试剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该显示错误提示
- Then 显示错误通知："✗ No content selected"
- And 或显示："Please select some text or content before clipping."
- And 不显示成功通知
- And 内容未保存到数据库

---

## 场景11: 仅包含空格的选择

### Given 用户在网页上
- When 打开任意页面

### When 用户选择只包含空格的内容
- Given 选中多个空格或制表符
- And 没有实际文本内容

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该显示错误提示
- Then 显示错误通知："No content selected"
- And 视为无效选择

---

## 场景12: 快速连续剪藏

### Given 用户已选择内容
- When 在网页上选中一段文字
- And 文字已高亮

### When 快速按两次快捷键
- When 按下 `Ctrl+Shift+Y`
- And 立即再次按下 `Ctrl+Shift+Y`

### Then 应该只剪藏一次
- Then 只显示一次成功通知
- And 只保存一条记录到数据库
- And 第二次按键被忽略（重复防护）
- And 控制台日志显示："Clipping already in progress, ignoring duplicate request"

---

## 场景13: 剪藏特殊字符和Unicode

### Given 用户在包含特殊内容的页面
- When 打开包含表情符号的博客
- Or 打开包含Unicode字符的页面

### When 用户选择特殊内容
- Given 选中包含表情符号（😀 🎉 🚀）的文本
- Or 选中包含中文、日文、阿拉伯文的内容
- Or 选中包含数学符号（∑ ∫ ∂）的内容

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 特殊字符应该正确保存
- Then 显示成功通知
- And Unicode字符正确保存
- And 表情符号正确显示
- And 特殊符号不丢失

---

## 场景14: 剪藏动态加载的内容

### Given 用户在动态内容网站
- When 打开使用JavaScript加载内容的网站
- And 初始内容为空或占位符

### When 等待内容加载
- When 等待AJAX请求完成
- And 页面内容已完全加载

### When 选择动态内容
- Given 选中动态加载的文本
- And 内容已显示在页面上

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 动态内容应该被剪藏
- Then 显示成功通知
- And 动态加载的内容正确保存

---

## 场景15: 剪藏表格内容

### Given 用户在包含表格的页面
- When 打开包含数据表格的文档

### When 用户选择表格
- Given 选中 `<table>` 元素

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 表格应该转换为Markdown
- Then 显示成功通知
- And 表格转换为Markdown表格格式
- And 表格结构尽量保持

---

## 场景16: 剪藏嵌套标题结构

### Given 用户在结构化文档页面
- When 打开技术文档或教程

### When 用户选择多个标题层级
- Given 选中h1、h2、h3标题及其内容
- And 内容有层级结构

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 标题层级应该保持
- Then 显示成功通知
- And h1转换为 `#`
- And h2转换为 `##`
- And h3转换为 `###`
- And 层级关系正确

---

## 场景17: 剪藏表单输入内容

### Given 用户在包含表单的页面
- When 打开包含输入框的页面

### When 用户选择输入框中的文本
- Given 点击输入框
- And 全选输入内容（`Ctrl+A`）
- And 文本被选中

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 输入内容应该被剪藏
- Then 显示成功通知
- And 输入框的值被正确保存
- And 不包含表单HTML元素

---

## 场景18: 验证剪藏内容的完整性

### Given 已成功剪藏内容
- When 已执行剪藏操作
- And 收到成功通知

### When 在侧边栏查看
- When 打开侧边栏
- And 点击剪藏的内容

### Then 应该显示完整信息
- Then 显示完整的Markdown内容
- And 显示来源URL
- And 显示来源标题
- And 显示剪藏时间（ISO 8601格式）
- And 来源URL可点击（在新标签打开）
- And Markdown正确渲染

---

## 场景19: 剪藏失败处理

### Given 存储服务出现问题
- When IndexedDB已满
- Or 存储服务发生错误

### When 尝试剪藏
- When 选中内容
- And 按下 `Ctrl+Shift+Y`

### Then 应该显示错误通知
- Then 显示错误通知："✗ Clipping failed"
- And 通知包含错误信息
- And 控制台记录错误日志
- And 用户知道出了什么问题

---

## 场景20: 剪藏验证 - 博客平台特定

### Given 用户在Medium博客
- When 打开 https://medium.com/@user/article

### When 选择Medium文章内容
- Given 选中文章标题
- And 选中文章正文
- And Medium可能有特定的HTML结构

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该正确处理
- Then 显示成功通知
- And Markdown格式正确
- And 清理了Medium特定的HTML结构

---

## 场景21: 剪藏验证 - 开发者文档

### Given 用户在GitHub仓库页面
- When 打开 https://github.com/user/repo
- And 页面包含README或代码

### When 选择README内容
- Given 选中README markdown或代码

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该正确处理
- Then 显示成功通知
- And GitHub Flavored Markdown被正确处理
- And 代码块保持格式

---

## 场景22: 剪藏验证 - 维基百科

### Given 用户在Wikipedia页面
- When 打开 https://wikipedia.org 的任意文章

### When 选择文章内容
- Given 选中文章介绍段落
- And 选中引用链接

### When 执行剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 应该正确处理
- Then 显示成功通知
- And 维基百科特定的HTML被正确转换
- And 内部链接保留

---

## 场景23: 批量剪藏不同内容

### Given 用户在同一页面
- When 打开一个长文章页面

### When 剪藏第一段内容
- Given 选中第一段
- And 按 `Ctrl+Shift+Y`
- Then 收到成功通知

### When 剪藏第二段内容
- Given 选中第二段
- And 按 `Ctrl+Shift+Y`
- Then 收到成功通知

### When 剪藏第三段内容
- Given 选中第三段
- And 按 `Ctrl+Shift+Y`
- Then 收到成功通知

### When 在侧边栏查看
- When 打开侧边栏

### Then 应该看到所有剪藏
- Then 侧边栏显示3个独立的内容卡片
- And 按时间倒序排列（最新的在前）
- And 每个内容都可以单独查看

---

## 场景24: 剪藏内容的元数据完整性

### Given 用户在网页上
- When 打开 https://example.com/page

### When 选择并剪藏内容
- Given 选中页面内容
- And 按 `Ctrl+Shift+Y`

### When 查看保存的元数据
- When 在侧边栏打开剪藏的内容

### Then 元数据应该完整
- Then **source.url** 是当前页面URL
- And **source.title** 是页面标题
- And **source.favicon** 是网站图标URL（如果存在）
- And **createdAt** 是剪藏时间（ISO 8601格式）
- And **updatedAt** 与createdAt相同
- And **type** 正确检测（text/code/heading/quote/list）
- And **content** 是转换后的Markdown

---

## 测试检查清单

打印此清单用于测试记录：

```
测试日期：_________
测试浏览器：Chrome [ ] Edge [ ] Firefox [ ]
测试人员：_________

### 内容剪藏测试
□ 场景1: 博客文章剪藏
□ 场景2: 新闻文章剪藏
□ 场景3: 代码块剪藏
□ 场景4: 包含图片的内容
□ 场景5: 列表内容剪藏
□ 场景6: 引用块剪藏
□ 场景7: 链接内容剪藏

### 边界情况测试
□ 场景8: 大内容（>50KB）确认对话框
□ 场景9: 大内容（>5KB）加载指示
□ 场景10: 空选择错误提示
□ 场景11: 仅空格选择
□ 场景12: 快速连续剪藏（重复防护）
□ 场景13: 特殊字符和Unicode
□ 场景14: 动态加载内容

### 内容类型测试
□ 场景15: 表格内容
□ 场景16: 嵌套标题结构
□ 场景17: 表单输入内容

### 数据完整性测试
□ 场景18: 验证剪藏内容完整性
□ 场景19: 错误处理

### 平台特定测试
□ 场景20: Medium博客
□ 场景21: GitHub文档
□ 场景22: Wikipedia

### 批量操作测试
□ 场景23: 批量剪藏不同内容
□ 场景24: 元数据完整性

通过：____ / 24
失败：____ / 24

问题记录：
_________________________________________________
_________________________________________________
_________________________________________________
```

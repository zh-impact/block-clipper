# Feature: Trigger Mechanisms 功能测试

## 场景1: 使用键盘快捷键剪藏

### Given 用户在浏览器中打开任意网页
- When 打开 https://example.com
- And 页面已完全加载
- And Block Clipper扩展已加载

### When 用户选中网页上的文本
- Given 使用鼠标选中一段文字
- And 文本被高亮显示

### When 用户按下键盘快捷键
- When 按下 `Ctrl+Shift+Y` (Windows/Linux)
- Or 按下 `Cmd+Shift+Y` (Mac)

### Then 应该触发剪藏操作
- Then 显示通知："✓ Content clipped!"
- And 内容被保存到数据库
- And 控制台日志显示剪藏成功

---

## 场景2: 快捷键不选择文本时

### Given 用户在网页上
- When 打开任意网站
- And 页面已加载

### When 用户未选择文本
- Given 没有选中任何内容
- And 页面没有高亮区域

### When 用户按下快捷键
- When 按下 `Ctrl+Shift+Y`

### Then 应该显示错误提示
- Then 显示错误通知："No content selected"
- And 或显示："Please select some text or content before clipping."
- And 不执行剪藏操作

---

## 场景3: 快捷键跨平台兼容性

### Given Windows用户
- When 在Windows系统的Chrome浏览器中
- And 已安装Block Clipper扩展

### When 使用Windows快捷键
- When 选中文字
- And 按下 `Ctrl+Shift+Y`

### Then 剪藏应该成功
- Then 显示成功通知

### Given Mac用户
- When 在macOS系统的Chrome浏览器中
- And 已安装Block Clipper扩展

### When 使用Mac快捷键
- When 选中文字
- And 按下 `Cmd+Shift+Y`

### Then 剪藏应该成功
- Then 显示成功通知

---

## 场景4: 快捷键自定义

### Given 用户想修改快捷键
- When 访问 `chrome://extensions/shortcuts`
- And 找到Block Clipper扩展

### When 修改快捷键设置
- When 点击快捷键编辑按钮
- And 输入新的快捷键组合（如 `Ctrl+Shift+K`）
- And 保存设置

### Then 新快捷键应该生效
- When 在网页上选中文字
- And 按下新的快捷键 `Ctrl+Shift+K`
- Then 剪藏操作被触发
- And 显示成功通知

---

## 场景5: 快捷键与其他扩展冲突检测

### Given 用户安装了多个扩展
- When 已安装Block Clipper
- And 已安装LastPass (快捷键: `Ctrl+Shift+L`)
- And 已安装Grammarly (快捷键: `Ctrl+Shift+G`)

### When 使用Block Clipper快捷键
- When 选中文字
- And 按下 `Ctrl+Shift+Y`

### Then 只有Block Clipper响应
- Then Block Clipper执行剪藏
- And LastPass不被触发
- And Grammarly不被触发
- And 没有冲突错误

### When 使用其他扩展快捷键
- When 按下 `Ctrl+Shift+L` (LastPass)
- Then 只有LastPass响应
- And Block Clipper不被触发

---

## 场景6: 快捷键在隐私/无痕模式

### Given 用户在隐私浏览模式
- When 打开Chrome无痕窗口
- And Block Clipper扩展已启用

### When 在隐私模式中使用快捷键
- When 选中文字
- And 按下 `Ctrl+Shift+Y`

### Then 剪藏应该正常工作
- Then 显示成功通知
- And 内容被保存
- And 功能与普通模式相同

---

## 场景7: 快捷键在多个标签页

### Given 用户打开多个标签页
- When 标签页1: https://example.com
- And 标签页2: https://google.com
- And 标签页3: https://github.com
- And Block Clipper在所有标签页中已注入

### When 在标签页1中剪藏
- Given 切换到标签页1
- And 选中文字
- And 按下 `Ctrl+Shift+Y`
- Then 显示标签页1的成功通知

### When 在标签页2中剪藏
- Given 切换到标签页2
- And 选中文字
- And 按下 `Ctrl+Shift+Y`
- Then 显示标签页2的成功通知

### When 在侧边栏查看
- When 打开侧边栏
- Then 应该看到来自不同标签页的所有剪藏
- And 每条记录有正确的来源URL

---

## 场景8: 快捷键重复按下的重复防护

### Given 用户已选中文字
- When 在网页上选中一段文字
- And 文字保持高亮

### When 快速连续按两次快捷键
- When 按下 `Ctrl+Shift+Y`
- And 立即再次按下 `Ctrl+Shift+Y`（在第一次剪藏完成前）

### Then 应该只剪藏一次
- Then 只显示一次成功通知
- And 数据库中只有一条记录
- And 控制台显示："Clipping already in progress, ignoring duplicate request"

---

## 场景9: 右键上下文菜单 - 有选择时

### Given 用户在网页上
- When 打开任意网站
- And 页面已加载

### When 用户选中文字
- Given 使用鼠标选中一段文字
- And 文本被高亮

### When 用户右键点击
- When 在选中的文字上点击鼠标右键

### Then 上下文菜单应该显示"Clip Selection"
- Then 浏览器上下文菜单打开
- And 菜单中包含"Clip Selection"选项
- And 选项位置合理（通常在顶部区域）
- And 选项有适当的图标

---

## 场景10: 右键上下文菜单 - 无选择时

### Given 用户在网页上
- When 打开任意网站
- And 页面已加载

### When 用户未选择文字
- Given 没有选中任何内容
- And 页面正常显示

### When 用户右键点击
- When 在页面任意位置点击鼠标右键

### Then 上下文菜单不应该显示"Clip Selection"
- Then 浏览器上下文菜单打开
- And 菜单中不包含"Clip Selection"选项
- And 其他正常菜单项显示

---

## 场景11: 通过上下文菜单剪藏

### Given 用户选中了文字
- When 在网页上选中一段文字
- And 文字被高亮

### When 用户通过上下文菜单剪藏
- When 右键点击打开上下文菜单
- And 点击"Clip Selection"菜单项

### Then 剪藏操作应该执行
- Then 上下文菜单关闭
- And 显示通知："✓ Content clipped!"
- And 内容被保存到数据库

---

## 场景12: 上下文菜单在不同内容类型上

### Given 用户在纯文本页面
- When 打开纯文本网站

### When 选择纯文本并右键
- Given 选中纯文本段落
- And 右键点击

### Then 应该显示菜单项
- Then 上下文菜单包含"Clip Selection"
- And 点击后成功剪藏

### Given 用户在富文本页面
- When 打开包含格式的文章

### When 选择富文本并右键
- Given 选中包含加粗、斜体的文本
- And 右键点击

### Then 应该显示菜单项
- Then 上下文菜单包含"Clip Selection"
- And 点击后成功剪藏

---

## 场景13: 上下文菜单在代码块上

### Given 用户在代码文档页面
- When 打开包含代码的文档页面
- And 代码在 `<pre>` 或 `<code>` 元素中

### When 选择代码块
- Given 选中代码内容
- And 代码被高亮

### When 右键点击代码块
- When 在选中的代码上右键点击

### Then 应该显示菜单项
- Then 上下文菜单包含"Clip Selection"
- And 点击后代码被正确剪藏
- And 代码格式在Markdown中保留

---

## 场景14: 上下文菜单在输入框中

### Given 用户在包含表单的页面
- When 打开包含输入框的表单页面

### When 在输入框中选择文本
- Given 点击输入框激活它
- And 选中输入框中的部分文字
- Or 选中输入框中的全部文字 (`Ctrl+A`)

### When 右键点击输入框
- When 在选中的文字上右键点击

### Then 应该显示菜单项
- Then 上下文菜单包含"Clip Selection"
- And 点击后输入框内容被剪藏
- And 不包含表单HTML元素

---

## 场景15: 上下文菜单在文本域中

### Given 用户在包含textarea的页面
- When 打开包含 `<textarea>` 的页面

### When 在文本域中选择文本
- Given 点击textarea激活它
- And 选中textarea中的多行文字

### When 右键点击文本域
- When 在选中的文字上右键点击

### Then 应该显示菜单项
- Then 上下文菜单包含"Clip Selection"
- And 点击后textarea内容被剪藏
- And 多行格式保持

---

## 场景16: 上下文菜单在iframe内容上

### Given 用户在包含iframe的页面
- When 打开包含嵌入式iframe的页面
- And iframe中有内容

### When 选择iframe中的内容（限制情况）
- Given 尝试选择iframe内的内容
- And iframe有跨域限制

### Then 上下文菜单行为
- Then 如果能选择iframe内容：
  - And 上下文菜单包含"Clip Selection"
  - And 可以成功剪藏
- Or 如果有安全限制：
  - And 跨域限制阻止访问
  - And 用户得到适当的错误提示
- And 扩展优雅地处理限制

---

## 场景17: 快捷键在不同页面类型上

### Given 用户在纯文本页面
- When 打开 data:text/plain,Hello World

### When 选择文本并使用快捷键
- Given 选中"Hello World"
- And 按下 `Ctrl+Shift+Y`

### Then 应该成功剪藏
- Then 显示成功通知
- And 文本内容被正确保存

### Given 用户在HTML页面
- When 打开包含复杂HTML的页面

### When 选择HTML内容并使用快捷键
- Given 选中包含各种HTML元素的内容
- And 按下 `Ctrl+Shift+Y`

### Then 应该成功剪藏
- Then HTML被转换为Markdown
- And 显示成功通知
- And 转换质量良好

---

## 场景18: 快捷键在动态内容页面上

### Given 用户在SPA（单页应用）
- When 打开使用React/Vue/Angular的网站
- And 内容通过JavaScript动态加载

### When 等待内容加载
- When 等待页面完全加载
- And 动态内容已显示

### When 选择动态内容并使用快捷键
- Given 选中动态加载的文字
- And 按下 `Ctrl+Shift+Y`

### Then 应该成功剪藏
- Then 显示成功通知
- And 动态内容被正确捕获
- And 不受JavaScript框架影响

---

## 场景19: 快捷键与浏览器默认快捷键冲突

### Given 用户在可编辑页面
- When 在Google Docs或其他在线编辑器中

### When 浏览器默认快捷键优先级
- Given 编辑器使用了 `Ctrl+Shift+Y`
- And Block Clipper也使用 `Ctrl+Shift+Y`

### When 在编辑器中按快捷键
- When 光标在可编辑区域
- And 按下 `Ctrl+Shift+Y`

### Then 可能的行为
- Then 优先级取决于焦点位置：
  - 如果焦点在编辑器中：
    - And 编辑器快捷键可能优先
    - Or 扩展快捷键仍然工作
  - 如果焦点不在编辑器中：
    - And Block Clipper快捷键工作

### 解决方案
- When 用户自定义快捷键
- And 在 `chrome://extensions/shortcuts` 中修改
- Then 使用不冲突的快捷键组合

---

## 场景20: 触发机制的可靠性

### Given 用户频繁使用剪藏功能
- When 在一天内多次使用
- And 在不同网站上使用
- And 剪藏各种类型的内容

### Then 触发机制应该稳定
- Then 快捷键每次都响应
- And 上下文菜单每次都显示（当有选择时）
- And 没有假阴性（应该触发时不触发）
- And 没有假阳性（不应该触发时触发）
- And 响应时间小于1秒

---

## 场景21: 键盘快捷键的键盘导航兼容性

### Given 用户使用键盘导航
- When 不使用鼠标，只用键盘
- And 使用 `Tab` 键在页面元素间导航

### When 使用键盘选择文本
- Given 使用 `Shift + 方向键` 选择文本
- Or 使用其他键盘选择方法

### When 使用快捷键触发剪藏
- When 按下 `Ctrl+Shift+Y`

### Then 剪藏应该成功
- Then 显示成功通知
- And 与鼠标选择的效果相同
- And 键盘用户可以完整使用功能

---

## 场景22: 扩展未启用时的行为

### Given Block Clipper扩展已安装但未启用
- When 访问 `chrome://extensions`
- And Block Clipper显示为灰色（禁用状态）

### When 用户尝试使用快捷键
- When 在网页上选中文字
- And 按下 `Ctrl+Shift+Y`

### Then 不应该发生任何事
- Then 不显示通知
- And 不执行剪藏
- And 浏览器没有错误

### 当用户右键点击
- When 右键点击选中的文字

### Then 上下文菜单
- Then 不显示"Clip Selection"选项
- And 只显示浏览器默认菜单项

---

## 场景23: 扩展更新后快捷键保留

### Given Block Clipper发布更新
- When 扩展有新版本
- And 用户更新扩展

### When 用户自定义了快捷键
- Given 用户之前自定义了快捷键为 `Ctrl+Shift+K`

### Then 更新后自定义快捷键应该保留
- When 用户查看 `chrome://extensions/shortcuts`
- Then 快捷键仍然是 `Ctrl+Shift+K`
- And 不是默认的 `Ctrl+Shift+Y`
- And 用户不需要重新配置

---

## 场景24: 上下文菜单图标和文本

### Given 用户选中文字并右键
- When 在网页上选中文字
- And 右键点击

### Then 菜单项应该清晰可识别
- Then "Clip Selection"文本清晰
- And 有适当的图标（如剪刀图标）
- And 菜单项样式与其他扩展一致
- And 悬停时有视觉反馈

---

## 测试检查清单

打印此清单用于测试记录：

```
测试日期：_________
测试浏览器：Chrome [ ] Edge [ ] Firefox [ ]
测试人员：_________

### 键盘快捷键测试
□ 场景1: 基本快捷键剪藏
□ 场景2: 无选择时的快捷键
□ 场景3: 跨平台兼容性 (Win/Mac)
□ 场景4: 快捷键自定义
□ 场景5: 与其他扩展冲突检测
□ 场景6: 隐私模式兼容性
□ 场景7: 多标签页使用
□ 场景8: 快速连按重复防护
□ 场景19: 与浏览器快捷键冲突
□ 场景21: 键盘导航兼容性

### 上下文菜单测试
□ 场景9: 有选择时显示菜单
□ 场景10: 无选择时不显示菜单
□ 场景11: 通过菜单剪藏
□ 场景12: 不同内容类型
□ 场景13: 代码块
□ 场景14: 输入框
□ 场景15: 文本域
□ 场景16: iframe内容
□ 场景24: 菜单图标和文本

### 特殊场景测试
□ 场景17: 不同页面类型
□ 场景18: 动态内容页面
□ 场景20: 触发机制可靠性
□ 场景22: 扩展未启用时的行为
□ 场景23: 扩展更新后快捷键保留

通过：____ / 24
失败：____ / 24

问题记录：
_________________________________________________
_________________________________________________
_________________________________________________
```

## 测试环境要求

- **浏览器版本**: Chrome 114+ 或最新稳定版
- **操作系统**: Windows 10/11, macOS, 或 Linux
- **其他扩展**: 建议禁用其他剪藏扩展以避免干扰
- **网络连接**: 需要（因为扩展需要访问background script）

## 测试前准备

1. 构建扩展：`pnpm run build`
2. 加载扩展到 `chrome://extensions/`
3. 确认扩展已启用（不是灰色）
4. 刷新测试网页
5. 清空之前的剪藏数据（可选）

## 测试后清理

1. 打开侧边栏查看所有剪藏
2. 删除测试数据（可选）
3. 记录测试结果
4. 报告发现的任何问题

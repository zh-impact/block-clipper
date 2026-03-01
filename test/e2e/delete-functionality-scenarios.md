# 删除功能测试场景

本文档描述 Block Clipper 删除功能的端到端测试场景，采用 **Given-When-Then** 格式。

---

## 测试环境准备

### 前置条件
1. 扩展已正确安装并启用
2. 用户可以访问 Sidebar (侧边栏)
3. 至少有一个已保存的 clip 用于测试

### 准备测试数据
```bash
# 在测试前创建一些测试 clips
1. 打开任意网页
2. 选择并剪藏几段不同的文字内容
3. 确保在 Sidebar 中可以看到这些 clips
```

---

## 测试场景

### 场景 1: 确认删除单个 clip

**优先级**: ⭐⭐⭐

**Given**:
- 用户在 Sidebar 的列表视图中
- 列表中至少有一个 clip

**When**:
- 用户点击某个 clip 卡片，进入详情视图
- 用户点击"Delete"（删除）按钮
- 用户在确认对话框中点击"确定"

**Then**:
- 显示删除成功的通知
- 返回到列表视图
- 被删除的 clip 不再出现在列表中
- 其他 clips 保持不变

---

### 场景 2: 取消删除单个 clip

**优先级**: ⭐⭐⭐

**Given**:
- 用户在 Sidebar 的详情视图中
- 正在查看某个 clip 的详情

**When**:
- 用户点击"Delete"（删除）按钮
- 用户在确认对话框中点击"取消"

**Then**:
- 对话框关闭
- 仍停留在详情视图
- clip 内容保持不变
- 没有显示删除通知

---

### 场景 3: 删除后列表状态更新

**优先级**: ⭐⭐⭐

**Given**:
- Sidebar 中有多个 clips（至少 3 个）
- 用户当前在列表视图

**When**:
- 用户打开第 2 个 clip 的详情
- 用户确认删除该 clip
- 返回列表视图

**Then**:
- 列表自动刷新
- 删除的 clip 不再显示
- 原第 1、3、4... 个 clips 的顺序保持
- clip 计数更新（总数 -1）
- 搜索模式被重置（如果之前在搜索）

---

### 场景 4: 删除最后一个 clip

**优先级**: ⭐⭐⭐

**Given**:
- Sidebar 中只有一个 clip
- 用户在该 clip 的详情视图中

**When**:
- 用户点击"Delete"按钮
- 用户确认删除

**Then**:
- 显示删除成功通知
- 显示空状态（"No clips yet"）界面
- 显示快捷键提示
- clip 计数显示为 0

---

### 场景 5: 删除时存储错误处理

**优先级**: ⭐⭐

**Given**:
- 用户在详情视图中
- 模拟存储错误（使用浏览器 DevTools 或篡改 IndexedDB）

**When**:
- 用户点击"Delete"按钮
- 用户确认删除

**Then**:
- 显示错误通知
- clip 仍然存在
- 可以重试删除操作
- 错误消息清晰说明问题

---

### 场景 6: 快速连续删除操作

**优先级**: ⭐⭐

**Given**:
- Sidebar 中有多个 clips
- 用户在列表视图

**When**:
- 用户快速删除多个 clips（每次都确认）
- 每次删除后返回列表

**Then**:
- 每个删除操作独立处理
- 没有删除错误的 clip
- 所有删除完成后状态一致
- 每次删除都显示通知

---

### 场景 7: 搜索结果中的删除

**优先级**: ⭐⭐⭐

**Given**:
- 用户在搜索模式（有搜索关键词）
- 搜索结果中显示多个 clips

**When**:
- 用户打开搜索结果中的某个 clip
- 用户确认删除该 clip

**Then**:
- 返回列表视图
- 搜索结果更新（删除的 clip 不再显示）
- 搜索关键词保持不变
- clip 计数更新

---

### 场景 8: 分页状态下的删除

**优先级**: ⭐⭐

**Given**:
- Sidebar 中有超过 50 个 clips（触发分页）
- 用户在第二页或更后面的页面

**When**:
- 用户删除当前页的一个 clip

**Then**:
- 返回第一页（重置到第一页）
- 显示更新后的列表
- clip 计数正确更新
- 可以正常浏览所有 clips

---

### 场景 9: 删除时的键盘操作

**优先级**: ⭐⭐

**Given**:
- 用户使用键盘导航
- 焦点在"Delete"按钮上

**When**:
- 用户按 Enter 或 Space 键触发删除
- 在确认对话框中按 Enter 确认

**Then**:
- 删除操作执行成功
- 完全可以通过键盘完成
- 无需鼠标操作

---

### 场景 10: 删除后重新加载扩展

**优先级**: ⭐⭐⭐

**Given**:
- 用户删除了一些 clips
- 关闭 Sidebar

**When**:
- 重新打开 Sidebar
- 或刷新扩展（chrome://extensions/）

**Then**:
- 已删除的 clips 不会重新出现
- 列表状态与删除前一致
- 数据持久化正常工作

---

### 场景 11: 选中状态的删除

**优先级**: ⭐⭐

**Given**:
- 用户在列表视图
- 某个 clip 被键盘选中（高亮显示）

**When**:
- 用户按 Enter 打开详情
- 用户删除该 clip

**Then**:
- 返回列表后选中状态重置
- 没有 clip 被选中
- 可以正常使用键盘导航

---

### 场景 12: 删除时的通知行为

**优先级**: ⭐

**Given**:
- 用户删除一个 clip

**When**:
- 删除操作完成

**Then**:
- 显示绿色成功通知（3 秒后自动消失）
- 通知消息："Clip deleted successfully"
- 如果 Sidebar 未打开，显示系统通知

---

## 测试检查清单

### 基础功能（必须通过）
- [ ] 场景 1: 确认删除单个 clip
- [ ] 场景 2: 取消删除单个 clip
- [ ] 场景 3: 删除后列表状态更新
- [ ] 场景 4: 删除最后一个 clip
- [ ] 场景 10: 删除后重新加载扩展

### 错误处理（重要）
- [ ] 场景 5: 删除时存储错误处理
- [ ] 场景 7: 搜索结果中的删除

### 边界情况（建议测试）
- [ ] 场景 6: 快速连续删除操作
- [ ] 场景 8: 分页状态下的删除
- [ ] 场景 9: 删除时的键盘操作
- [ ] 场景 11: 选中状态的删除
- [ ] 场景 12: 删除时的通知行为

---

## 如何测试

### 手动测试步骤

1. **准备测试环境**
   ```bash
   # 构建扩展
   pnpm run build

   # 加载到浏览器
   chrome://extensions/ -> 开发者模式 -> 加载已解压的扩展程序
   ```

2. **创建测试数据**
   - 打开任意网页（如 Wikipedia、新闻网站）
   - 选择并剪藏 5-10 段不同的文字

3. **执行测试场景**
   - 按照上述场景逐一测试
   - 验证每个 Then 条件
   - 记录结果

4. **验证结果**
   - 检查 IndexedDB 中的数据
   - 重新打开 Sidebar 验证状态
   - 测试搜索和分页功能

### 自动化测试（未来）

```typescript
// 示例：Playwright 测试
test('should delete clip with confirmation', async ({ page }) => {
  // Given: User has clips in sidebar
  await page.goto('https://example.com');
  await setupTestClips(5);

  // When: User deletes a clip
  await page.click('[data-testid="clip-item-0"]');
  await page.click('[data-testid="delete-button"]');
  await page.click('[data-testid="confirm-delete"]');

  // Then: Clip is deleted
  await expect(page.locator('[data-testid="clip-item-0"]')).toHaveCount(0);
  await expect(page.locator('.toast-success')).toContainText('deleted successfully');
});
```

---

## 常见问题

### Q: 删除后 clips 仍然显示？
**A**: 检查：
- IndexedDB 是否正确更新
- 列表是否重新加载
- 是否有缓存问题（刷新页面）

### Q: 删除通知不显示？
**A**: 检查：
- Toast 组件是否正常工作
- 是否有错误发生
- 检查控制台日志

### Q: 删除操作无响应？
**A**: 检查：
- StorageService 是否正确初始化
- IndexedDB 是否可用
- 检查网络/存储权限

---

## 相关文档

- **E2E 测试索引**: `test/e2e/INDEX.md`
- **剪藏功能测试**: `test/e2e/content-clipping-scenarios.md`
- **触发机制测试**: `test/e2e/trigger-mechanisms-scenarios.md`
- **存储层实现**: `utils/storage.ts`
- **Sidebar 组件**: `entrypoints/sidepanel/App.tsx`

---

## 测试记录模板

| 场景 | 日期 | 测试者 | 结果 | 备注 |
|------|------|--------|------|------|
| 场景 1 | | | ✅ / ❌ | |
| 场景 2 | | | ✅ / ❌ | |
| 场景 3 | | | ✅ / ❌ | |
| ... | | | ✅ / ❌ | |

**问题记录**:
- 日期:
- 场景:
- 问题描述:
- 重现步骤:
- 截图:

---

感谢你的测试贡献！🙏

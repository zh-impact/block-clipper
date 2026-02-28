# 自动化E2E测试配置指南

如果你想运行自动化E2E测试，需要以下设置：

## 步骤1：安装Playwright

```bash
pnpm add -D @playwright/test playwright
```

## 步骤2：创建Playwright配置文件

在项目根目录创建 `playwright.config.ts`：

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 为扩展测试设置环境
  webServer: {
    command: 'pnpm run build && npx http-server .output/chrome-mv3 -p 3000',
    port: 3000,
    timeout: 120000,
  },
});
```

## 步骤3：更新package.json脚本

添加以下脚本到 `package.json`：

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

## 浏览器扩展E2E测试的特殊挑战

扩展测试的复杂性：

1. **需要加载扩展到浏览器**
   - 每次测试都要加载扩展
   - 需要处理扩展权限

2. **需要Mock浏览器API**
   - chrome.runtime
   - chrome.storage
   - chrome.contextMenus

3. **内容脚本隔离**
   - Content script在独立的上下文运行
   - 无法直接访问扩展内部状态

## 实际建议

**对于此项目，推荐方案：**

1. ✅ **使用现有的单元/集成测试** - 已覆盖核心功能
2. ✅ **使用手动测试清单** - 详见 `MANUAL_TESTING.md`
3. ✅ **在真实浏览器中手动测试** - 最可靠的方式

**如果确实需要自动化，考虑：**

- 测试提取后的核心逻辑（不依赖浏览器API）
- 使用API测试框架测试background service
- 使用组件测试测试UI部分

## 快速开始手动测试

```bash
# 1. 构建扩展
pnpm run build

# 2. 加载到浏览器
# Chrome: chrome://extensions/ -> 开发者模式 -> 加载已解压的扩展程序
# 选择: .output/chrome-mv3

# 3. 测试
# - 访问任意网站
# - 选择文本
# - 按 Ctrl+Shift+Y
# - 检查通知
# - 打开侧边栏查看结果
```

## 结论

E2E测试文件已创建作为**测试用例文档和手动测试指南**。

如需真正的自动化测试，需要：
1. 安装Playwright（约200MB）
2. 配置扩展加载机制
3. Mock或实现Chrome API
4. 编写测试辅助工具

**ROI评估**：
- 配置时间：4-8小时
- 维护成本：高
- 收益：低（核心功能已被单元/集成测试覆盖）

**建议**：使用手动测试清单进行E2E测试，节省时间，质量更高。

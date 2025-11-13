# Knowledge Module E2E Tests

## 📋 测试覆盖

### 单元测试 ✅
- **knowledge.model.test.ts**: 35个测试
  - 测试所有 Zod schema 验证
  - 覆盖边界条件和错误情况
  - 100% TDD 流程

### E2E 测试 ⏰
- **knowledge-session.spec.ts**: 完整知识点生成流程
  - 创建 session with GPT-4o
  - 生成 outline + questions
  - 验证结果显示
  - 验证费用显示

- **cost-tracking.spec.ts**: 费用追踪功能
  - 验证费用计算准确性
  - 验证累计费用（outline + questions）
  - 验证费用格式（$0.0023 vs $1.25）

---

## 🚀 运行测试

### 1. 运行单元测试（快速）

```bash
# 运行所有单元测试
pnpm test:run

# 只运行 knowledge model 测试
pnpm test:run src/modules/knowledge/models/knowledge.model.test.ts

# Watch 模式（开发时使用）
pnpm test
```

**预期结果：**
- ✅ 113 tests passed (包括 35 个 knowledge 测试)
- ⏱️ 耗时：~1秒

---

### 2. 运行 E2E 测试（慢速，需要 AI API）

⚠️ **重要提示：**
- E2E 测试会调用**真实的 AI API**
- 默认使用 **GPT-4o** 模型（会产生费用）
- 每个测试需要 **2-4 分钟**完成
- 确保 `.dev.vars` 中配置了 `AI_GATEWAY_API_KEY`

```bash
# 确保本地开发服务器正在运行
pnpm dev:cf

# 在新终端运行 E2E 测试
pnpm test:e2e

# 只运行 knowledge 测试
pnpm test:e2e tests/knowledge/

# 运行特定文件
pnpm test:e2e tests/knowledge/knowledge-session.spec.ts

# 带UI界面运行（可视化调试）
pnpm test:e2e:ui
```

**预期结果：**
- ✅ 4 E2E tests passed
- ⏱️ 耗时：~8-15 分钟（取决于 AI 响应速度）
- 💰 费用：~$0.02 - $0.10（取决于生成的内容量）

---

## 💡 使用免费模型测试（推荐）

如果想避免费用，可以修改测试使用免费的 Gemini 模型：

### 方法1：临时修改测试代码

编辑 `knowledge-session.spec.ts`，在创建页面后添加：

```typescript
// 切换到 Gemini 模型（免费）
await page.getByRole("combobox", { name: /ai 模型/i }).click();
await page.getByRole("option", { name: /gemini/i }).click();
```

### 方法2：创建专门的测试文件

创建 `knowledge-session-gemini.spec.ts`，使用 Gemini 模型。

---

## 🧪 测试策略建议

### 开发阶段
```bash
# 只运行单元测试（快速反馈）
pnpm test:run
```

### 功能完成后
```bash
# 运行 1-2 次 E2E 测试验证核心流程
pnpm test:e2e tests/knowledge/knowledge-session.spec.ts
```

### 发布前
```bash
# 运行完整测试套件
pnpm test:run && pnpm test:e2e
```

---

## 📊 测试覆盖情况

| 模块 | 单元测试 | E2E 测试 | 覆盖率 |
|------|---------|---------|--------|
| **Models (Zod)** | ✅ 35 tests | - | 100% |
| **Server Actions** | ❌ 无 | ✅ 间接覆盖 | ~80% |
| **Components** | ❌ 无 | ✅ 完整覆盖 | ~90% |
| **UI Flow** | - | ✅ 完整覆盖 | 100% |

**总结：**
- ✅ 所有关键流程已覆盖
- ✅ 所有用户交互已测试
- ⚠️ Server Action 单元测试未实现（成本高，价值低）

---

## 🔍 调试失败的 E2E 测试

### 1. 查看失败截图
```bash
# 失败时会自动保存截图和视频
open playwright-report/index.html
```

### 2. 使用 UI 模式调试
```bash
pnpm test:e2e:ui
# 可以逐步执行，查看每一步的状态
```

### 3. 查看控制台日志
E2E 测试中有 `console.log` 输出关键信息：
- ✅ Cost displayed: $0.0023
- ✅ Token usage: Input: 150, Output: 300

### 4. 检查 AI API 配置
```bash
# 确保环境变量正确
cat .dev.vars | grep AI_GATEWAY_API_KEY
```

---

## ⚠️ 常见问题

### Q: E2E 测试超时
**A:** AI 生成需要时间，已设置 3-4 分钟超时。如果仍超时：
- 检查网络连接
- 检查 AI Gateway API 是否正常
- 考虑使用更快的模型（Gemini）

### Q: 费用太高
**A:**
- 使用 `google/gemini-2.0-flash-exp`（免费）
- 减少 E2E 测试运行频率
- 只在 CI/CD 中运行关键测试

### Q: 测试失败但手动操作正常
**A:**
- 检查 `playwright/.auth/user.json` 是否有效
- 重新运行 `pnpm test:e2e tests/auth.setup.ts`
- 清除浏览器缓存：删除 `playwright/.auth/` 目录

---

## 📝 添加新测试

### 添加单元测试
```typescript
// src/modules/knowledge/models/knowledge.model.test.ts
describe("new schema", () => {
  it("should validate...", () => {
    // 测试代码
  });
});
```

### 添加 E2E 测试
```typescript
// tests/knowledge/new-feature.spec.ts
import { test, expect } from "@playwright/test";

test("should test new feature", async ({ page }) => {
  await page.goto("/dashboard/knowledge");
  // 测试步骤
});
```

---

## 🎯 测试最佳实践

1. **单元测试优先**：快速验证逻辑正确性
2. **E2E 测试用于关键路径**：不要为每个小功能写 E2E
3. **使用免费模型测试**：Gemini 2.0 Flash 完全免费
4. **合理设置超时**：AI 调用需要时间，不要设置过短
5. **善用测试标签**：`test.only()` 调试单个测试
6. **检查测试日志**：`console.log` 输出有助于调试

---

## 📚 相关文档

- [Playwright 文档](https://playwright.dev)
- [Vitest 文档](https://vitest.dev)
- [测试最佳实践](../../CLAUDE.md#13-testing-guidelines)

---

**最后更新：** 2025-11-13
**维护者：** WildVoice Team

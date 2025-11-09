# Knowledge Page - Phase 4 Implementation Tracker

> **Purpose**: 分步实施追踪文档，遵循「先跑通最简单的端到端流程，再逐步添加功能」的开发模式
> **Created**: 2025-11-09
> **Status**: 🔄 In Progress

---

## 📋 开发流程概览

根据最佳实践，我们采用以下开发流程：

```
阶段 0: ✅ 理解意图 (Understand Intent)
阶段 1: ✅ 需求对齐 (Align Requirements)
阶段 2: ✅ 设计决策 (Design Decisions)
阶段 3: 🔄 创建规划 (Create Plan) ← 我们在这里
阶段 4: ⏳ 分步实现 (Incremental Implementation)
阶段 5: ⏳ 反馈迭代 (Feedback Loop)
```

---

## 阶段 2: 技术决策记录 (Design Decisions)

### 已确认的关键决策

| 决策点 | 选择方案 | 理由 |
|-------|---------|-----|
| **前端架构** | React Client Components | 优先功能实现，需要复杂交互逻辑 |
| **AI 模型调用** | Vercel AI Gateway (单 API Key) | 简化配置，用字符串切换 provider |
| **模型支持** | `openai/gpt-4o`, `anthropic/claude-sonnet-4`, `google/gemini-2.0-flash-exp` | 三个主流模型，字符串格式 |
| **流式实现** | Phase 1: 简化版（关闭页面会中断） | 优先跑通流程，后续迭代 SSE/Durable Objects |
| **数据库关联** | 所有表都关联 `userId` | 多租户支持，数据隔离 |
| **页面路由** | `/dashboard/knowledge` | 需要登录，但所有用户可访问 |
| **视图模式** | Table + Grid 两种 | Table 适合信息密集，Grid 适合视觉展示 |
| **题目类型** | Phase 1 只支持选择题 | 架构可扩展，但先实现最简单的 |
| **Prompt 管理** | 独立 `prompts` 模块 (`src/modules/prompts/`) | 方便后续做 Prompt 管理页面，跨功能复用 prompts |

### 技术约束

- ✅ 使用 Vercel AI SDK `streamObject` 进行结构化输出
- ✅ 遵循 `src/modules/auth/` 的模块化架构
- ✅ 使用 Server Actions（不用 API Routes）
- ✅ Drizzle ORM + Cloudflare D1
- ✅ shadcn/ui 组件库（不引入新 UI 库）

---

## 阶段 4: 分步实现计划 (Incremental Implementation)

**核心原则**：
> 先跑通最简单的端到端流程（走查完整路径）
> 然后逐步添加功能（横向扩展）

### Step 1: 创建数据库 Schema + 一个简单的 Server Action

**目标**: 建立数据基础设施

**任务清单**:
- [x] 创建独立的 `prompts` 模块（跨功能复用）
  - [x] 创建 `src/modules/prompts/schemas/prompt.schema.ts`
    - [x] `prompts` 表（包含 `userId` 外键，支持用户自定义 prompt）
  - [x] 创建 `src/modules/prompts/models/prompt.model.ts`
    - [x] Zod schema: `createPromptSchema`
    - [x] Type inference: `Prompt`, `NewPrompt`
- [x] 创建 `knowledge` 模块的数据库 schema
  - [x] 创建 `src/modules/knowledge/schemas/knowledge.schema.ts`
    - [x] `knowledge_sessions` 表（包含 `userId` 外键）
    - [x] `outlines` 表（包含 `sessionId` 外键）
    - [x] `questions` 表（包含 `sessionId`, `outlineId` 外键）
  - [x] 创建 `src/modules/knowledge/models/knowledge.model.ts`
    - [x] Zod schemas: `createSessionSchema`, `outlineItemSchema`, `questionItemSchema`
    - [x] Type inference: `KnowledgeSession`, `Outline`, `Question`
- [x] 运行数据库迁移
  - [x] `pnpm db:generate`
  - [x] `pnpm db:migrate:local`
- [x] 创建一个简单的 Server Action: `create-session.action.ts`
  - [x] 输入: `{ title: string, model: string }`
  - [x] 输出: 创建一条 session 记录（status = "pending"）
  - [x] 包含 `requireAuth()` 验证

**验收标准**:
```bash
# 在 Drizzle Studio 中能看到 4 个新表（prompts, knowledge_sessions, outlines, questions）
pnpm db:studio

# 能成功调用 Server Action 创建一条 knowledge session 记录
# 数据库中能查到该记录，且 userId 正确
```

**输出文件**:
- `src/modules/prompts/schemas/prompt.schema.ts`
- `src/modules/prompts/models/prompt.model.ts`
- `src/modules/knowledge/schemas/knowledge.schema.ts`
- `src/modules/knowledge/models/knowledge.model.ts`
- `src/modules/knowledge/actions/create-session.action.ts`
- `src/drizzle/XXXX_create_prompts_table.sql`
- `src/drizzle/XXXX_create_knowledge_tables.sql`

---

### Step 2: 创建最简页面，能显示一条假数据

**目标**: 建立 UI 基础结构

**任务清单**:
- [x] 创建页面路由 `src/app/dashboard/knowledge/page.tsx`
- [x] 创建最简单的 Table 组件，硬编码一条假数据
  - [x] 显示字段: title, model, status, createdAt
  - [x] 使用 shadcn/ui 的 `Card` 或 `Table` 组件
- [x] 添加「+ Create」按钮（暂时无功能）
- [x] 验证路由可访问，页面能正常渲染

**验收标准**:
```bash
# 访问 http://localhost:3000/dashboard/knowledge
# 能看到一个表格/卡片，显示一条假数据
# 能看到「+ Create」按钮
```

**输出文件**:
- `src/app/dashboard/knowledge/page.tsx`
- `src/modules/knowledge/components/knowledge-list-table.tsx` (临时简化版)

---

### Step 3: 连通 Server Action，能插入真实数据

**目标**: 打通前后端数据流

**任务清单**:
- [x] 创建 `get-sessions.action.ts`
  - [x] 查询当前用户的所有 sessions
  - [x] 按创建时间倒序排列
- [x] 修改 `page.tsx`，从 Server Action 获取真实数据
- [x] 更新 Table 组件，显示真实数据（如果为空，显示 Empty State）
- [x] 手动在数据库插入一条测试数据，验证页面能显示

**验收标准**:
```bash
# 页面能显示数据库中的真实数据
# 如果数据库为空，显示「暂无数据」提示
```

**输出文件**:
- `src/modules/knowledge/actions/get-sessions.action.ts`
- 更新 `src/app/dashboard/knowledge/page.tsx`
- 更新 `src/modules/knowledge/components/knowledge-list-table.tsx`

---

### Step 4: 添加 Dialog，能创建新记录

**目标**: 实现基础 CRUD 功能

**任务清单**:
- [x] 创建 `CreateDialog` 组件
  - [x] 输入框: 知识点标题
  - [x] 下拉选择: 模型（先只显示一个模型，如 `openai/gpt-4o`）
  - [x] 提交按钮
- [x] 点击「+ Create」打开 Dialog
- [x] 表单提交后调用 `create-session.action.ts`
- [x] 创建成功后，关闭 Dialog，刷新列表（使用 `router.refresh()` 或重新获取数据）
- [x] 添加 toast 提示（成功/失败）

**验收标准**:
```bash
# 点击「+ Create」按钮，弹出 Dialog
# 输入知识点，选择模型，点击提交
# 成功后，Dialog 关闭，列表中出现新记录
# 显示成功 toast
```

**输出文件**:
- `src/modules/knowledge/components/create-dialog.tsx`
- 更新 `src/app/dashboard/knowledge/page.tsx`

---

### Step 5: 添加流式生成（先只用一个模型）

**目标**: 实现核心 AI 功能

**任务清单**:
- [x] 更新 `create-session.action.ts`，添加大纲生成逻辑
  - [x] 使用 Vercel AI Gateway: `model: "openai/gpt-4o"`
  - [x] 使用 `streamObject` 生成大纲
  - [x] 保存大纲到 `outlines` 表
  - [x] 更新 session 状态为 `"generating_questions"`
- [x] 创建 `generate-questions.action.ts`
  - [x] 并行为每个大纲生成题目
  - [x] 使用 `streamObject` 生成题目
  - [x] 保存题目到 `questions` 表
  - [x] 更新 session 状态为 `"completed"`
- [x] 创建 `GenerationDialog` 组件
  - [x] 显示当前阶段: "生成大纲中..." / "生成题目中..." / "完成"
  - [x] 显示生成进度（简化版：只显示状态文字）
  - [x] 完成后显示元数据（耗时、token 数量）
- [x] 创建默认 prompt（临时硬编码在代码中，后续移到数据库）
  - [x] Outline generation prompt
  - [x] Question generation prompt
- [ ] **优化交互流程**（当前正在进行）
  - [ ] 生成大纲后展示大纲列表
  - [ ] 用户确认后继续生成问题

**验收标准**:
```bash
# 创建知识点后，自动打开 GenerationDialog
# 能看到"生成大纲中..."的提示
# 大纲生成后，能看到"生成题目中..."
# 全部完成后，显示"完成"和元数据
# 数据库中能查到 outlines 和 questions 记录
```

**输出文件**:
- 更新 `src/modules/knowledge/actions/create-session.action.ts`
- `src/modules/knowledge/actions/generate-questions.action.ts`
- `src/modules/knowledge/components/generation-dialog.tsx`

---

### Step 6: 添加其他模型，筛选、删除等功能

**目标**: 完善功能，达到 MVP 标准

**任务清单**:
- [ ] 添加多模型支持
  - [ ] `anthropic/claude-sonnet-4`
  - [ ] `google/gemini-2.0-flash-exp`
  - [ ] 在 CreateDialog 中可选择
- [ ] 创建 `SessionFilters` 组件
  - [ ] 搜索框（按 title 搜索）
  - [ ] 模型筛选下拉框
  - [ ] 状态筛选下拉框
  - [ ] Table/Grid 视图切换按钮
- [ ] 创建 `KnowledgeListGrid` 组件
  - [ ] 卡片式展示
  - [ ] 显示关键信息 + 操作按钮
- [ ] 创建 `DetailDialog` 组件
  - [ ] 查看历史生成的详细内容
  - [ ] 显示大纲和题目
- [ ] 实现删除功能
  - [ ] `delete-session.action.ts`
  - [ ] Cascade 删除关联的 outlines 和 questions
  - [ ] 删除前确认对话框
- [ ] 插入默认 prompts 到数据库
  - [ ] 在 `src/modules/prompts/` 创建 seed 数据或默认 prompts
  - [ ] 修改 Server Actions，从 prompts 模块读取 prompts（而非硬编码）

**验收标准**:
```bash
# 能选择 3 个不同模型创建知识点
# 能通过搜索、筛选找到目标 session
# 能切换 Table/Grid 视图
# 能点击查看历史详情，看到完整的大纲和题目
# 能删除 session，数据库中记录被删除
# prompts 存储在数据库中，可以查询
```

**输出文件**:
- `src/modules/knowledge/components/session-filters.tsx`
- `src/modules/knowledge/components/knowledge-list-grid.tsx`
- `src/modules/knowledge/components/detail-dialog.tsx`
- `src/modules/knowledge/actions/delete-session.action.ts`
- `src/modules/prompts/actions/get-prompts.action.ts` (或类似的 prompt 查询功能)
- 更新其他相关文件

---

## 当前进度追踪

| Step | 状态 | 完成时间 | 备注 |
|------|------|---------|-----|
| Step 1: Database Schema + Server Action | ✅ 已完成 | 2025-11-09 | 4个表已创建并迁移 |
| Step 2: 最简页面 + 假数据 | ✅ 已完成 | 2025-11-09 | Card布局展示 |
| Step 3: 连通真实数据 | ✅ 已完成 | 2025-11-09 | get-sessions.action.ts |
| Step 4: 添加 Dialog 创建记录 | ✅ 已完成 | 2025-11-09 | CreateDialog + toast |
| Step 5: 流式生成（单模型） | 🔄 进行中 | - | 基础功能完成，正在优化交互流程 |
| Step 6: 多模型 + 筛选删除 | ⏳ 待开始 | - | - |

---

## 已知问题和待办事项

### 技术债务
- [ ] Phase 2: 实现真正的流式 UI 更新（SSE 或其他方案）
- [ ] Phase 2: 支持用户关闭页面后后台继续生成
- [ ] 添加分页功能（当 sessions 数量很多时）
- [ ] 添加 Prompt 管理页面（复用优秀 prompt）
- [ ] 扩展题目类型（填空题、判断题、关系图谱等）

### 疑问待确认
- [ ] Vercel AI Gateway 的 API Key 环境变量名称是什么？
- [ ] 是否需要在 UI 上显示"请勿关闭页面"的提示？
- [ ] Token 统计是否需要累加所有大纲生成的 tokens？

---

## 阶段 5: 反馈迭代计划

完成 Step 1-6 后，进入测试和优化阶段：

1. **功能测试**
   - [ ] 测试所有 3 个模型的生成效果
   - [ ] 测试边界情况（空输入、超长输入、网络错误）
   - [ ] 测试并发场景（同时创建多个 session）

2. **用户体验优化**
   - [ ] 添加加载状态和骨架屏
   - [ ] 优化错误提示信息
   - [ ] 添加空状态提示
   - [ ] 移动端适配

3. **性能优化**
   - [ ] 检查数据库查询效率
   - [ ] 优化大数据量渲染
   - [ ] 考虑添加缓存

---

**Last Updated**: 2025-11-09
**Next Review**: 完成 Step 1 后

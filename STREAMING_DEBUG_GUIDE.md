# Streaming Debug Guide - Chat API 流式响应调试指南

## 问题现象 (Problem Symptoms)

聊天界面在发送消息后卡住,没有流式输出内容。

## 已增强的日志系统 (Enhanced Logging System)

### 日志级别说明 (Log Levels)

| 图标 | 类型 | 含义 |
|-----|------|------|
| 🚀 | Info | 请求开始/返回响应 |
| 📋 | Info | 请求头信息 |
| 📦 | Info | 请求体解析 |
| ☁️ | Info | Cloudflare 上下文获取 |
| 🤖 | Info | 模型选择 |
| 🔄 | Info | 消息转换 |
| 🎬 | Info | 流式初始化 |
| 📨 | Info | 首个数据块接收 |
| 🔍 | Info | Web 搜索工具执行 |
| ✅ | Success | 操作成功完成 |
| ⚠️ | Warning | 配置缺失但不影响运行 |
| ❌ | Error | 错误发生 |

### 日志输出示例 (Log Output Examples)

#### 正常流程日志 (Normal Flow)

```
[2025-01-18T10:30:45.123Z] [chat] 🚀 Request received
[2025-01-18T10:30:45.125Z] [chat] 📋 Request headers {...}
[2025-01-18T10:30:45.127Z] [chat] 📦 Request body parsed {...}
[2025-01-18T10:30:45.128Z] [chat] 🤖 Model selected {"requested":"openai/gpt-4o","selected":"openai/gpt-4o"}
[2025-01-18T10:30:45.230Z] [chat] ☁️ Cloudflare context retrieved {"timeMs":102,"hasAIGatewayKey":true,"hasTavilyKey":true}
[2025-01-18T10:30:45.232Z] [chat] 🌐 AI Gateway created
[2025-01-18T10:30:45.235Z] [chat] 🔄 Messages converted {"count":2,"timeMs":3}
[2025-01-18T10:30:45.240Z] [chat] 🎬 Initializing streamText {...}
[2025-01-18T10:30:45.245Z] [chat] 🚀 Returning stream response {"streamSetupTime":5}
[2025-01-18T10:30:45.567Z] [chat] 📨 First chunk received {"timeToFirstChunk":322}
[2025-01-18T10:30:47.890Z] [chat] ✅ Stream finished {"totalTime":2645,"usage":{...}}
```

#### 带 Web 搜索的日志 (With Web Search)

```
[2025-01-18T10:31:00.123Z] [chat] 🎬 Initializing streamText {"enableWebSearch":true,...}
[2025-01-18T10:31:00.567Z] [chat] 🔍 Executing webSearch tool {"query":"latest AI trends"}
[2025-01-18T10:31:00.568Z] [webSearch] 🔍 Starting search for: "latest AI trends"
[2025-01-18T10:31:00.569Z] [webSearch] API key configured: true
[2025-01-18T10:31:00.570Z] [webSearch] ✅ Tavily client initialized
[2025-01-18T10:31:00.571Z] [webSearch] 📡 Sending search request...
[2025-01-18T10:31:01.234Z] [webSearch] ✅ Search completed in 663ms - Found 5 results
[2025-01-18T10:31:01.235Z] [webSearch] Has answer: true Answer length: 256
[2025-01-18T10:31:01.240Z] [chat] ✅ WebSearch completed {"sourcesCount":5,"hasSummary":true,"timeMs":673}
```

## 可能的问题原因 (Possible Root Causes)

### 1. Cloudflare Workers CPU 限制超时

**症状**: 日志显示到 "🎬 Initializing streamText" 后停止

**原因**: CPU 时间超过 30 秒限制

**检查方法**:
```bash
# 查看 Cloudflare Workers 日志
wrangler tail

# 查找这些关键词:
# - "CPU time limit exceeded"
# - "exceeded CPU time limit"
# - "worker exceeded"
```

**解决方案**:
1. 检查 `wrangler.jsonc` 中的 `limits.cpu_ms` 设置
2. 如果使用付费版,可以增加到 50000ms (50秒)
3. 优化模型选择,使用更快的模型
4. 禁用 Web 搜索或优化搜索逻辑

### 2. AI Gateway API Key 未配置

**症状**: 日志显示 "⚠️ WARNING: AI_GATEWAY_API_KEY not configured"

**检查方法**:
```bash
# 检查生产环境变量
wrangler secret list

# 应该看到:
# - AI_GATEWAY_API_KEY
# - TAVILY_API_KEY (如果启用 Web 搜索)
```

**解决方案**:
```bash
# 设置 AI Gateway API Key
wrangler secret put AI_GATEWAY_API_KEY
# 然后输入你的 key

# 设置 Tavily API Key (如果需要)
wrangler secret put TAVILY_API_KEY
```

### 3. 流式响应头配置问题

**症状**: 日志显示 "🚀 Returning stream response" 但没有 "📨 First chunk received"

**原因**: Cloudflare Workers 需要特定的响应头来支持流式传输

**解决方案**: AI SDK 的 `toUIMessageStreamResponse()` 应该已经处理了这些头,但如果仍有问题,可以手动检查:

```typescript
// 确保响应包含这些头
headers: {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive'
}
```

### 4. 模型推理配置冲突

**症状**: 日志显示模型初始化但没有后续输出

**检查**: 查看日志中的 `providerOptions` 配置

**可能的问题**:
- Claude 模型的 `thinking.budgetTokens` 设置过高 (15000)
- Google 模型的 `thinkingBudget` 设置过高 (8192)
- OpenAI 模型不支持当前设置的推理模式

**解决方案**: 尝试简化配置或禁用推理功能

### 5. Web 搜索工具超时

**症状**: 日志显示 "🔍 Executing webSearch tool" 后停止

**检查 Tavily API**:
```bash
# 测试 Tavily API 是否正常
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_KEY",
    "query": "test",
    "max_results": 1
  }'
```

**解决方案**:
1. 检查 TAVILY_API_KEY 是否正确
2. 检查 Tavily API 配额是否用完
3. 暂时禁用 Web 搜索功能测试

### 6. 网络连接问题

**症状**: 请求卡在某个阶段不动

**检查方法**:
- 查看 Cloudflare Workers 到 AI 提供商的网络连接
- 检查是否有防火墙或网络策略限制

## 调试步骤 (Debugging Steps)

### Step 1: 查看 Cloudflare Workers 实时日志

```bash
# 启动实时日志监控
wrangler tail --format pretty

# 在另一个终端发送测试请求
# 然后观察日志输出
```

### Step 2: 分析日志中断点

根据日志最后出现的图标,定位问题:

| 最后日志 | 问题位置 | 检查重点 |
|---------|---------|---------|
| 🚀 Request received | 请求解析失败 | 请求体格式、Content-Type |
| 📦 Request body parsed | 验证失败 | messages 数组格式 |
| ☁️ Cloudflare context | 环境变量缺失 | Cloudflare bindings 配置 |
| 🎬 Initializing streamText | 流式初始化失败 | AI Gateway 配置、网络连接 |
| 🔍 Executing webSearch | Web 搜索卡住 | Tavily API、网络超时 |
| 🚀 Returning stream response | 流式传输失败 | 响应头、Worker 限制 |

### Step 3: 逐步排除法

1. **测试最简单的请求**:
   - 禁用 Web 搜索
   - 使用默认模型 (gpt-4o)
   - 发送简短消息

2. **检查环境配置**:
```bash
# 检查所有 secrets
wrangler secret list

# 检查 D1 数据库连接
wrangler d1 execute wild-ai-lib-db --command "SELECT 1"

# 检查 R2 bucket
wrangler r2 bucket list
```

3. **测试 API 端点**:
```bash
# 使用 curl 直接测试
curl -X POST https://your-domain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ],
    "model": "openai/gpt-4o",
    "enableWebSearch": false
  }'
```

### Step 4: 检查响应流

如果响应头正常但没有数据:

```javascript
// 在浏览器开发者工具中检查
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'test' }],
    model: 'openai/gpt-4o'
  })
}).then(response => {
  console.log('Response status:', response.status);
  console.log('Response headers:', [...response.headers.entries()]);

  const reader = response.body.getReader();
  return new ReadableStream({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log('Chunk received:', new TextDecoder().decode(value));
        controller.enqueue(value);
      }
      controller.close();
    }
  });
});
```

## 性能优化建议 (Performance Optimization)

### 1. 调整超时配置

```jsonc
// wrangler.jsonc
{
  "limits": {
    "cpu_ms": 30000  // 如果经常超时,考虑升级到付费版增加限制
  }
}
```

### 2. 优化模型配置

```typescript
// 对于快速响应,使用这些配置:
const fastModels = [
  "openai/gpt-4o-mini",      // 更快的 GPT-4o 变体
  "google/gemini-2.0-flash", // 快速的 Gemini 模型
];

// 降低推理预算
providerOptions.anthropic = {
  thinking: {
    type: "enabled",
    budgetTokens: 5000  // 从 15000 降低到 5000
  }
};
```

### 3. Web 搜索优化

```typescript
// 减少搜索结果数量
maxResults: 3,  // 从 5 改为 3
searchDepth: "basic"  // 使用 basic 而不是 advanced
```

## 常见错误代码 (Common Error Codes)

| 错误代码 | 原因 | 解决方案 |
|---------|------|---------|
| 400 | 请求格式错误 | 检查 messages 数组格式 |
| 401 | API Key 无效 | 检查 AI_GATEWAY_API_KEY |
| 429 | 速率限制 | 等待或升级配额 |
| 500 | 服务器内部错误 | 查看详细日志,检查配置 |
| 524 | 超时 | 增加 cpu_ms 限制或优化请求 |

## 紧急修复 (Quick Fixes)

### 如果一切都失败了,尝试这个最小配置:

```typescript
// 在 route.ts 中临时简化配置
const result = streamText({
  model: gateway("openai/gpt-4o-mini"),  // 使用最快的模型
  messages: modelMessages,
  // 移除所有可选配置
  // stopWhen: stepCountIs(5),
  // providerOptions: undefined,
  // headers: undefined,
  // tools: {},
});

// 返回最简单的响应
return result.toDataStreamResponse();  // 而不是 toUIMessageStreamResponse
```

## 监控和告警 (Monitoring & Alerts)

### 设置 Cloudflare Analytics

1. 在 Cloudflare Dashboard 中启用 Workers Analytics
2. 关注这些指标:
   - CPU Time (应该 < 30000ms)
   - Request Duration
   - Error Rate
   - Invocations per minute

### 日志分析

```bash
# 提取错误日志
wrangler tail | grep "❌"

# 统计平均响应时间
wrangler tail | grep "totalTime" | awk '{sum+=$NF; count++} END {print sum/count}'
```

## 联系支持 (Contact Support)

如果以上所有方法都无法解决问题,请收集以下信息:

1. 完整的 `wrangler tail` 日志输出
2. 浏览器开发者工具的 Network 标签截图
3. 请求的完整 cURL 命令
4. Cloudflare Workers Analytics 截图
5. 错误发生时的时间戳

然后在项目 GitHub Issues 中提交问题报告。

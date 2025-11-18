# Cloudflare Workers 优化配置 (Optimization Guide)

## 流式响应卡住问题的可能原因和解决方案

基于你提供的截图和代码分析,这里列出最可能的原因和对应的解决方案。

---

## 🔴 高优先级排查项

### 1. AI Gateway API Key 未配置或无效

**问题表现**: 日志显示到 "🎬 Initializing streamText" 后停止

**检查方法**:
```bash
# 检查是否配置了 secret
wrangler secret list

# 应该看到 AI_GATEWAY_API_KEY 在列表中
```

**解决方案**:
```bash
# 如果没有,或者想重新设置
wrangler secret put AI_GATEWAY_API_KEY

# 输入你的 Cloudflare AI Gateway API Key
# 格式应该是: cf-<account-id>/<gateway-id>/<secret>
```

**如何获取 AI Gateway API Key**:
1. 登录 Cloudflare Dashboard
2. 进入 AI > AI Gateway
3. 创建或选择一个 Gateway
4. 复制 API Key

**临时测试**: 如果你不确定是否是这个问题,可以临时注释掉 gateway 使用:

```typescript
// 在 route.ts 中临时修改 (仅用于测试!)
const result = streamText({
    // model: gateway(selectedModelId),  // 注释这行
    model: createOpenAI({
        apiKey: env.OPENAI_API_KEY  // 直接使用 OpenAI
    })(selectedModelId.replace('openai/', '')),
    // ... 其他配置
});
```

### 2. Cloudflare Workers CPU 时间限制

**问题表现**: 请求在 30 秒后自动中断

**当前配置**: `wrangler.jsonc` 中设置 `cpu_ms: 30000`

**可能的原因**:
- AI 模型响应时间过长
- Web 搜索工具执行超时
- 推理 (thinking) 功能消耗大量时间

**解决方案 1: 优化模型配置**

```typescript
// src/app/api/chat/route.ts

// ❌ 高延迟配置 (可能超时)
providerOptions.anthropic = {
    thinking: {
        type: "enabled",
        budgetTokens: 15000  // 太高!
    }
}

// ✅ 优化后配置
providerOptions.anthropic = {
    thinking: {
        type: "enabled",
        budgetTokens: 5000  // 降低到 5000
    }
}

// 对于 Google Gemini
providerOptions.google = {
    thinkingConfig: {
        includeThoughts: true,
        thinkingBudget: 3000  // 从 8192 降低到 3000
    }
}
```

**解决方案 2: 使用更快的模型**

```typescript
// 默认模型改为更快的变体
const selectedModelId = model || "openai/gpt-4o-mini"  // 而不是 gpt-4o
```

**解决方案 3: 升级到付费版 (如果需要)**

```jsonc
// wrangler.jsonc
{
    "limits": {
        "cpu_ms": 50000  // 付费版可以提高到 50 秒
    }
}
```

### 3. Web 搜索工具超时

**问题表现**: 日志显示 "🔍 Executing webSearch tool" 后卡住

**检查 Tavily API Key**:
```bash
wrangler secret list
# 应该看到 TAVILY_API_KEY
```

**解决方案 1: 验证 Tavily API**

```bash
# 测试 Tavily API 是否正常
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_TAVILY_KEY",
    "query": "test",
    "max_results": 1
  }'
```

**解决方案 2: 优化搜索配置**

```typescript
// src/app/api/chat/route.ts

// 在 searchWeb 函数中:
const response = await tavilyClient.search(query, {
    maxResults: 3,        // 从 5 降低到 3
    searchDepth: "basic", // 确保使用 basic 而不是 advanced
    includeAnswer: true,
    searchTimeout: 5000   // 添加 5 秒超时
});
```

**解决方案 3: 添加搜索超时保护**

```typescript
// 包装 searchWeb 调用以添加超时
const searchWithTimeout = async (query: string, apiKey: string, timeoutMs: number = 8000) => {
    return Promise.race([
        searchWeb(query, apiKey),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Search timeout')), timeoutMs)
        )
    ]);
};
```

### 4. 流式响应被 Cloudflare 中断

**问题表现**: 前端没有收到任何数据

**可能原因**:
- Cloudflare 的 "Wait Until" 机制
- Response headers 不正确
- 流式响应格式问题

**检查点 1: 确认响应头**

查看日志,确保 `toUIMessageStreamResponse()` 返回了正确的头:

```typescript
// AI SDK 应该自动设置这些头,但可以验证
// 在浏览器开发者工具 Network 标签中检查:
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

**检查点 2: 测试直接流式响应**

临时测试用简化版本:

```typescript
// 在 route.ts 中临时替换
return result.toDataStreamResponse();  // 而不是 toUIMessageStreamResponse
```

如果这样可以工作,说明问题在 `toUIMessageStreamResponse` 的额外处理上。

---

## 🟡 中优先级排查项

### 5. 前端 useChat Hook 配置问题

**检查 ChatbotClient.tsx**:

```typescript
// 确保 transport 配置正确
const transport = useMemo(
    () =>
        new DefaultChatTransport({
            api: "/api/chat",
            // 添加这些选项
            fetch: fetch,
            onError: (error) => {
                console.error('[transport] Error:', error);
            }
        }),
    [],
);
```

**添加更详细的前端日志**:

```typescript
const { messages, sendMessage, status, error } = useChat({
    transport,
    onError: (error) => {
        console.error("[chatbot] Chat error:", error);
        console.error("[chatbot] Error details:", {
            message: error.message,
            stack: error.stack,
            cause: error.cause
        });
    },
    onFinish: (message) => {
        console.log("[chatbot] Message finished:", message);
    },
    // 添加这些回调
    onResponse: (response) => {
        console.log("[chatbot] Response received:", {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
        });
    }
});
```

### 6. 消息格式问题

**检查前端发送的消息格式**:

```typescript
// 在浏览器控制台运行这个来检查
console.log('Sending message:', JSON.stringify({
    messages: messages,
    model: selectedModel,
    enableWebSearch: enableWebSearch
}, null, 2));
```

**确保消息符合 UIMessage 格式**:

```typescript
interface UIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    // ... 其他字段
}
```

### 7. Network 层问题

**使用浏览器开发者工具检查**:

1. 打开 Network 标签
2. 发送消息
3. 查看 `/api/chat` 请求:
   - Status Code: 应该是 200
   - Type: 应该是 "eventsource" 或 "stream"
   - Size: 应该持续增长
   - Time: 查看是否在某个时间点停止

4. 查看 EventStream 标签:
   - 应该能看到持续的数据块
   - 如果没有,说明服务器没有发送数据

---

## 🟢 低优先级排查项

### 8. 环境变量和 Bindings

**完整检查清单**:

```bash
# 1. 检查所有 secrets
wrangler secret list

# 必需的 secrets:
# - AI_GATEWAY_API_KEY (必需)
# - TAVILY_API_KEY (如果启用 Web 搜索)

# 2. 检查 D1 数据库绑定
wrangler d1 info wild-ai-lib-db

# 3. 检查 R2 bucket 绑定
wrangler r2 bucket info wild-ai-lib-bucket
```

### 9. CORS 问题

如果前端和 Worker 在不同域名:

```typescript
// 在 route.ts 中添加 CORS 头
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

// 在返回响应时添加
return new Response(result.toUIMessageStreamResponse().body, {
    headers: {
        ...result.toUIMessageStreamResponse().headers,
        ...corsHeaders
    }
});
```

---

## 📊 推荐的调试顺序

### 第 1 步: 验证基础配置

```bash
# 1. 检查 secrets
wrangler secret list

# 2. 查看实时日志
wrangler tail --format pretty

# 3. 发送测试请求 (在另一个终端)
curl -X POST https://your-domain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"hi"}],
    "model": "openai/gpt-4o-mini",
    "enableWebSearch": false
  }'

# 4. 观察日志输出,找到卡住的位置
```

### 第 2 步: 根据日志定位问题

| 日志停在 | 检查项 | 解决方案 |
|---------|-------|---------|
| 🎬 Initializing streamText | AI Gateway Key | `wrangler secret put AI_GATEWAY_API_KEY` |
| 🔍 Executing webSearch | Tavily API | 测试 Tavily API 或禁用搜索 |
| 🚀 Returning stream response | CPU 超时 | 优化模型配置或增加 cpu_ms |
| 无任何日志 | 路由问题 | 检查 `.open-next/worker.js` |

### 第 3 步: 逐步简化配置

创建一个最小可用配置测试:

```typescript
// 临时替换 streamText 配置 (仅用于测试)
const result = streamText({
    model: gateway("openai/gpt-4o-mini"),  // 使用最快的模型
    messages: modelMessages,
    // 移除所有可选配置
    // stopWhen: undefined,
    // providerOptions: undefined,
    // headers: undefined,
    // tools: undefined,
    // toolChoice: undefined
});

return result.toDataStreamResponse();  // 最简单的响应格式
```

如果这个可以工作,说明问题在于:
- 模型配置过于复杂
- Tools 配置有问题
- toUIMessageStreamResponse 处理有问题

然后逐个添加配置,找到导致问题的部分。

---

## 🚀 生产环境优化建议

### 推荐的稳定配置

```typescript
// src/app/api/chat/route.ts

// 1. 使用更快的默认模型
const selectedModelId = model || "openai/gpt-4o-mini";

// 2. 降低推理预算
if (selectedModelId.includes("anthropic")) {
    providerOptions.anthropic = {
        thinking: {
            type: "enabled",
            budgetTokens: 5000  // 从 15000 降低
        }
    };
}

if (selectedModelId.includes("google")) {
    providerOptions.google = {
        thinkingConfig: {
            includeThoughts: true,
            thinkingBudget: 3000  // 从 8192 降低
        }
    };
}

// 3. 优化 Web 搜索
const response = await tavilyClient.search(query, {
    maxResults: 3,        // 从 5 降低
    searchDepth: "basic",
    includeAnswer: true
});

// 4. 使用更合理的 stopWhen
stopWhen: stepCountIs(3)  // 从 5 降低到 3
```

### Wrangler 配置优化

```jsonc
// wrangler.jsonc
{
    "limits": {
        "cpu_ms": 30000  // 免费版最大值
    },
    "observability": {
        "enabled": true,
        "logs": {
            "enabled": true
        }
    }
}
```

---

## 📝 故障排除清单

完成这个清单来系统性排查问题:

- [ ] **验证环境变量**
  - [ ] `wrangler secret list` 显示 `AI_GATEWAY_API_KEY`
  - [ ] 如果需要搜索: `TAVILY_API_KEY` 也存在

- [ ] **检查日志**
  - [ ] `wrangler tail` 能连接成功
  - [ ] 发送请求后能看到 🚀 日志
  - [ ] 记录最后出现的日志图标: _______________

- [ ] **测试基础配置**
  - [ ] 禁用 Web 搜索测试
  - [ ] 使用 `gpt-4o-mini` 测试
  - [ ] 使用 `toDataStreamResponse()` 测试

- [ ] **检查网络层**
  - [ ] 浏览器 Network 标签显示 200 状态
  - [ ] Response Type 是 "eventsource" 或 "stream"
  - [ ] 前端 console 没有错误

- [ ] **优化配置**
  - [ ] 降低 thinking budgets
  - [ ] 减少 Web 搜索 maxResults
  - [ ] 降低 stepCount

---

## 🆘 仍然无法解决?

如果完成了所有上述检查仍然无法解决,请收集以下信息:

1. **完整的日志输出**:
   ```bash
   wrangler tail --format pretty > debug_logs.txt
   # 然后触发问题,保存日志
   ```

2. **浏览器 Network 信息**:
   - Request Headers
   - Request Payload
   - Response Headers
   - Timing 信息

3. **Cloudflare Workers Analytics**:
   - CPU Time 使用情况
   - Error Rate
   - Request Volume

4. **环境信息**:
   ```bash
   wrangler --version
   node --version
   pnpm --version
   ```

5. **测试 cURL 命令**:
   ```bash
   curl -v -X POST https://your-domain.workers.dev/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"test"}],"model":"openai/gpt-4o-mini"}' \
     > curl_output.txt 2>&1
   ```

将这些信息发送到 GitHub Issues 或支持渠道。

# 日志查看快速指南 (Quick Log Viewing Guide)

## 在 Cloudflare Workers 中查看实时日志

### 方法 1: 使用 Wrangler Tail (推荐)

```bash
# 查看实时日志 (推荐格式化输出)
wrangler tail --format pretty

# 查看原始 JSON 日志
wrangler tail --format json

# 只查看错误日志
wrangler tail | grep "❌"

# 查看特定关键词
wrangler tail | grep "webSearch"

# 保存日志到文件
wrangler tail --format pretty > logs_$(date +%Y%m%d_%H%M%S).txt
```

### 方法 2: Cloudflare Dashboard

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages
3. 选择你的 Worker (`wild-ai-lib`)
4. 点击 "Logs" 标签
5. 点击 "Begin log stream"

## 关键日志图标说明

| 图标 | 含义 | 何时出现 |
|-----|------|---------|
| 🚀 | 请求开始/返回 | 每次 API 调用开始和结束 |
| 📋 | 请求头 | 请求开始后立即 |
| 📦 | 请求体解析 | 收到 JSON 数据后 |
| ☁️ | Cloudflare 上下文 | 获取环境变量和绑定时 |
| 🤖 | 模型选择 | 确定使用哪个 AI 模型 |
| 🔄 | 消息转换 | 转换为 AI SDK 格式时 |
| 🎬 | 流式初始化 | 开始 streamText 调用 |
| 📨 | 首个数据块 | 收到 AI 第一个响应时 |
| 🔍 | Web 搜索 | 执行 Tavily 搜索时 |
| ✅ | 成功 | 操作成功完成 |
| ⚠️ | 警告 | 配置缺失但继续运行 |
| ❌ | 错误 | 发生错误 |

## 常见日志模式

### 正常流程 (完整日志链)

```
🚀 Request received
  ↓
📋 Request headers
  ↓
📦 Request body parsed
  ↓
🤖 Model selected
  ↓
☁️ Cloudflare context retrieved
  ↓
🌐 AI Gateway created
  ↓
🔄 Messages converted
  ↓
🎬 Initializing streamText
  ↓
🚀 Returning stream response
  ↓
📨 First chunk received
  ↓
✅ Stream finished
```

### 带 Web 搜索的流程

```
🎬 Initializing streamText (enableWebSearch: true)
  ↓
🔍 Executing webSearch tool
  ↓
🔍 Starting search for: "query"
  ↓
✅ Tavily client initialized
  ↓
📡 Sending search request...
  ↓
✅ Search completed in XXXms - Found 5 results
  ↓
✅ WebSearch completed
  ↓
📨 First chunk received
  ↓
✅ Stream finished
```

## 问题诊断速查表

### 卡在某个阶段怎么办?

| 最后看到的日志 | 可能的问题 | 检查方法 |
|-------------|-----------|---------|
| 🚀 Request received | 请求解析失败 | `wrangler tail \| grep "❌"` |
| 📦 Request body parsed | 消息验证失败 | 检查 messages 数组格式 |
| ☁️ Cloudflare context | 环境变量缺失 | `wrangler secret list` |
| 🎬 Initializing streamText | AI Gateway 问题 | 检查 AI_GATEWAY_API_KEY |
| 🔍 Executing webSearch | Tavily API 超时 | 检查 TAVILY_API_KEY |
| 🚀 Returning stream response | 流式传输问题 | 检查 CPU 时间限制 |

### 性能分析

```bash
# 查看所有时间指标
wrangler tail --format pretty | grep "timeMs\|totalTime"

# 示例输出:
# "timeMs": 102          <- Cloudflare 上下文获取时间
# "timeMs": 3            <- 消息转换时间
# "timeToFirstChunk": 322 <- 首次响应时间 (TTFB)
# "totalTime": 2645      <- 总处理时间
```

**性能基准值**:
- Cloudflare 上下文: < 200ms
- 消息转换: < 10ms
- 首次响应 (TTFB): < 500ms (不含搜索)
- 首次响应 (含搜索): < 2000ms
- 总处理时间: < 10000ms

## 实用日志命令

### 1. 过滤特定会话的日志

```bash
# 查看包含特定时间戳的日志
wrangler tail --format pretty | grep "2025-01-18T10:30"
```

### 2. 统计错误率

```bash
# 统计过去 100 次请求中的错误次数
wrangler tail --format json | head -100 | grep -c "❌"
```

### 3. 监控响应时间

```bash
# 提取所有 totalTime 并计算平均值
wrangler tail --format pretty | grep "totalTime" | \
  grep -oE '[0-9]+' | awk '{sum+=$1; count++} END {print "Avg:", sum/count, "ms"}'
```

### 4. 查看环境变量状态

```bash
# 日志会显示:
# hasAIGatewayKey: true/false
# hasTavilyKey: true/false

wrangler tail --format pretty | grep "hasAIGatewayKey\|hasTavilyKey"
```

### 5. 追踪 Web 搜索性能

```bash
# 查看所有 Web 搜索相关日志
wrangler tail --format pretty | grep "webSearch"
```

## 调试工作流

### 场景 1: 响应卡住不动

```bash
# 1. 开启实时日志
wrangler tail --format pretty

# 2. 在浏览器发送测试请求

# 3. 观察日志输出,找到最后出现的图标

# 4. 根据上面的速查表定位问题

# 5. 如果看到 ⚠️ WARNING,检查环境变量
wrangler secret list

# 6. 如果卡在 🔍 webSearch,测试 Tavily API
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{"api_key":"YOUR_KEY","query":"test","max_results":1}'
```

### 场景 2: 性能慢

```bash
# 1. 查看性能指标
wrangler tail --format pretty | grep "timeMs\|totalTime"

# 2. 如果 totalTime > 25000ms,会超时
# 解决方法:
# - 使用更快的模型 (gpt-4o-mini)
# - 禁用 Web 搜索
# - 减少 thinking budget

# 3. 如果 timeToFirstChunk > 5000ms
# 检查 AI Gateway 响应时间
```

### 场景 3: 间歇性失败

```bash
# 1. 长时间监控日志
wrangler tail --format pretty > logs_monitoring.txt

# 2. 等待问题重现

# 3. 搜索错误日志
grep "❌" logs_monitoring.txt

# 4. 分析错误模式
grep "Error message:" logs_monitoring.txt | sort | uniq -c
```

## Cloudflare Dashboard Analytics

### 关键指标位置

1. **Workers Analytics**:
   - CPU Time: 应该 < 30000ms
   - Errors: 低于 1%
   - Requests: 每分钟请求数

2. **Real-time Logs**:
   - Exception 类型
   - 状态码分布
   - 地理位置分布

### 设置告警

1. 进入 Notifications
2. 创建新告警:
   - **CPU Time Alert**: CPU time > 25000ms
   - **Error Rate Alert**: Error rate > 5%
   - **Request Volume**: Requests > 1000/min

## 本地开发日志

### 使用本地 Cloudflare 环境

```bash
# 启动本地开发服务器 (带实时日志)
pnpm dev:cf

# 日志会直接输出到终端
# 所有 console.log 都可见
```

### 浏览器开发者工具

1. 打开浏览器开发者工具 (F12)
2. 进入 Network 标签
3. 发送请求
4. 查看请求详情:
   - Headers: 检查请求头
   - Payload: 检查请求体
   - Response: 查看错误信息
   - Timing: 分析响应时间

## 日志数据保留

Cloudflare Workers 日志:
- **实时日志**: 最近 30 分钟
- **Analytics**: 最近 24 小时 (免费版)
- **Analytics**: 最近 30 天 (付费版)

建议定期导出重要日志:

```bash
# 每天导出日志 (可以加入 cron job)
wrangler tail --format json > logs_$(date +%Y%m%d).json
```

## 故障排查清单

### 首次部署检查

- [ ] `wrangler secret list` 显示 `AI_GATEWAY_API_KEY`
- [ ] `wrangler secret list` 显示 `TAVILY_API_KEY` (如果需要)
- [ ] `wrangler tail` 能正常连接
- [ ] 发送测试请求能看到 🚀 日志
- [ ] 能看到完整的日志链 (从 🚀 到 ✅)

### 问题发生时检查

- [ ] `wrangler tail` 日志中找到 ❌ 错误
- [ ] 查看错误类型和堆栈
- [ ] 检查是否有 ⚠️ 警告
- [ ] 确认 CPU 时间 < 30000ms
- [ ] 检查网络连接是否正常
- [ ] 查看 Cloudflare Status Page

## 更多资源

- [Cloudflare Workers Logging Docs](https://developers.cloudflare.com/workers/observability/logging/)
- [Wrangler Tail Docs](https://developers.cloudflare.com/workers/wrangler/commands/#tail)
- [STREAMING_DEBUG_GUIDE.md](./STREAMING_DEBUG_GUIDE.md) - 完整调试指南

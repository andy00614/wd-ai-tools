# 🚀 快速调试指南 (Quick Start Debug Guide)

**问题**: 聊天界面发送消息后卡住,没有流式输出

---

## ⚡ 3 步快速诊断

### 第 1 步: 检查日志 (30 秒)

```bash
# 打开实时日志
wrangler tail --format pretty
```

**在另一个终端或浏览器发送测试消息,然后观察日志。**

### 第 2 步: 找到日志停在哪里 (找最后的图标)

| 最后的图标 | 问题 | 快速修复 |
|----------|------|---------|
| 🎬 Initializing streamText | AI Gateway 问题 | `wrangler secret put AI_GATEWAY_API_KEY` |
| 🔍 Executing webSearch | 搜索超时 | 暂时禁用搜索测试 |
| 🚀 Returning stream response | Worker 超时 | 使用更快的模型 |
| **没看到 📨 First chunk** | 流式传输失败 | 见下方修复 |

### 第 3 步: 应用快速修复

#### 修复 1: 检查 API Keys
```bash
# 必须有这两个 (至少第一个)
wrangler secret list

# 应该显示:
# AI_GATEWAY_API_KEY
# TAVILY_API_KEY (如果用搜索)
```

#### 修复 2: 测试最简配置
```bash
# 禁用搜索,使用最快的模型
curl -X POST https://your-domain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"hi"}],
    "model": "openai/gpt-4o-mini",
    "enableWebSearch": false
  }'
```

#### 修复 3: 优化已应用
代码已经做了这些优化:
- ✅ 默认模型改为 `gpt-4o-mini` (更快)
- ✅ Anthropic thinking budget: 15000 → 5000
- ✅ Google thinking budget: 8192 → 3000
- ✅ 详细日志已添加

---

## 📊 日志解读速查

### 正常流程 (应该看到所有这些):
```
🚀 Request received
📋 Request headers
📦 Request body parsed
🤖 Model selected
☁️ Cloudflare context retrieved
🌐 AI Gateway created
🔄 Messages converted
🎬 Initializing streamText
🚀 Returning stream response
📨 First chunk received        ← 关键! 如果没看到这个就是问题所在
✅ Stream finished
```

### 如果卡在某处:

**卡在 🎬 之前**:
- 问题: 配置或环境变量
- 检查: `wrangler secret list`

**卡在 🎬 和 📨 之间**:
- 问题: AI 模型响应超时
- 解决: 使用更快的模型或降低 thinking budget

**看到 🔍 但卡住**:
- 问题: Web 搜索超时
- 解决: 检查 `TAVILY_API_KEY` 或禁用搜索

**看到 ⚠️ WARNING**:
- 问题: 配置缺失但可能继续
- 解决: 查看具体警告内容

**看到 ❌ Error**:
- 问题: 明确的错误
- 解决: 查看错误信息详情

---

## 🔧 常见问题快速修复

### 问题 1: "AI_GATEWAY_API_KEY not configured"

```bash
# 获取 API Key:
# 1. 登录 Cloudflare Dashboard
# 2. AI > AI Gateway
# 3. 创建或选择 Gateway
# 4. 复制 API Key

# 设置:
wrangler secret put AI_GATEWAY_API_KEY
# 粘贴你的 key (格式: cf-xxx/xxx/xxx)
```

### 问题 2: "CPU time limit exceeded"

**方法 1: 使用更快的模型** (推荐)
- 已设置默认为 `gpt-4o-mini`

**方法 2: 升级 Workers 计划**
```jsonc
// wrangler.jsonc (需要付费版)
{
  "limits": {
    "cpu_ms": 50000  // 从 30000 提高到 50000
  }
}
```

### 问题 3: "Search timeout" 或卡在搜索

**临时禁用搜索测试**:
- 在前端关闭 Web Search 开关
- 发送测试消息

**如果禁用后正常**:
```bash
# 检查 Tavily API Key
wrangler secret list

# 测试 Tavily API
curl -X POST https://api.tavily.com/search \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_KEY",
    "query": "test",
    "max_results": 1
  }'
```

### 问题 4: 浏览器一直显示 loading

**检查浏览器控制台**:
1. F12 打开开发者工具
2. Console 标签: 查看错误
3. Network 标签: 找到 `/api/chat` 请求
   - Status: 应该是 200
   - Type: 应该是 `eventsource` 或 `stream`
   - Preview: 应该看到数据

---

## 📚 详细文档

| 文档 | 用途 |
|-----|------|
| [STREAMING_DEBUG_GUIDE.md](./STREAMING_DEBUG_GUIDE.md) | 完整的调试指南和解决方案 |
| [LOG_VIEWING_GUIDE.md](./LOG_VIEWING_GUIDE.md) | 如何查看和分析日志 |
| [CLOUDFLARE_OPTIMIZATION.md](./CLOUDFLARE_OPTIMIZATION.md) | 优化配置和性能调优 |

---

## 🆘 紧急救援

如果所有方法都试过了还是不行:

### 收集这些信息:

```bash
# 1. 日志
wrangler tail --format pretty > debug_logs.txt
# 发送一条测试消息
# Ctrl+C 停止

# 2. 环境信息
wrangler --version > debug_info.txt
node --version >> debug_info.txt
pnpm --version >> debug_info.txt

# 3. 测试请求
curl -v -X POST https://your-domain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"openai/gpt-4o-mini"}' \
  > curl_test.txt 2>&1
```

### 然后:
1. 检查 `debug_logs.txt` 中的最后几行
2. 在 [GitHub Issues](https://github.com/your-repo/issues) 提交问题
3. 附上上述 3 个文件

---

## ✅ 成功标志

**如果看到这些,说明一切正常**:

日志中:
```
✅ Stream finished {
  "totalTime": 2645,
  "usage": { ... },
  "finishReason": "stop"
}
```

浏览器:
- 消息逐字符流式显示
- 没有 loading 卡住
- Console 没有错误

Network 标签:
- Status: 200
- Type: eventsource
- Size: 持续增长
- EventStream 标签有数据

---

**祝调试顺利! 🎉**

如需帮助,请查阅详细文档或提交 Issue。

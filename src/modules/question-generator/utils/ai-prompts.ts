/**
 * AI Prompt Templates for Question Generation
 */

import type { GenerationConfig } from "../models/question-generator.model";

/**
 * Step 1: Knowledge Point Breakdown Prompt
 * Analyzes the input and breaks it down into structured knowledge points
 */
export function getKnowledgeBreakdownPrompt(input: string): string {
    return `你是一个专业的教育内容分析专家。请分析以下知识点并将其拆解为结构化的子知识点。

**输入的知识点**: ${input}

**分析要求**:
1. 识别这个知识点的主要类别（人物/事件/概念/地点/发明/流程/时间）
2. 将其拆解为3-8个核心的子知识点
3. 为每个子知识点：
   - 分配合适的类别
   - 推荐最适合的题型（可以多选）
   - 设定难度等级（1=简单，2=中等，3=困难）

**题型匹配规则** (必须严格遵守):
- 人物 (person) → **必须包含** 看图猜X (guess-image)，可选 线索题 (clue)、配对题 (matching)
- 事件 (event) → 事件排序 (event-order)、线索题 (clue)、填空题 (fill-blank)、配对题 (matching)
- 概念 (concept) → 填空题 (fill-blank)、线索题 (clue)、配对题 (matching)
- 地点 (place) → **必须包含** 看图猜X (guess-image)，可选 线索题 (clue)、配对题 (matching)
- 发明 (invention) → **必须包含** 看图猜X (guess-image)，可选 线索题 (clue)、填空题 (fill-blank)、配对题 (matching)
- 流程 (process) → 事件排序 (event-order)、配对题 (matching)
- 时间 (time) → 填空题 (fill-blank)、事件排序 (event-order)

**重要提示**:
- 对于人物、地点、发明类知识点，recommendedTypes 数组中**必须包含 "guess-image"**
- 确保生成的题型多样化，不要只推荐单一题型
- 每个知识点至少推荐 2-3 种题型

**输出示例**:
如果输入 "中国近代史"，应该拆解为：
{
  "originalInput": "中国近代史",
  "mainCategory": "event",
  "breakdown": [
    {
      "id": "point-1",
      "name": "孙中山",
      "category": "person",
      "description": "辛亥革命领导者，中华民国国父",
      "recommendedTypes": ["guess-image", "clue"],
      "difficulty": 2
    },
    {
      "id": "point-2",
      "name": "鸦片战争",
      "category": "event",
      "description": "1840-1842年中英战争",
      "recommendedTypes": ["event-order", "fill-blank", "clue"],
      "difficulty": 2
    },
    {
      "id": "point-3",
      "name": "故宫",
      "category": "place",
      "description": "北京紫禁城",
      "recommendedTypes": ["guess-image", "clue"],
      "difficulty": 1
    }
  ],
  "totalPoints": 3
}

**输出格式** (JSON):
{
  "originalInput": "输入的知识点",
  "mainCategory": "主类别",
  "breakdown": [
    {
      "id": "unique-id",
      "name": "子知识点名称",
      "category": "类别",
      "description": "简短描述",
      "recommendedTypes": ["推荐的题型数组"],
      "difficulty": 难度等级
    }
  ],
  "totalPoints": 拆解的总点数
}

请严格按照以上格式和规则返回JSON，不要包含其他内容。`;
}

/**
 * Step 2: Generate Questions Based on Knowledge Points
 * Generates specific questions for each knowledge point
 */
export function getQuestionGenerationPrompt(
    knowledgePoint: {
        name: string;
        category: string;
        description?: string;
        difficulty?: number;
    },
    questionType: string,
): string {
    const basePrompt = `你是一个专业的题目设计专家。请根据以下信息生成一道高质量的${getQuestionTypeName(questionType)}题目。

**知识点信息**:
- 名称: ${knowledgePoint.name}
- 类别: ${knowledgePoint.category}
- 描述: ${knowledgePoint.description || "无"}
- 难度: ${knowledgePoint.difficulty || 2} (1=简单, 2=中等, 3=困难)

`;

    return basePrompt + getQuestionTypeSpecificPrompt(questionType);
}

function getQuestionTypeName(type: string): string {
    const names: Record<string, string> = {
        clue: "线索",
        "fill-blank": "填空",
        "guess-image": "看图猜X",
        "event-order": "事件排序",
        matching: "配对",
    };
    return names[type] || type;
}

function getQuestionTypeSpecificPrompt(type: string): string {
    switch (type) {
        case "clue":
            return `**线索题要求**:
1. 生成4-6条线索，按照从抽象到具体的顺序排列
2. 最后一条线索应该几乎直接指向答案
3. 可以包含1-2条额外提示
4. 必须包含答案解析

**输出格式** (JSON):
{
  "id": "clue_${Date.now()}",
  "type": "clue",
  "knowledgePoint": "知识点名称",
  "difficulty": 2,
  "tags": ["相关", "标签"],
  "clues": [
    "第一条线索（最抽象）",
    "第二条线索",
    "第三条线索",
    "第四条线索（最具体）"
  ],
  "answer": "正确答案",
  "hints": ["可选提示"],
  "explanation": "答案解析说明"
}

请直接返回JSON，不要包含其他内容。`;

        case "fill-blank":
            return `**填空题要求**:
1. 设计一个包含1-3个空格的句子
2. 句子应该是一个完整的知识点陈述
3. 如果是多项选择，提供3-4个干扰选项
4. 必须包含答案解析

**输出格式** (JSON):
{
  "id": "fill_${Date.now()}",
  "type": "fill-blank",
  "knowledgePoint": "知识点名称",
  "difficulty": 2,
  "tags": ["相关", "标签"],
  "sentence": "这是一个包含____空格的句子",
  "blanks": [
    { "position": 0, "answer": "正确答案" }
  ],
  "options": ["选项1", "选项2", "选项3", "正确答案"],
  "explanation": "答案解析说明"
}

请直接返回JSON，不要包含其他内容。`;

        case "guess-image":
            return `**看图猜X要求**:
我们会使用 AI 图片生成模型（Google Imagen 4）来生成图片，所以你需要提供：

1. **imagePrompt**: 用于生成图片的英文 prompt（详细的视觉描述，符合 Imagen/FLUX 的 prompt 格式）
   - 必须是英文
   - 包含详细的视觉元素：风格、光线、构图、细节、色彩、材质等
   - 描述完整的背景环境、镜头焦段、色彩氛围
   - 若知识点与世界名画或特定艺术风格相关，请在 prompt 中注明画家/流派、年代、媒材、笔触质感
   - **不要直接提及答案本身**，但要有足够的视觉线索让用户能猜出答案
   - 例如："A historic Chinese palace with golden roof tiles and red walls, traditional imperial architecture with intricate dragon carvings, viewed from the front entrance with stone lion statues, morning sunlight casting long shadows, photorealistic style, architectural photography, 8k quality, cinematic lighting"

2. **description**: 图片的中文描述（简短，作为用户看到图片后的提示）
   - 例如："一座有着金色屋顶和红色围墙的宫殿建筑"

3. **根据答案类型，设置正确的 guessType**：
   - person（人物）：历史人物、名人、领导人等
   - place（地点）：建筑、景点、城市、国家等
   - object（物品）：发明、工具、艺术品等
   - movie（电影）：电影、电视剧等
   - other（其他）：其他类型

4. 可以包含1-2条提示
5. 必须包含答案解析

**输出格式** (JSON):
{
  "id": "image_${Date.now()}",
  "type": "guess-image",
  "knowledgePoint": "知识点名称",
  "difficulty": 2,
  "tags": ["相关", "标签"],
  "imagePrompt": "Detailed English prompt for image generation with style, lighting, composition, materials, and atmosphere. Example: A man in a black suit standing on a city street, dramatic perspective distortion with buildings bending upwards, photorealistic, cinematic lighting, 8k quality",
  "description": "简短的中文描述，例如：一位穿着中山装、留着小胡子的男士照片",
  "guessType": "person",
  "answer": "正确答案",
  "hints": ["可选提示"],
  "explanation": "答案解析说明"
}

**完整示例（答案：故宫）**:
{
  "id": "image_1234567890",
  "type": "guess-image",
  "knowledgePoint": "故宫",
  "difficulty": 2,
  "tags": ["历史", "建筑", "中国"],
  "imagePrompt": "A magnificent Chinese imperial palace complex with golden glazed roof tiles and red walls, traditional architecture with intricate dragon and phoenix carvings, massive ceremonial gates with stone lion statues, white marble staircases, viewed from the central courtyard perspective, clear blue sky background, morning sunlight creating dramatic shadows, photorealistic architectural photography style, 8k quality, sharp details, vibrant colors",
  "description": "一座宏伟的红墙金瓦宫殿建筑群",
  "guessType": "place",
  "answer": "故宫",
  "hints": ["提示：位于北京市中心", "提示：明清两代的皇家宫殿"],
  "explanation": "故宫，又称紫禁城，是中国明清两代的皇家宫殿，位于北京中轴线中心，是世界上现存规模最大、保存最完整的木质结构古建筑之一。"
}

**重要提示**:
- imagePrompt 必须非常详细，至少包含50个英文单词
- 描述风格、光线、构图、细节等多个维度
- 不要在 imagePrompt 中直接出现答案文字，但要有明显的视觉特征

请直接返回JSON，不要包含其他内容。`;

        case "event-order":
            return `**事件排序题要求**:
1. 提供3-5个相关的事件
2. 每个事件有简短描述，可选包含年份
3. 打乱顺序呈现给用户
4. 提供正确的时间顺序
5. 必须包含答案解析

**输出格式** (JSON):
{
  "id": "order_${Date.now()}",
  "type": "event-order",
  "knowledgePoint": "知识点名称",
  "difficulty": 2,
  "tags": ["相关", "标签"],
  "events": [
    { "id": "evt1", "description": "事件描述1", "year": 1840 },
    { "id": "evt2", "description": "事件描述2", "year": 1856 },
    { "id": "evt3", "description": "事件描述3", "year": 1900 }
  ],
  "correctOrder": ["evt1", "evt2", "evt3"],
  "explanation": "时间顺序解析说明"
}

请直接返回JSON，不要包含其他内容。`;

        case "matching":
            return `**配对题要求**:
1. 提供3-6对相关联的配对项
2. 左侧项和右侧项要有清晰的对应关系
3. 常见的配对类型：
   - 人物 ↔ 成就/事件
   - 概念 ↔ 定义
   - 国家/地点 ↔ 特征/首都
   - 发明 ↔ 发明家
   - 事件 ↔ 时间/结果
4. 配对应该有一定难度，避免过于简单或显而易见
5. 必须包含答案解析

**输出格式** (JSON):
{
  "id": "matching_${Date.now()}",
  "type": "matching",
  "knowledgePoint": "知识点名称",
  "difficulty": 2,
  "tags": ["相关", "标签"],
  "leftItems": [
    { "id": "left-1", "content": "左侧项1" },
    { "id": "left-2", "content": "左侧项2" },
    { "id": "left-3", "content": "左侧项3" }
  ],
  "rightItems": [
    { "id": "right-1", "content": "右侧项1" },
    { "id": "right-2", "content": "右侧项2" },
    { "id": "right-3", "content": "右侧项3" }
  ],
  "correctPairs": [
    { "leftId": "left-1", "rightId": "right-1" },
    { "leftId": "left-2", "rightId": "right-2" },
    { "leftId": "left-3", "rightId": "right-3" }
  ],
  "hints": ["可选提示"],
  "explanation": "配对关系解析说明"
}

**完整示例（答案：中国历史人物与成就）**:
{
  "id": "matching_1234567890",
  "type": "matching",
  "knowledgePoint": "中国历史人物与成就",
  "difficulty": 2,
  "tags": ["历史", "人物"],
  "leftItems": [
    { "id": "left-1", "content": "秦始皇" },
    { "id": "left-2", "content": "汉武帝" },
    { "id": "left-3", "content": "唐太宗" }
  ],
  "rightItems": [
    { "id": "right-1", "content": "统一六国" },
    { "id": "right-2", "content": "独尊儒术" },
    { "id": "right-3", "content": "贞观之治" }
  ],
  "correctPairs": [
    { "leftId": "left-1", "rightId": "right-1" },
    { "leftId": "left-2", "rightId": "right-2" },
    { "leftId": "left-3", "rightId": "right-3" }
  ],
  "hints": ["按照时间顺序思考"],
  "explanation": "秦始皇统一六国建立秦朝，汉武帝独尊儒术推行儒家思想，唐太宗开创贞观之治促进国家繁荣。"
}

**重要提示**:
- 左右两侧的项数必须相同（3-6个）
- 每个 ID 必须唯一
- 配对关系要准确无误
- 右侧项的顺序应该打乱，不要按照左侧顺序排列

请直接返回JSON，不要包含其他内容。`;

        default:
            return "请生成一个合适的题目。";
    }
}

/**
 * Batch question generation prompt
 * Generates multiple questions at once for efficiency
 */
export function getBatchQuestionGenerationPrompt(
    config: GenerationConfig,
    breakdown: {
        breakdown: Array<{
            name: string;
            category: string;
            description?: string;
            recommendedTypes: string[];
            difficulty?: number;
        }>;
    },
): string {
    return `你是一个专业的题目设计专家。请根据以下知识点拆解，为每个子知识点生成合适类型的题目。

**原始知识点**: ${config.knowledgePoint}

**知识点拆解**:
${breakdown.breakdown.map((point, index) => `${index + 1}. ${point.name} (${point.category}) - 推荐题型: ${point.recommendedTypes.join(", ")}`).join("\n")}

**生成要求**:
1. 为每个子知识点生成至少1道题
2. 选择最适合该知识点的题型
3. 题目难度参考拆解中的设定
4. 确保题目质量高、知识点准确

**输出格式** (JSON数组):
[
  {题目1 JSON},
  {题目2 JSON},
  ...
]

每个题目的JSON格式参考之前的题型要求。请直接返回JSON数组，不要包含其他内容。`;
}

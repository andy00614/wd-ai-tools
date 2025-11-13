/**
 * Script to initialize default prompt templates
 * Run this script after user signup or manually via admin panel
 */

import { getDb } from "@/db";
import { prompts } from "@/modules/prompts/schemas/prompt.schema";
import type { TemplateVariable } from "@/modules/prompts/models/prompt.model";

// Helper to create template
async function createPrompt(
    userId: string,
    name: string,
    content: string,
    type: "outline" | "quiz",
    isDefault: boolean,
    variables: TemplateVariable[],
) {
    const db = await getDb();

    await db.insert(prompts).values({
        name,
        content,
        type,
        isDefault,
        isActive: true,
        variables: JSON.stringify(variables),
        userId,
    });

    console.log(`✅ Created template: ${name}`);
}

// ===== OUTLINE TEMPLATES =====

const OUTLINE_TEMPLATE_1 = {
    name: "通用学习大纲（推荐）",
    type: "outline" as const,
    isDefault: true,
    content: `你是一位经验丰富的教育专家。请为主题"{{topic}}"生成一个结构化的学习大纲。

要求：
- 生成 {{num_sections}} 个主要章节
- 每个章节标题要简洁明了（建议10-20字）
- 章节之间要有逻辑递进关系（从基础到进阶）
- 难度等级：{{difficulty}}
- 适合学习阶段：{{learning_stage}}

返回格式（严格遵守JSON格式）：
{
  "outlines": [
    {"title": "第一章节标题"},
    {"title": "第二章节标题"},
    {"title": "第三章节标题"}
  ]
}

注意：
1. 只返回JSON，不要包含其他文字说明
2. 确保章节标题清晰、具体
3. 章节顺序要符合学习规律（从易到难）`,
    variables: [
        {
            name: "{{topic}}",
            displayName: "学习主题",
            type: "text" as const,
            required: true,
            placeholder: "例如：操作系统原理、React Hooks、数据结构",
        },
        {
            name: "{{num_sections}}",
            displayName: "章节数量",
            type: "number" as const,
            defaultValue: 5,
            min: 3,
            max: 10,
        },
        {
            name: "{{difficulty}}",
            displayName: "难度等级",
            type: "select" as const,
            defaultValue: "中等",
            options: ["入门", "中等", "进阶", "专家"],
        },
        {
            name: "{{learning_stage}}",
            displayName: "学习阶段",
            type: "select" as const,
            defaultValue: "系统学习",
            options: ["快速入门", "系统学习", "深入研究", "实战应用"],
        },
    ] as TemplateVariable[],
};

const OUTLINE_TEMPLATE_2 = {
    name: "技术深度学习大纲",
    type: "outline" as const,
    isDefault: false,
    content: `作为技术教育专家，为"{{topic}}"设计一个深度学习大纲。

目标：
- 生成 {{num_sections}} 个技术章节
- 覆盖范围：{{coverage}}
- 包含实践内容：{{include_practice}}

章节要求：
1. 理论基础（概念、原理）
2. 实现细节（源码、算法）
3. 最佳实践（设计模式、优化）
4. 实战案例（真实场景应用）

返回JSON格式：
{
  "outlines": [
    {"title": "章节1：基础概念与原理"},
    {"title": "章节2：核心实现机制"},
    {"title": "章节3：进阶特性与优化"}
  ]
}`,
    variables: [
        {
            name: "{{topic}}",
            displayName: "技术主题",
            type: "text" as const,
            required: true,
            placeholder: "例如：Vue3响应式原理、MySQL索引优化",
        },
        {
            name: "{{num_sections}}",
            displayName: "章节数量",
            type: "number" as const,
            defaultValue: 6,
            min: 4,
            max: 10,
        },
        {
            name: "{{coverage}}",
            displayName: "覆盖范围",
            type: "select" as const,
            defaultValue: "全面覆盖",
            options: ["核心要点", "全面覆盖", "深度剖析"],
        },
        {
            name: "{{include_practice}}",
            displayName: "实践内容",
            type: "select" as const,
            defaultValue: "是",
            options: ["是", "否"],
        },
    ] as TemplateVariable[],
};

const OUTLINE_TEMPLATE_3 = {
    name: "快速入门大纲",
    type: "outline" as const,
    isDefault: false,
    content: `为"{{topic}}"设计一个快速入门学习大纲。

目标：让学习者在短时间内掌握核心概念和基本使用。

要求：
- 生成 {{num_sections}} 个章节（建议3-5个）
- 每个章节聚焦一个核心知识点
- 从"是什么"→"为什么"→"怎么用"的顺序组织
- 避免过深的理论，强调实用性

返回JSON：
{
  "outlines": [
    {"title": "什么是XXX？核心概念介绍"},
    {"title": "为什么要用XXX？解决的问题"},
    {"title": "如何开始使用XXX？"}
  ]
}`,
    variables: [
        {
            name: "{{topic}}",
            displayName: "入门主题",
            type: "text" as const,
            required: true,
            placeholder: "例如：Docker容器、Git版本控制",
        },
        {
            name: "{{num_sections}}",
            displayName: "章节数量",
            type: "number" as const,
            defaultValue: 4,
            min: 3,
            max: 6,
        },
    ] as TemplateVariable[],
};

// ===== QUIZ TEMPLATES =====

const QUIZ_TEMPLATE_1 = {
    name: "标准选择题（推荐）",
    type: "quiz" as const,
    isDefault: true,
    content: `你是一位专业的题目设计专家。请为以下章节生成 5 道高质量的选择题。

章节标题：{{chapter_title}}
章节内容：{{chapter_content}}

题目要求：
1. **每题4个选项**（A、B、C、D）
2. **只有1个正确答案**
3. **题目类型多样**：
   - 概念理解题（30%）
   - 应用分析题（40%）
   - 场景判断题（30%）
4. **难度适中**：不要太简单（直接背诵），也不要太难（超纲内容）
5. **干扰项合理**：错误选项要具有迷惑性，但明确错误
6. **必须提供解释**：说明为什么这个答案是正确的，其他选项错在哪里

返回JSON格式（严格遵守）：
{
  "questions": [
    {
      "content": "关于XXX的描述，以下哪项是正确的？",
      "options": [
        "A. 选项内容（简洁明了，20字以内）",
        "B. 选项内容",
        "C. 选项内容",
        "D. 选项内容"
      ],
      "answer": "A",
      "explanation": "正确答案是A，因为...（详细解释，包含关键知识点）。B选项错误在于...。C选项...。D选项..."
    }
  ]
}

注意：
- 只返回JSON，不要其他说明文字
- 确保每题有4个选项且格式统一
- 答案必须是A/B/C/D之一
- 解释要充分、准确`,
    variables: [] as TemplateVariable[],
};

const QUIZ_TEMPLATE_2 = {
    name: "进阶难度题目",
    type: "quiz" as const,
    isDefault: false,
    content: `作为高级题目设计专家，为以下章节生成 5 道进阶难度的选择题。

章节：{{chapter_title}}
内容：{{chapter_content}}

题目特点：
1. **综合应用**：需要综合多个知识点
2. **场景分析**：给出真实场景，考察实际应用能力
3. **深度思考**：不只是记忆，要求理解原理
4. **代码理解**（如适用）：包含代码片段分析

难度分布：
- 中等难度：2题
- 较难：2题
- 困难：1题

返回JSON：
{
  "questions": [
    {
      "content": "在以下场景中，应该如何...？（给出具体场景描述）\n\n背景：[场景描述]\n问题：[具体问题]",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "这道题考察的是...（知识点）。在这个场景下，B选项是最佳方案，因为...（详细分析）。A选项虽然可行，但...。C和D选项的问题在于..."
    }
  ]
}`,
    variables: [] as TemplateVariable[],
};

const QUIZ_TEMPLATE_3 = {
    name: "基础概念题",
    type: "quiz" as const,
    isDefault: false,
    content: `为"{{chapter_title}}"生成 5 道基础概念题，帮助学习者巩固基础知识。

章节内容：{{chapter_content}}

题目要求：
1. **聚焦基础概念**：
   - 核心定义
   - 基本特性
   - 常见术语
   - 基本原理
2. **难度较低**：适合初学者
3. **表述清晰**：避免歧义和陷阱
4. **选项明确**：对错分明

返回JSON：
{
  "questions": [
    {
      "content": "以下关于[核心概念]的描述，正确的是？",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "C",
      "explanation": "C选项准确描述了[概念]的定义：...。A选项混淆了...。B选项的错误在于...。D选项描述的是另一个概念。"
    }
  ]
}`,
    variables: [] as TemplateVariable[],
};

const QUIZ_TEMPLATE_4 = {
    name: "实战应用题",
    type: "quiz" as const,
    isDefault: false,
    content: `为"{{chapter_title}}"设计 5 道实战应用题。

章节内容：{{chapter_content}}

题目设计原则：
1. **真实场景**：来自实际工作中的问题
2. **解决方案**：考察最佳实践和决策能力
3. **多维度考量**：性能、可维护性、扩展性等
4. **实用性强**：学完能在工作中应用

题目类型示例：
- "在项目中遇到XXX问题，应该如何解决？"
- "要实现XXX功能，哪种方案最合适？"
- "以下代码存在什么问题？应该如何优化？"

返回JSON：
{
  "questions": [
    {
      "content": "【场景】你正在开发一个...，需要实现...功能。\n\n【要求】...\n\n【问题】以下哪种方案最合适？",
      "options": [
        "A. 方案1：...",
        "B. 方案2：...",
        "C. 方案3：...",
        "D. 方案4：..."
      ],
      "answer": "A",
      "explanation": "在这个场景下，方案1最合适，因为...（从性能、维护性、扩展性等角度分析）。方案2的问题是...。方案3和4分别适用于...场景。"
    }
  ]
}`,
    variables: [] as TemplateVariable[],
};

// Main initialization function
export async function initDefaultPrompts(userId: string) {
    console.log("🚀 Starting to initialize default prompt templates...\n");

    try {
        // Create outline templates
        console.log("📝 Creating outline templates...");
        await createPrompt(
            userId,
            OUTLINE_TEMPLATE_1.name,
            OUTLINE_TEMPLATE_1.content,
            OUTLINE_TEMPLATE_1.type,
            OUTLINE_TEMPLATE_1.isDefault,
            OUTLINE_TEMPLATE_1.variables,
        );
        await createPrompt(
            userId,
            OUTLINE_TEMPLATE_2.name,
            OUTLINE_TEMPLATE_2.content,
            OUTLINE_TEMPLATE_2.type,
            OUTLINE_TEMPLATE_2.isDefault,
            OUTLINE_TEMPLATE_2.variables,
        );
        await createPrompt(
            userId,
            OUTLINE_TEMPLATE_3.name,
            OUTLINE_TEMPLATE_3.content,
            OUTLINE_TEMPLATE_3.type,
            OUTLINE_TEMPLATE_3.isDefault,
            OUTLINE_TEMPLATE_3.variables,
        );

        console.log("\n📝 Creating quiz templates...");
        // Create quiz templates
        await createPrompt(
            userId,
            QUIZ_TEMPLATE_1.name,
            QUIZ_TEMPLATE_1.content,
            QUIZ_TEMPLATE_1.type,
            QUIZ_TEMPLATE_1.isDefault,
            QUIZ_TEMPLATE_1.variables,
        );
        await createPrompt(
            userId,
            QUIZ_TEMPLATE_2.name,
            QUIZ_TEMPLATE_2.content,
            QUIZ_TEMPLATE_2.type,
            QUIZ_TEMPLATE_2.isDefault,
            QUIZ_TEMPLATE_2.variables,
        );
        await createPrompt(
            userId,
            QUIZ_TEMPLATE_3.name,
            QUIZ_TEMPLATE_3.content,
            QUIZ_TEMPLATE_3.type,
            QUIZ_TEMPLATE_3.isDefault,
            QUIZ_TEMPLATE_3.variables,
        );
        await createPrompt(
            userId,
            QUIZ_TEMPLATE_4.name,
            QUIZ_TEMPLATE_4.content,
            QUIZ_TEMPLATE_4.type,
            QUIZ_TEMPLATE_4.isDefault,
            QUIZ_TEMPLATE_4.variables,
        );

        console.log("\n✅ All templates created successfully!");
        console.log("\nSummary:");
        console.log("- Outline templates: 3 (1 default)");
        console.log("- Quiz templates: 4 (1 default)");
        console.log("- Total: 7 templates");

        return { success: true };
    } catch (error) {
        console.error("\n❌ Failed to initialize templates:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

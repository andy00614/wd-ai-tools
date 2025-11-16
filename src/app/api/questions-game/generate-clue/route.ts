import { type NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createGateway, generateObject } from "ai";
import { z } from "zod";
import type { ClueQuestion, GenerateClueRequest } from "@/types/questions";

// Zod schema for AI response validation
const clueQuestionSchema = z.object({
    clues: z.array(z.string()).min(3).max(7),
    answer: z.string(),
    tags: z.array(z.string()),
    hints: z.array(z.string()).optional(),
    explanation: z.string().optional(),
});

// Generate prompt for Claude
const getCluePrompt = (
    knowledgePoint: string,
    difficulty: 1 | 2 | 3,
    language: "zh" | "en",
) => {
    const difficultyMap = {
        1: { clues: "5-7", desc: "简单", style: "直接明显" },
        2: { clues: "4-5", desc: "中等", style: "需要一定推理" },
        3: { clues: "3-4", desc: "困难", style: "抽象、需要深度思考" },
    };

    const config = difficultyMap[difficulty];

    if (language === "zh") {
        return `你是一个游戏化学习专家。请为知识点"${knowledgePoint}"设计一道线索题。

要求：
- 难度：${config.desc}
- 线索数量：${config.clues}条
- 线索风格：${config.style}
- 线索排序：从最模糊/难的线索开始，逐渐变得明显（按难度递减）
- 每条线索应该独立提供信息，但不直接说出答案
- 最后一条线索可以非常接近答案，但仍需要用户思考

输出要求：
- clues: 字符串数组，每条线索是一个完整的句子
- answer: 正确答案（简短明确）
- tags: 相关标签数组（如：人物、科学、历史等）
- hints: （可选）额外提示数组
- explanation: （可选）答案解析

示例（爱迪生）：
{
  "clues": [
    "这个人生活在19-20世纪",
    "他拥有超过1000项专利",
    "他的一项发明改变了人类的夜晚",
    "他创办了通用电气公司的前身",
    "他发明了实用的电灯泡"
  ],
  "answer": "爱迪生",
  "tags": ["人物", "发明家", "历史"],
  "hints": ["提示：他的名字以'爱'开头"],
  "explanation": "托马斯·爱迪生（1847-1931），美国发明家，被称为'发明大王'"
}

现在请为"${knowledgePoint}"生成线索题：`;
    }

    return `You are a gamification learning expert. Create a clue-based quiz for the knowledge point: "${knowledgePoint}".

Requirements:
- Difficulty: ${config.desc}
- Number of clues: ${config.clues}
- Clue style: ${config.style}
- Clues ordering: Start from vague/hard clues, gradually become more obvious (descending difficulty)
- Each clue should provide independent information without revealing the answer
- The last clue can be very close to the answer but still requires thinking

Output format:
- clues: Array of strings, each clue is a complete sentence
- answer: Correct answer (brief and clear)
- tags: Related tags array (e.g., person, science, history)
- hints: (Optional) Additional hints array
- explanation: (Optional) Answer explanation

Now generate a clue quiz for "${knowledgePoint}":`;
};

export async function POST(request: NextRequest) {
    try {
        const body: GenerateClueRequest = await request.json();
        const { knowledgePoint, difficulty = 2, language = "zh" } = body;

        // Validation
        if (!knowledgePoint || knowledgePoint.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: "知识点不能为空" },
                { status: 400 },
            );
        }

        // Get Cloudflare context and AI Gateway
        const { env } = await getCloudflareContext();
        const gateway = createGateway({
            apiKey: env.AI_GATEWAY_API_KEY || "",
        });

        // Generate clue using AI
        const prompt = getCluePrompt(knowledgePoint, difficulty, language);

        console.log("[generate-clue] Generating clue for:", knowledgePoint);
        console.log("[generate-clue] Difficulty:", difficulty);
        console.log("[generate-clue] Language:", language);

        const result = await generateObject({
            model: gateway("anthropic/claude-sonnet-4"), // 使用 Claude 进行推理
            schema: clueQuestionSchema,
            prompt,
        });

        const generatedData = result.object;

        // Construct response
        const clueQuestion: ClueQuestion = {
            id: `clue_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            type: "clue",
            knowledgePoint,
            difficulty,
            tags: generatedData.tags,
            clues: generatedData.clues,
            answer: generatedData.answer,
            hints: generatedData.hints,
            explanation: generatedData.explanation,
        };

        console.log("[generate-clue] Generated successfully:", clueQuestion.id);
        console.log(
            "[generate-clue] Usage:",
            JSON.stringify(result.usage, null, 2),
        );

        return NextResponse.json({
            success: true,
            data: clueQuestion,
        });
    } catch (error) {
        console.error("[generate-clue] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "生成失败，请稍后重试",
            },
            { status: 500 },
        );
    }
}

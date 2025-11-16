/**
 * 题目类型定义
 */

/**
 * 线索题 - 通过逐步揭示线索让用户猜测答案
 */
export interface ClueQuestion {
    id: string;
    type: "clue";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3; // 1=简单 2=中等 3=困难
    tags: string[];
    clues: string[]; // 按难度递减排序（从难到易）
    answer: string;
    hints?: string[]; // 可选的额外提示
    explanation?: string; // 答案解析
}

/**
 * AI 推理返回的题型匹配结果
 */
export interface QuestionTypeMatch {
    knowledgePoint: string;
    recommendedType:
        | "clue"
        | "fill-blank"
        | "guess-image"
        | "event-order"
        | "none"
        | "multiple";
    confidence: number; // 0-1 之间
    alternativeTypes?: string[];
    reason: string;
}

/**
 * API 请求参数
 */
export interface GenerateClueRequest {
    knowledgePoint: string;
    difficulty?: 1 | 2 | 3;
    language?: "zh" | "en";
}

/**
 * API 响应
 */
export interface GenerateClueResponse {
    success: boolean;
    data?: ClueQuestion;
    error?: string;
}

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
 * 填空题 - 在句子中填入正确的答案
 */
export interface FillBlankQuestion {
    id: string;
    type: "fill-blank";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    sentence: string; // 带有占位符的句子，例如："牛顿第____定律"
    blanks: {
        position: number; // 空白位置索引
        correctAnswer: string; // 正确答案
        options?: string[]; // 选项（如果是选择题模式）
    }[];
    hints?: string[];
    explanation?: string;
}

/**
 * 看图猜X - 根据图片或描述猜测答案
 */
export interface GuessImageQuestion {
    id: string;
    type: "guess-image";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    imageUrl?: string; // 图片URL（Phase 2使用文字描述代替）
    imageDescription?: string; // 图片的文字描述（Phase 1临时方案）
    guessType: "movie" | "person" | "place" | "object" | "other"; // 猜测的类型
    answer: string;
    hints?: string[];
    explanation?: string;
}

/**
 * 事件排序题 - 将事件按正确顺序排列
 */
export interface EventOrderQuestion {
    id: string;
    type: "event-order";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    events: {
        id: string; // 事件唯一ID
        description: string; // 事件描述
        date?: string; // 可选的时间信息（用于提示）
    }[];
    correctOrder: string[]; // 正确的事件ID顺序
    hints?: string[];
    explanation?: string;
}

/**
 * 配对题 - 将左右两列内容正确配对
 */
export interface MatchingQuestion {
    id: string;
    type: "matching";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    leftItems: {
        id: string; // 左侧项唯一ID
        content: string; // 左侧项内容
    }[];
    rightItems: {
        id: string; // 右侧项唯一ID
        content: string; // 右侧项内容
    }[];
    correctPairs: {
        leftId: string; // 左侧项ID
        rightId: string; // 对应的右侧项ID
    }[];
    hints?: string[];
    explanation?: string;
}

/**
 * 所有题型的联合类型
 */
export type Question =
    | ClueQuestion
    | FillBlankQuestion
    | GuessImageQuestion
    | EventOrderQuestion
    | MatchingQuestion;

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
        | "matching"
        | "none"
        | "multiple";
    confidence: number; // 0-1 之间
    alternativeTypes?: string[];
    reason: string;
}

/**
 * API 请求参数 - 通用
 */
export interface GenerateQuestionRequest {
    knowledgePoint: string;
    difficulty?: 1 | 2 | 3;
    language?: "zh" | "en";
}

/**
 * API 请求参数 - 线索题
 */
export interface GenerateClueRequest extends GenerateQuestionRequest {}

/**
 * API 请求参数 - 填空题
 */
export interface GenerateFillBlankRequest extends GenerateQuestionRequest {}

/**
 * API 请求参数 - 看图猜X
 */
export interface GenerateGuessImageRequest extends GenerateQuestionRequest {
    guessType?: "movie" | "person" | "place" | "object" | "other";
}

/**
 * API 请求参数 - 事件排序
 */
export interface GenerateEventOrderRequest extends GenerateQuestionRequest {}

/**
 * API 请求参数 - 配对题
 */
export interface GenerateMatchingRequest extends GenerateQuestionRequest {}

/**
 * API 响应 - 通用
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * API 响应 - 线索题
 */
export interface GenerateClueResponse extends ApiResponse<ClueQuestion> {}

/**
 * API 响应 - 填空题
 */
export interface GenerateFillBlankResponse
    extends ApiResponse<FillBlankQuestion> {}

/**
 * API 响应 - 看图猜X
 */
export interface GenerateGuessImageResponse
    extends ApiResponse<GuessImageQuestion> {}

/**
 * API 响应 - 事件排序
 */
export interface GenerateEventOrderResponse
    extends ApiResponse<EventOrderQuestion> {}

/**
 * API 响应 - 配对题
 */
export interface GenerateMatchingResponse
    extends ApiResponse<MatchingQuestion> {}

/**
 * API 响应 - AI 题型匹配
 */
export interface MatchQuestionTypeResponse
    extends ApiResponse<QuestionTypeMatch & { question?: Question }> {}

/**
 * Knowledge Point Types
 * Defines the structure for knowledge point breakdown and question generation
 */

/**
 * Category of knowledge point determines which question types are suitable
 */
export type KnowledgeCategory =
    | "person" // 人物 - suitable for clue, guess-image
    | "event" // 事件 - suitable for event-order, clue, fill-blank
    | "concept" // 概念 - suitable for fill-blank, clue
    | "place" // 地点 - suitable for guess-image, clue
    | "invention" // 发明 - suitable for clue, fill-blank
    | "process" // 流程/步骤 - suitable for event-order
    | "time"; // 时间 - suitable for fill-blank, event-order

/**
 * Question types available in the system
 */
export type QuestionType =
    | "clue"
    | "fill-blank"
    | "guess-image"
    | "event-order"
    | "matching";

/**
 * A knowledge point node in the breakdown tree
 */
export interface KnowledgePoint {
    id: string;
    name: string;
    category: KnowledgeCategory;
    description?: string; // Brief description of this knowledge point
    children?: KnowledgePoint[]; // Sub-knowledge points
    recommendedTypes: QuestionType[]; // Which question types suit this point
    difficulty?: 1 | 2 | 3; // Difficulty level (1=easy, 2=medium, 3=hard)
}

/**
 * The complete breakdown result from AI
 */
export interface KnowledgeBreakdown {
    originalInput: string;
    mainCategory: KnowledgeCategory;
    breakdown: KnowledgePoint[];
    totalPoints: number; // Total number of knowledge points extracted
}

/**
 * Configuration for question generation
 */
export interface GenerationConfig {
    knowledgePoint: string;
    questionsPerType?: number; // How many questions to generate per type (default: 1)
    difficulty?: 1 | 2 | 3; // Overall difficulty preference
    includeTypes?: QuestionType[]; // Specific types to generate (default: all suitable types)
}

/**
 * A generated question (union type of all question types)
 */
export type GeneratedQuestion =
    | ClueQuestion
    | FillBlankQuestion
    | GuessImageQuestion
    | EventOrderQuestion
    | MatchingQuestion;

/**
 * Complete result of question generation
 */
export interface QuestionGenerationResult {
    knowledgeBreakdown: KnowledgeBreakdown;
    questions: GeneratedQuestion[];
    totalGenerated: number;
    generationTime: number; // in milliseconds
}

// Import existing question type definitions
export interface ClueQuestion {
    id: string;
    type: "clue";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    clues: string[];
    answer: string;
    hints?: string[];
    explanation?: string;
}

export interface FillBlankQuestion {
    id: string;
    type: "fill-blank";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    sentence: string;
    blanks: Array<{
        position: number;
        answer: string;
    }>;
    options?: string[];
    explanation?: string;
}

export interface GuessImageQuestion {
    id: string;
    type: "guess-image";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    imageUrl?: string; // Optional in MVP - use description instead
    description: string; // Text description in MVP
    guessType: "movie" | "person" | "place" | "object" | "other";
    answer: string;
    hints?: string[];
    explanation?: string;
}

export interface EventOrderQuestion {
    id: string;
    type: "event-order";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    events: Array<{
        id: string;
        description: string;
        year?: number;
    }>;
    correctOrder: string[]; // Array of event IDs in correct order
    explanation?: string;
}

export interface MatchingQuestion {
    id: string;
    type: "matching";
    knowledgePoint: string;
    difficulty: 1 | 2 | 3;
    tags: string[];
    leftItems: Array<{
        id: string;
        content: string;
    }>;
    rightItems: Array<{
        id: string;
        content: string;
    }>;
    correctPairs: Array<{
        leftId: string;
        rightId: string;
    }>;
    hints?: string[];
    explanation?: string;
}

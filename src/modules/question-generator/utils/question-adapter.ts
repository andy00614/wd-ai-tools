/**
 * Adapter to convert generated questions to playable question types
 */

import type { GeneratedQuestion } from "../types/knowledge-point";
import type { Question } from "@/types/questions";

/**
 * Convert generated question to playable question format
 */
export function adaptToPlayableQuestion(
    generatedQuestion: GeneratedQuestion,
): Question {
    switch (generatedQuestion.type) {
        case "clue":
            return {
                ...generatedQuestion,
                // Already compatible
            };

        case "fill-blank":
            return {
                id: generatedQuestion.id,
                type: "fill-blank",
                knowledgePoint: generatedQuestion.knowledgePoint,
                difficulty: generatedQuestion.difficulty,
                tags: generatedQuestion.tags,
                sentence: generatedQuestion.sentence,
                blanks: generatedQuestion.blanks.map((blank) => ({
                    position: blank.position,
                    correctAnswer: blank.answer, // Adapt field name
                    options: generatedQuestion.options, // Use global options
                })),
                explanation: generatedQuestion.explanation,
            };

        case "guess-image":
            return {
                id: generatedQuestion.id,
                type: "guess-image",
                knowledgePoint: generatedQuestion.knowledgePoint,
                difficulty: generatedQuestion.difficulty,
                tags: generatedQuestion.tags,
                imageUrl: generatedQuestion.imageUrl,
                imageDescription: generatedQuestion.description, // Adapt field name
                guessType: generatedQuestion.guessType, // Use AI-generated guess type
                answer: generatedQuestion.answer,
                hints: generatedQuestion.hints,
                explanation: generatedQuestion.explanation,
            };

        case "event-order":
            return {
                id: generatedQuestion.id,
                type: "event-order",
                knowledgePoint: generatedQuestion.knowledgePoint,
                difficulty: generatedQuestion.difficulty,
                tags: generatedQuestion.tags,
                events: generatedQuestion.events.map((event) => ({
                    id: event.id,
                    description: event.description,
                    date: event.year?.toString(), // Convert year to string
                })),
                correctOrder: generatedQuestion.correctOrder,
                explanation: generatedQuestion.explanation,
            };

        case "matching":
            return {
                ...generatedQuestion,
                // Already compatible
            };

        default:
            throw new Error(`Unknown question type: ${generatedQuestion}`);
    }
}

/**
 * Convert array of generated questions to playable questions
 */
export function adaptQuestionsToPlayable(
    generatedQuestions: GeneratedQuestion[],
): Question[] {
    return generatedQuestions.map(adaptToPlayableQuestion);
}

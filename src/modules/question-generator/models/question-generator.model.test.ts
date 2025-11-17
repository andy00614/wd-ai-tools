/**
 * 题目生成器 Model - Zod Schema 验证测试
 */

import { describe, it, expect } from "vitest";
import { matchingQuestionSchema } from "./question-generator.model";

describe("Question Generator Model - Zod Schema 验证", () => {
    /**
     * 测试场景: matchingQuestionSchema（配对题验证）
     */
    describe("matchingQuestionSchema（配对题验证）", () => {
        it("应该通过有效的配对题数据", () => {
            // Arrange: 准备有效的配对题数据
            const validData = {
                id: "matching-001",
                type: "matching",
                knowledgePoint: "中国历史人物与成就配对",
                difficulty: 2,
                tags: ["历史", "人物"],
                leftItems: [
                    { id: "left-1", content: "秦始皇" },
                    { id: "left-2", content: "汉武帝" },
                    { id: "left-3", content: "唐太宗" },
                ],
                rightItems: [
                    { id: "right-1", content: "统一六国" },
                    { id: "right-2", content: "开创贞观之治" },
                    { id: "right-3", content: "独尊儒术" },
                ],
                correctPairs: [
                    { leftId: "left-1", rightId: "right-1" },
                    { leftId: "left-2", rightId: "right-3" },
                    { leftId: "left-3", rightId: "right-2" },
                ],
                hints: ["按照时间顺序思考"],
                explanation:
                    "秦始皇统一六国，汉武帝独尊儒术，唐太宗开创贞观之治。",
            };

            // Act: 验证数据
            const result = matchingQuestionSchema.safeParse(validData);

            // Assert: 验证应该成功
            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.type).toBe("matching");
                expect(result.data.leftItems).toHaveLength(3);
                expect(result.data.rightItems).toHaveLength(3);
                expect(result.data.correctPairs).toHaveLength(3);
            }
        });

        it("应该拒绝少于 2 个左侧项的数据", () => {
            // Arrange: 左侧项只有 1 个（太少）
            const invalidData = {
                id: "matching-002",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [{ id: "left-1", content: "项目 1" }],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [{ leftId: "left-1", rightId: "right-1" }],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);

            if (!result.success) {
                const leftItemsIssue = result.error.issues.find(
                    (issue) => issue.path[0] === "leftItems",
                );
                expect(leftItemsIssue).toBeDefined();
                expect(leftItemsIssue?.message).toContain("2");
            }
        });

        it("应该拒绝少于 2 个右侧项的数据", () => {
            // Arrange: 右侧项只有 1 个（太少）
            const invalidData = {
                id: "matching-003",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [{ id: "right-1", content: "描述 1" }],
                correctPairs: [{ leftId: "left-1", rightId: "right-1" }],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);

            if (!result.success) {
                const rightItemsIssue = result.error.issues.find(
                    (issue) => issue.path[0] === "rightItems",
                );
                expect(rightItemsIssue).toBeDefined();
                expect(rightItemsIssue?.message).toContain("2");
            }
        });

        it("应该拒绝缺少正确配对的数据", () => {
            // Arrange: 缺少 correctPairs 字段
            const invalidData = {
                id: "matching-004",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                // correctPairs 缺失
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);

            if (!result.success) {
                const correctPairsIssue = result.error.issues.find(
                    (issue) => issue.path[0] === "correctPairs",
                );
                expect(correctPairsIssue).toBeDefined();
            }
        });

        it("应该拒绝空的配对数组", () => {
            // Arrange: correctPairs 为空数组
            const invalidData = {
                id: "matching-005",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);

            if (!result.success) {
                const correctPairsIssue = result.error.issues.find(
                    (issue) => issue.path[0] === "correctPairs",
                );
                expect(correctPairsIssue).toBeDefined();
                expect(correctPairsIssue?.message).toContain("1");
            }
        });

        it("应该拒绝错误的题型类型", () => {
            // Arrange: type 不是 "matching"
            const invalidData = {
                id: "matching-006",
                type: "wrong-type",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [{ leftId: "left-1", rightId: "right-1" }],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);
        });

        it("应该拒绝无效的难度等级", () => {
            // Arrange: difficulty 不在 1-3 范围内
            const invalidData = {
                id: "matching-007",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 5, // 无效难度
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [{ leftId: "left-1", rightId: "right-1" }],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);
        });

        it("应该允许可选的 hints 和 explanation 字段", () => {
            // Arrange: 不包含 hints 和 explanation
            const validData = {
                id: "matching-008",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [
                    { leftId: "left-1", rightId: "right-1" },
                    { leftId: "left-2", rightId: "right-2" },
                ],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(validData);

            // Assert: 应该成功（这些字段是可选的）
            expect(result.success).toBe(true);
        });

        it("应该拒绝 leftItems 中缺少 id 或 content 的数据", () => {
            // Arrange: leftItems 中的某个项缺少 content
            const invalidData = {
                id: "matching-009",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1" }, // 缺少 content
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [{ leftId: "left-1", rightId: "right-1" }],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);
        });

        it("应该拒绝 correctPairs 中缺少 leftId 或 rightId 的数据", () => {
            // Arrange: correctPairs 中的某个配对缺少 rightId
            const invalidData = {
                id: "matching-010",
                type: "matching",
                knowledgePoint: "测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [
                    { leftId: "left-1" }, // 缺少 rightId
                ],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(invalidData);

            // Assert: 验证应该失败
            expect(result.success).toBe(false);
        });
    });

    /**
     * 测试边界条件
     */
    describe("配对题边界条件测试", () => {
        it("应该允许刚好 2 个左右侧项（最小数量）", () => {
            // Arrange: 最小有效数据
            const validData = {
                id: "matching-min",
                type: "matching",
                knowledgePoint: "最小配对测试",
                difficulty: 1,
                tags: ["测试"],
                leftItems: [
                    { id: "left-1", content: "项目 1" },
                    { id: "left-2", content: "项目 2" },
                ],
                rightItems: [
                    { id: "right-1", content: "描述 1" },
                    { id: "right-2", content: "描述 2" },
                ],
                correctPairs: [
                    { leftId: "left-1", rightId: "right-1" },
                    { leftId: "left-2", rightId: "right-2" },
                ],
            };

            // Act
            const result = matchingQuestionSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
        });

        it("应该允许较多的配对项（10个）", () => {
            // Arrange: 10 个配对项
            const leftItems = Array.from({ length: 10 }, (_, i) => ({
                id: `left-${i + 1}`,
                content: `左侧项 ${i + 1}`,
            }));

            const rightItems = Array.from({ length: 10 }, (_, i) => ({
                id: `right-${i + 1}`,
                content: `右侧项 ${i + 1}`,
            }));

            const correctPairs = Array.from({ length: 10 }, (_, i) => ({
                leftId: `left-${i + 1}`,
                rightId: `right-${i + 1}`,
            }));

            const validData = {
                id: "matching-large",
                type: "matching",
                knowledgePoint: "大量配对测试",
                difficulty: 3,
                tags: ["测试"],
                leftItems,
                rightItems,
                correctPairs,
            };

            // Act
            const result = matchingQuestionSchema.safeParse(validData);

            // Assert
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.leftItems).toHaveLength(10);
                expect(result.data.rightItems).toHaveLength(10);
                expect(result.data.correctPairs).toHaveLength(10);
            }
        });
    });
});

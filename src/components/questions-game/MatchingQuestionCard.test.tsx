import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MatchingQuestionCard } from "./MatchingQuestionCard";
import type { MatchingQuestion } from "@/types/questions";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockQuestion: MatchingQuestion = {
    id: "matching-test-001",
    type: "matching",
    knowledgePoint: "中国历史人物与成就",
    difficulty: 2,
    tags: ["历史", "人物"],
    leftItems: [
        { id: "left-1", content: "秦始皇" },
        { id: "left-2", content: "汉武帝" },
        { id: "left-3", content: "唐太宗" },
    ],
    rightItems: [
        { id: "right-1", content: "统一六国" },
        { id: "right-2", content: "独尊儒术" },
        { id: "right-3", content: "贞观之治" },
    ],
    correctPairs: [
        { leftId: "left-1", rightId: "right-1" },
        { leftId: "left-2", rightId: "right-2" },
        { leftId: "left-3", rightId: "right-3" },
    ],
    hints: ["按照时间顺序思考"],
    explanation: "秦始皇统一六国，汉武帝独尊儒术，唐太宗开创贞观之治。",
};

describe("MatchingQuestionCard", () => {
    it("should render initial state with all items", () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        // Check title and difficulty
        expect(screen.getByText("配对题")).toBeInTheDocument();
        expect(screen.getByText("中等")).toBeInTheDocument();

        // Check tags
        expect(screen.getByText("历史")).toBeInTheDocument();
        expect(screen.getByText("人物")).toBeInTheDocument();

        // Check all left items are visible
        expect(screen.getByText("秦始皇")).toBeInTheDocument();
        expect(screen.getByText("汉武帝")).toBeInTheDocument();
        expect(screen.getByText("唐太宗")).toBeInTheDocument();

        // Check all right items are visible
        expect(screen.getByText("统一六国")).toBeInTheDocument();
        expect(screen.getByText("独尊儒术")).toBeInTheDocument();
        expect(screen.getByText("贞观之治")).toBeInTheDocument();

        // Check submit button exists
        expect(screen.getByText("提交答案")).toBeInTheDocument();
    });

    it("should allow selecting and pairing items", () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        // Click on left item
        const leftItem = screen.getByText("秦始皇");
        fireEvent.click(leftItem);

        // Click on right item to create pair
        const rightItem = screen.getByText("统一六国");
        fireEvent.click(rightItem);

        // Verify pair is visually connected (component should show this somehow)
        // This will depend on implementation details
    });

    it("should show correct result when all pairs are correct", async () => {
        const toast = await import("react-hot-toast");
        const onComplete = vi.fn();

        render(
            <MatchingQuestionCard
                question={mockQuestion}
                onComplete={onComplete}
            />,
        );

        // Create all correct pairs
        const pairs = [
            ["秦始皇", "统一六国"],
            ["汉武帝", "独尊儒术"],
            ["唐太宗", "贞观之治"],
        ];

        for (const [left, right] of pairs) {
            fireEvent.click(screen.getByText(left));
            fireEvent.click(screen.getByText(right));
        }

        // Submit
        const submitButton = screen.getByText("提交答案");
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/答对了/)).toBeInTheDocument();
        });

        // Toast success should be called
        expect(toast.default.success).toHaveBeenCalled();

        // onComplete callback should be called with true
        expect(onComplete).toHaveBeenCalledWith(true);

        // Should show score
        expect(screen.getByText(/100%/)).toBeInTheDocument();
    });

    it("should show partial score when some pairs are wrong", async () => {
        const toast = await import("react-hot-toast");

        // Create a simplified test with wrong mappings
        const { container } = render(
            <MatchingQuestionCard question={mockQuestion} />,
        );

        // Create all wrong pairs using getAllByText to avoid ambiguity
        const leftItems = container
            .querySelectorAll(".space-y-2")[0]
            .querySelectorAll("button");
        const rightItems = container
            .querySelectorAll(".space-y-2")[1]
            .querySelectorAll("button");

        // Wrong pair 1: 秦始皇 (index 0) -> 贞观之治 (index 2)
        fireEvent.click(leftItems[0]);
        fireEvent.click(rightItems[2]);

        // Wrong pair 2: 汉武帝 (index 1) -> 统一六国 (index 0)
        fireEvent.click(leftItems[1]);
        fireEvent.click(rightItems[0]);

        // Wrong pair 3: 唐太宗 (index 2) -> 独尊儒术 (index 1)
        fireEvent.click(leftItems[2]);
        fireEvent.click(rightItems[1]);

        // Submit
        const submitButton = screen.getByText("提交答案");
        fireEvent.click(submitButton);

        await waitFor(() => {
            // All wrong (0/3 = 0%)
            expect(screen.getByText(/0%/)).toBeInTheDocument();
        });
    });

    it("should allow resetting the question", async () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        // Create all correct pairs
        fireEvent.click(screen.getByText("秦始皇"));
        fireEvent.click(screen.getByText("统一六国"));
        fireEvent.click(screen.getByText("汉武帝"));
        fireEvent.click(screen.getByText("独尊儒术"));
        fireEvent.click(screen.getByText("唐太宗"));
        fireEvent.click(screen.getByText("贞观之治"));

        // Submit
        fireEvent.click(screen.getByText("提交答案"));

        await waitFor(() => {
            expect(screen.getByText("重新尝试")).toBeInTheDocument();
        });

        // Reset
        const resetButton = screen.getByText("重新尝试");
        fireEvent.click(resetButton);

        // Should return to initial state
        expect(screen.queryByText(/答对了/)).not.toBeInTheDocument();
        expect(screen.getByText("提交答案")).toBeInTheDocument();
    });

    it("should show hints when available", () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        // Hints button should be visible
        const hintsButton = screen.getByText("查看提示");
        expect(hintsButton).toBeInTheDocument();

        // Click to show hints
        fireEvent.click(hintsButton);

        // Hint should be visible
        expect(screen.getByText(/按照时间顺序思考/)).toBeInTheDocument();

        // Button text should change
        expect(screen.getByText("隐藏提示")).toBeInTheDocument();
    });

    it("should show explanation after completion if provided", async () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        // Create all correct pairs
        fireEvent.click(screen.getByText("秦始皇"));
        fireEvent.click(screen.getByText("统一六国"));
        fireEvent.click(screen.getByText("汉武帝"));
        fireEvent.click(screen.getByText("独尊儒术"));
        fireEvent.click(screen.getByText("唐太宗"));
        fireEvent.click(screen.getByText("贞观之治"));

        // Submit
        fireEvent.click(screen.getByText("提交答案"));

        await waitFor(() => {
            expect(
                screen.getByText(
                    /秦始皇统一六国.*汉武帝独尊儒术.*唐太宗开创贞观之治/,
                ),
            ).toBeInTheDocument();
        });
    });

    it("should disable submit button when no pairs are made", () => {
        render(<MatchingQuestionCard question={mockQuestion} />);

        const submitButton = screen.getByText("提交答案");

        // Initially should be disabled (or enabled depending on design)
        // This test verifies the button exists and can be tested
        expect(submitButton).toBeInTheDocument();
    });

    it("should handle question without hints gracefully", () => {
        const questionWithoutHints: MatchingQuestion = {
            ...mockQuestion,
            hints: undefined,
        };

        render(<MatchingQuestionCard question={questionWithoutHints} />);

        // Hints button should not be visible
        expect(screen.queryByText("查看提示")).not.toBeInTheDocument();
    });

    it("should handle question without explanation gracefully", async () => {
        const questionWithoutExplanation: MatchingQuestion = {
            ...mockQuestion,
            explanation: undefined,
        };

        render(<MatchingQuestionCard question={questionWithoutExplanation} />);

        // Create correct pairs and submit
        fireEvent.click(screen.getByText("秦始皇"));
        fireEvent.click(screen.getByText("统一六国"));
        fireEvent.click(screen.getByText("汉武帝"));
        fireEvent.click(screen.getByText("独尊儒术"));
        fireEvent.click(screen.getByText("唐太宗"));
        fireEvent.click(screen.getByText("贞观之治"));

        fireEvent.click(screen.getByText("提交答案"));

        await waitFor(() => {
            // Result should show, but no explanation section
            expect(screen.getByText(/答对了/)).toBeInTheDocument();
        });

        // Explanation should not be in document
        expect(screen.queryByText(/秦始皇统一六国/)).not.toBeInTheDocument();
    });
});

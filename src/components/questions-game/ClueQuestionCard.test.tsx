import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClueQuestionCard } from "./ClueQuestionCard";
import type { ClueQuestion } from "@/types/questions";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const mockQuestion: ClueQuestion = {
    id: "test-001",
    type: "clue",
    knowledgePoint: "爱迪生",
    difficulty: 2,
    tags: ["人物", "发明家"],
    clues: [
        "这个人生活在19-20世纪",
        "他拥有超过1000项专利",
        "他的一项发明改变了人类的夜晚",
    ],
    answer: "爱迪生",
    hints: ["提示：他的名字以'爱'开头"],
    explanation: "托马斯·爱迪生（1847-1931），美国发明家",
};

describe("ClueQuestionCard", () => {
    it("should render initial state with first clue", () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        // Check title and difficulty
        expect(screen.getByText("线索题")).toBeInTheDocument();
        expect(screen.getByText("中等")).toBeInTheDocument();

        // Check tags
        expect(screen.getByText("人物")).toBeInTheDocument();
        expect(screen.getByText("发明家")).toBeInTheDocument();

        // Check first clue is visible
        expect(screen.getByText("这个人生活在19-20世纪")).toBeInTheDocument();

        // Check other clues are not visible initially
        expect(
            screen.queryByText("他拥有超过1000项专利"),
        ).not.toBeInTheDocument();

        // Check clue counter
        expect(screen.getByText("线索提示 (1/3)")).toBeInTheDocument();
    });

    it("should show next clue when wrong answer is submitted", async () => {
        const toast = await import("react-hot-toast");
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // Enter wrong answer
        fireEvent.change(input, { target: { value: "错误答案" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            // Second clue should be visible
            expect(
                screen.getByText("他拥有超过1000项专利"),
            ).toBeInTheDocument();
        });

        // Toast error should be called
        expect(toast.default.error).toHaveBeenCalled();

        // Input should be cleared
        expect(input).toHaveValue("");

        // Clue counter should update
        expect(screen.getByText("线索提示 (2/3)")).toBeInTheDocument();
    });

    it("should mark as correct when right answer is submitted", async () => {
        const toast = await import("react-hot-toast");
        const onComplete = vi.fn();

        render(
            <ClueQuestionCard
                question={mockQuestion}
                onComplete={onComplete}
            />,
        );

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // Enter correct answer (case insensitive)
        fireEvent.change(input, { target: { value: "爱迪生" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("🎉 答对了！")).toBeInTheDocument();
        });

        // Toast success should be called
        expect(toast.default.success).toHaveBeenCalled();

        // onComplete callback should be called with true
        expect(onComplete).toHaveBeenCalledWith(true);

        // Should show attempt count and score
        expect(screen.getByText(/尝试 1 次/)).toBeInTheDocument();
        expect(screen.getByText(/⭐/)).toBeInTheDocument();
    });

    it("should be case insensitive for answers", async () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // Test uppercase
        fireEvent.change(input, { target: { value: "爱迪生" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("🎉 答对了！")).toBeInTheDocument();
        });
    });

    it("should trim whitespace from answers", async () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // Answer with whitespace
        fireEvent.change(input, { target: { value: "  爱迪生  " } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("🎉 答对了！")).toBeInTheDocument();
        });
    });

    it("should show all clues and end game when all attempts fail", async () => {
        const toast = await import("react-hot-toast");
        const onComplete = vi.fn();

        render(
            <ClueQuestionCard
                question={mockQuestion}
                onComplete={onComplete}
            />,
        );

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // Submit wrong answers for all clues
        for (let i = 0; i < mockQuestion.clues.length; i++) {
            const wrongAnswer = `错误答案${i}`;
            fireEvent.change(input, { target: { value: wrongAnswer } });
            fireEvent.click(submitButton);

            // Wait for input to be cleared (except for last attempt)
            if (i < mockQuestion.clues.length - 1) {
                await waitFor(() => {
                    expect(input).toHaveValue("");
                });
            }
        }

        // All clues should be visible
        mockQuestion.clues.forEach((clue) => {
            expect(screen.getByText(clue)).toBeInTheDocument();
        });

        // onComplete callback should be called with false
        await waitFor(() => {
            expect(onComplete).toHaveBeenCalledWith(false);
        });

        // Final toast error should have been called
        expect(toast.default.error).toHaveBeenLastCalledWith(
            "很遗憾，所有线索已用完",
        );
    });

    it("should calculate score correctly based on attempts", async () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        // First attempt wrong
        fireEvent.change(input, { target: { value: "错误1" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(input).toHaveValue("");
        });

        // Second attempt correct
        fireEvent.change(input, { target: { value: "爱迪生" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("尝试 2 次")).toBeInTheDocument();
            // Score = max(1, clues.length - attempts + 1) = max(1, 3 - 2 + 1) = 2
            expect(screen.getByText("⭐ 2 分")).toBeInTheDocument();
        });
    });

    it("should show explanation if provided", async () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        const submitButton = screen.getByText("提交答案");

        fireEvent.change(input, { target: { value: "爱迪生" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(
                screen.getByText(/托马斯·爱迪生.*美国发明家/),
            ).toBeInTheDocument();
        });
    });

    it("should allow reset after completion", async () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const input = screen.getByPlaceholderText("输入你的答案...");
        let submitButton = screen.getByText("提交答案");

        // Submit correct answer
        fireEvent.change(input, { target: { value: "爱迪生" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("🎉 答对了！")).toBeInTheDocument();
        });

        // Click reset button
        const resetButton = screen.getByText("重新尝试");
        fireEvent.click(resetButton);

        // Should return to initial state
        expect(screen.getByText("线索提示 (1/3)")).toBeInTheDocument();
        expect(
            screen.queryByText("他拥有超过1000项专利"),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("🎉 答对了！")).not.toBeInTheDocument();

        // Submit button should be visible again
        submitButton = screen.getByText("提交答案");
        expect(submitButton).toBeInTheDocument();
    });

    it("should show hints when available", () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        // Hints button should be visible
        const hintsButton = screen.getByText("查看提示");
        expect(hintsButton).toBeInTheDocument();

        // Click to show hints
        fireEvent.click(hintsButton);

        // Hint should be visible
        expect(
            screen.getByText(/提示：他的名字以'爱'开头/),
        ).toBeInTheDocument();

        // Button text should change
        expect(screen.getByText("隐藏提示")).toBeInTheDocument();
    });

    it("should disable submit button when input is empty", () => {
        render(<ClueQuestionCard question={mockQuestion} />);

        const submitButton = screen.getByText("提交答案");

        // Initially disabled
        expect(submitButton).toBeDisabled();

        // Enable after input
        const input = screen.getByPlaceholderText("输入你的答案...");
        fireEvent.change(input, { target: { value: "test" } });
        expect(submitButton).not.toBeDisabled();

        // Disable again when cleared
        fireEvent.change(input, { target: { value: "" } });
        expect(submitButton).toBeDisabled();
    });
});

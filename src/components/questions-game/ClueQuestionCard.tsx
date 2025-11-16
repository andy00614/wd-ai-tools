"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle,
	XCircle,
	Lightbulb,
	Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { ClueQuestion } from "@/types/questions";

interface ClueQuestionCardProps {
	question: ClueQuestion;
	onComplete?: (isCorrect: boolean) => void;
}

export function ClueQuestionCard({
	question,
	onComplete,
}: ClueQuestionCardProps) {
	const [userAnswer, setUserAnswer] = useState("");
	const [showClues, setShowClues] = useState<number>(1); // 初始显示1条线索
	const [isSubmitted, setIsSubmitted] = useState(false);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [showHints, setShowHints] = useState(false);
	const [attemptCount, setAttemptCount] = useState(0); // 尝试次数

	const difficultyColors = {
		1: "bg-green-100 text-green-800 border-green-300",
		2: "bg-yellow-100 text-yellow-800 border-yellow-300",
		3: "bg-red-100 text-red-800 border-red-300",
	};

	const difficultyLabels = {
		1: "简单",
		2: "中等",
		3: "困难",
	};

	const handleSubmit = () => {
		const trimmedAnswer = userAnswer.trim().toLowerCase();
		const correctAnswer = question.answer.toLowerCase();

		// 简单的答案匹配（可以扩展为更智能的匹配）
		const correct = trimmedAnswer === correctAnswer;

		// 增加尝试次数
		setAttemptCount(attemptCount + 1);

		if (correct) {
			// 答对了，游戏结束
			setIsCorrect(true);
			setIsSubmitted(true);
			toast.success("恭喜答对了！");
			if (onComplete) {
				onComplete(true);
			}
		} else {
			// 答错了，显示下一条线索（如果还有）
			if (showClues < question.clues.length) {
				setShowClues(showClues + 1);
				setUserAnswer(""); // 清空输入框
				toast.error("答案不正确，已为您展示下一条线索");
			} else {
				// 所有线索都用完了，游戏结束
				setIsCorrect(false);
				setIsSubmitted(true);
				toast.error("很遗憾，所有线索已用完");
				if (onComplete) {
					onComplete(false);
				}
			}
		}
	};

	const handleReset = () => {
		setUserAnswer("");
		setShowClues(1);
		setIsSubmitted(false);
		setIsCorrect(null);
		setShowHints(false);
		setAttemptCount(0);
	};

	return (
		<Card className="max-w-2xl mx-auto">
			<CardHeader>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-primary" />
						<CardTitle className="text-xl">线索题</CardTitle>
					</div>
					<Badge
						variant="outline"
						className={cn(
							"font-medium",
							difficultyColors[question.difficulty],
						)}
					>
						{difficultyLabels[question.difficulty]}
					</Badge>
				</div>

				{/* Tags */}
				<div className="flex flex-wrap gap-2">
					{question.tags.map((tag) => (
						<Badge key={tag} variant="secondary" className="text-xs">
							{tag}
						</Badge>
					))}
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* Clues Section */}
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-muted-foreground">
							线索提示 ({showClues}/{question.clues.length})
						</h3>
						{showClues < question.clues.length && !isSubmitted && (
							<div className="text-xs text-muted-foreground">
								答错后自动解锁下一条线索
							</div>
						)}
					</div>

					<div className="space-y-2">
						{/* biome-ignore lint/suspicious/noArrayIndexKey: clues array is static and order won't change */}
						{question.clues.slice(0, showClues).map((clue, index) => (
							<div
								key={`clue-${index}`}
								className={cn(
									"p-3 rounded-lg border-l-4 bg-muted/30 transition-all duration-300",
									index === showClues - 1
										? "border-primary bg-primary/5 animate-in slide-in-from-left"
										: "border-muted-foreground/20",
								)}
							>
								<div className="flex items-start gap-3">
									<span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
										{index + 1}
									</span>
									<p className="text-sm leading-relaxed pt-0.5">{clue}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Hints Section (Optional) */}
				{question.hints && question.hints.length > 0 && !isSubmitted && (
					<div className="space-y-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowHints(!showHints)}
							className="h-8 text-xs"
						>
							<Lightbulb className="w-3 h-3 mr-1" />
							{showHints ? "隐藏提示" : "查看提示"}
						</Button>

						{showHints && (
							<div className="space-y-2 animate-in slide-in-from-top">
							{/* biome-ignore lint/suspicious/noArrayIndexKey: hints array is static and order won't change */}
								{question.hints.map((hint, index) => (
									<div
										key={`hint-${index}`}
										className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs"
									>
										💡 {hint}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Answer Input */}
				<div className="space-y-3">
					<div className="flex gap-2">
						<Input
							placeholder="输入你的答案..."
							value={userAnswer}
							onChange={(e) => setUserAnswer(e.target.value)}
							disabled={isSubmitted}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !isSubmitted && userAnswer.trim()) {
									handleSubmit();
								}
							}}
							className={cn(
								"flex-1",
								isSubmitted &&
									(isCorrect
										? "border-green-500 bg-green-50"
										: "border-red-500 bg-red-50"),
							)}
						/>
						{!isSubmitted ? (
							<Button
								onClick={handleSubmit}
								disabled={!userAnswer.trim()}
								className="min-w-[100px]"
							>
								提交答案
							</Button>
						) : (
							<Button onClick={handleReset} variant="outline">
								重新尝试
							</Button>
						)}
					</div>

					{/* Result Display */}
					{isSubmitted && (
						<div
							className={cn(
								"p-4 rounded-lg border-2 animate-in slide-in-from-bottom",
								isCorrect
									? "bg-green-50 border-green-500"
									: "bg-red-50 border-red-500",
							)}
						>
							<div className="flex items-start gap-3">
								{isCorrect ? (
									<CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
								) : (
									<XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
								)}
								<div className="flex-1 space-y-2">
									<div className="flex items-center justify-between">
										<p
											className={cn(
												"font-semibold",
												isCorrect ? "text-green-900" : "text-red-900",
											)}
										>
											{isCorrect ? "🎉 答对了！" : "❌ 很遗憾"}
										</p>
										{isCorrect && (
											<div className="flex items-center gap-2">
												<Badge variant="outline" className="bg-white">
													尝试 {attemptCount} 次
												</Badge>
												<Badge
													variant="outline"
													className="bg-white text-yellow-600 border-yellow-400"
												>
													⭐{" "}
													{Math.max(
														1,
														question.clues.length - attemptCount + 1,
													)}{" "}
													分
												</Badge>
											</div>
										)}
									</div>
									{!isCorrect && (
										<>
											<p className="text-sm text-red-800">
												正确答案是：
												<span className="font-semibold ml-1">
													{question.answer}
												</span>
											</p>
											<p className="text-xs text-red-700">
												您使用了全部 {question.clues.length} 条线索，尝试了{" "}
												{attemptCount} 次
											</p>
										</>
									)}
									{question.explanation && (
										<div className="pt-2 border-t border-gray-200">
											<p className="text-xs text-gray-700 leading-relaxed">
												📚 {question.explanation}
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Progress Indicator */}
				<div className="flex items-center justify-center gap-2 pt-2">
					{/* biome-ignore lint/suspicious/noArrayIndexKey: progress indicator uses stable array */}
					{question.clues.map((_, index) => (
						<div
							key={`progress-${index}`}
							className={cn(
								"h-1.5 rounded-full transition-all duration-300",
								index < showClues
									? "bg-primary w-8"
									: "bg-muted-foreground/20 w-6",
							)}
						/>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

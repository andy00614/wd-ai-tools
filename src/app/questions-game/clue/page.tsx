"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { ClueQuestionCard } from "@/components/questions-game/ClueQuestionCard";
import toast from "react-hot-toast";
import type { ClueQuestion } from "@/types/questions";

export default function ClueQuestionTestPage() {
	const [knowledgePoint, setKnowledgePoint] = useState("");
	const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedQuestion, setGeneratedQuestion] =
		useState<ClueQuestion | null>(null);

	// 预设的测试知识点
	const presetKnowledgePoints = [
		"爱迪生",
		"万有引力定律",
		"中国长城",
		"莎士比亚",
		"相对论",
		"埃菲尔铁塔",
		"JavaScript编程语言",
		"DNA双螺旋结构",
		"蒙娜丽莎",
		"量子力学",
	];

	const handleGenerate = async () => {
		if (!knowledgePoint.trim()) {
			toast.error("请输入知识点");
			return;
		}

		setIsGenerating(true);
		try {
			const response = await fetch("/api/questions-game/generate-clue", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					knowledgePoint: knowledgePoint.trim(),
					difficulty,
					language: "zh",
				}),
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "生成失败");
			}

			setGeneratedQuestion(result.data);
			toast.success("线索题生成成功！");
		} catch (error) {
			console.error("Generate error:", error);
			toast.error(
				error instanceof Error ? error.message : "生成失败，请稍后重试",
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleQuickTest = (preset: string) => {
		setKnowledgePoint(preset);
		// 不立即生成，让用户可以调整难度
	};

	const handleReset = () => {
		setGeneratedQuestion(null);
		setKnowledgePoint("");
		setDifficulty(2);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
						<Sparkles className="w-8 h-8 text-primary" />
						线索题生成器
					</h1>
					<p className="text-muted-foreground">
						输入知识点，AI 将自动生成趣味线索题
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Left: Input Panel */}
					<div className="lg:col-span-1 space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">生成配置</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Knowledge Point Input */}
								<div className="space-y-2">
									<Label htmlFor="knowledge-point">知识点</Label>
									<Input
										id="knowledge-point"
										placeholder="例如：爱迪生、万有引力定律..."
										value={knowledgePoint}
										onChange={(e) => setKnowledgePoint(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !isGenerating) {
												handleGenerate();
											}
										}}
									/>
								</div>

								{/* Difficulty Select */}
								<div className="space-y-2">
									<Label htmlFor="difficulty">难度</Label>
									<Select
										value={difficulty.toString()}
										onValueChange={(value) =>
											setDifficulty(Number.parseInt(value, 10) as 1 | 2 | 3)
										}
									>
										<SelectTrigger id="difficulty">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="1">简单 (5-7条线索)</SelectItem>
											<SelectItem value="2">中等 (4-5条线索)</SelectItem>
											<SelectItem value="3">困难 (3-4条线索)</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Generate Button */}
								<Button
									onClick={handleGenerate}
									disabled={isGenerating || !knowledgePoint.trim()}
									className="w-full"
								>
									{isGenerating ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											生成中...
										</>
									) : (
										<>
											<Sparkles className="w-4 h-4 mr-2" />
											生成线索题
										</>
									)}
								</Button>

								{generatedQuestion && (
									<Button
										onClick={handleReset}
										variant="outline"
										className="w-full"
									>
										<RefreshCw className="w-4 h-4 mr-2" />
										重新开始
									</Button>
								)}
							</CardContent>
						</Card>

						{/* Quick Test Presets */}
						<Card>
							<CardHeader>
								<CardTitle className="text-sm">快速测试</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2">
									{presetKnowledgePoints.map((preset) => (
										<Button
											key={preset}
											variant="outline"
											size="sm"
											onClick={() => handleQuickTest(preset)}
											className="text-xs"
										>
											{preset}
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right: Question Display */}
					<div className="lg:col-span-2">
						{generatedQuestion ? (
							<ClueQuestionCard
								question={generatedQuestion}
								onComplete={(isCorrect) => {
									console.log("Question completed:", isCorrect);
								}}
							/>
						) : (
							<Card className="h-full">
								<CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
									<Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
									<p className="text-lg font-medium text-muted-foreground mb-2">
										等待生成
									</p>
									<p className="text-sm text-muted-foreground max-w-md">
										在左侧输入知识点并点击"生成线索题"按钮，AI
										将为您创建一道趣味线索题
									</p>
								</CardContent>
							</Card>
						)}
					</div>
				</div>

				{/* Debug Info (Dev only) */}
				{process.env.NODE_ENV === "development" && generatedQuestion && (
					<Card className="mt-6">
						<CardHeader>
							<CardTitle className="text-sm text-muted-foreground">
								Debug Info
							</CardTitle>
						</CardHeader>
						<CardContent>
							<pre className="text-xs overflow-x-auto">
								{JSON.stringify(generatedQuestion, null, 2)}
							</pre>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

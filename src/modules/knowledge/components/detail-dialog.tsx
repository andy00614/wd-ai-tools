"use client";

import { useEffect, useState } from "react";
import { Loader2, BookOpen, HelpCircle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getSessionDetail } from "../actions/get-session-detail.action";

type Props = {
	sessionId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

type Question = {
	id: string;
	content: string;
	type: string;
	options: string[];
	answer: string;
	explanation: string | null;
};

type Outline = {
	id: string;
	title: string;
	orderIndex: number;
	status: string;
	questions: Question[];
};

type SessionData = {
	session: {
		id: string;
		title: string;
		model: string;
		status: string;
		timeConsume: number | null;
		inputToken: number | null;
		outputToken: number | null;
		createdAt: Date;
	};
	outlines: Outline[];
};

export default function DetailDialog({ sessionId, open, onOpenChange }: Props) {
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<SessionData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open || !sessionId) {
			setData(null);
			setError(null);
			return;
		}

		async function fetchDetail() {
			if (!sessionId) return;

			setLoading(true);
			setError(null);

			const result = await getSessionDetail(sessionId);

			if (result.success && result.data) {
				setData(result.data);
			} else {
				setError(result.error || "Failed to load session");
			}

			setLoading(false);
		}

		fetchDetail();
	}, [sessionId, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Knowledge Session Details</DialogTitle>
				</DialogHeader>

				{loading && (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				)}

				{error && (
					<div className="py-8 text-center text-destructive">{error}</div>
				)}

				{data && (
					<div className="space-y-6">
						{/* Session Info */}
						<div className="space-y-2">
							<h2 className="font-bold text-xl">{data.session.title}</h2>
							<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
								<Badge variant="secondary">{data.session.model}</Badge>
								<Badge
									variant={
										data.session.status === "completed"
											? "default"
											: "secondary"
									}
								>
									{data.session.status}
								</Badge>
								{data.session.timeConsume && (
									<span>
										Time: {(data.session.timeConsume / 1000).toFixed(2)}s
									</span>
								)}
								{data.session.inputToken && (
									<span>Input: {data.session.inputToken} tokens</span>
								)}
								{data.session.outputToken && (
									<span>Output: {data.session.outputToken} tokens</span>
								)}
							</div>
						</div>

						{/* Outlines and Questions */}
						<div className="space-y-6">
							{data.outlines.map((outline, outlineIndex) => (
								<div key={outline.id} className="space-y-4">
									<div className="flex items-center gap-3">
										<BookOpen className="size-5 text-primary" />
										<h3 className="font-semibold text-lg">
											{outlineIndex + 1}. {outline.title}
										</h3>
									</div>

									{/* Questions for this outline */}
									<div className="ml-8 space-y-4">
										{outline.questions.length === 0 ? (
											<p className="text-sm text-muted-foreground">
												No questions generated yet
											</p>
										) : (
											outline.questions.map((question, qIndex) => (
												<div
													key={question.id}
													className="border rounded-lg p-4 space-y-3"
												>
													<div className="flex items-start gap-3">
														<HelpCircle className="size-5 text-muted-foreground mt-0.5" />
														<div className="flex-1 space-y-2">
															<p className="font-medium">
																Q{qIndex + 1}: {question.content}
															</p>

															{/* Options */}
															<div className="space-y-1.5">
																{question.options.map((option, optIndex) => {
																	const isCorrect =
																		option.startsWith(question.answer);
																	return (
																		<div
																			key={optIndex}
																			className={`text-sm p-2 rounded ${
																				isCorrect
																					? "bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100 font-medium"
																					: "bg-muted/50"
																			}`}
																		>
																			{option}
																		</div>
																	);
																})}
															</div>

															{/* Explanation */}
															{question.explanation && (
																<div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded text-sm">
																	<p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
																		Explanation:
																	</p>
																	<p className="text-blue-800 dark:text-blue-200">
																		{question.explanation}
																	</p>
																</div>
															)}
														</div>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

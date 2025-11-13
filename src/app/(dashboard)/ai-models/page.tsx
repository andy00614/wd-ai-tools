import {
    getAllAiModels,
    seedAiModels,
} from "@/modules/ai-model/actions/seed-models.action";
import type { AiModel } from "@/modules/ai-model/schemas/ai-model.schema";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

async function handleSeedModels() {
    "use server";
    await seedAiModels();
}

export default async function AiModelsPage() {
    const result = await getAllAiModels();
    const models = result.data || [];

    // Group models by provider
    const modelsByProvider = models.reduce(
        (acc, model) => {
            if (!acc[model.provider]) {
                acc[model.provider] = [];
            }
            acc[model.provider].push(model);
            return acc;
        },
        {} as Record<string, AiModel[]>,
    );

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">AI 模型管理</h1>
                    <p className="text-muted-foreground mt-2">
                        查看和管理系统中的 AI 模型及其价格信息
                    </p>
                </div>
                <form action={handleSeedModels}>
                    <Button type="submit" variant="outline">
                        重新初始化模型
                    </Button>
                </form>
            </div>

            {models.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            暂无模型数据
                        </p>
                        <form action={handleSeedModels}>
                            <Button type="submit">初始化模型数据</Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {Object.entries(modelsByProvider).map(
                        ([provider, providerModels]) => (
                            <Card key={provider}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="capitalize">
                                            {provider}
                                        </CardTitle>
                                        <Badge variant="secondary">
                                            {providerModels.length} 个模型
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {provider === "openai" &&
                                            "OpenAI 提供的大语言模型"}
                                        {provider === "anthropic" &&
                                            "Anthropic 提供的 Claude 系列模型"}
                                        {provider === "google" &&
                                            "Google 提供的 Gemini 系列模型"}
                                        {provider === "azure" &&
                                            "Azure OpenAI 服务"}
                                        {provider === "groq" &&
                                            "Groq 提供的高性能推理服务"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {providerModels.map((model) => (
                                            <div key={model.id}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">
                                                                {
                                                                    model.displayName
                                                                }
                                                            </h3>
                                                            {model.isActive ? (
                                                                <Badge
                                                                    variant="default"
                                                                    className="text-xs"
                                                                >
                                                                    激活
                                                                </Badge>
                                                            ) : (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    未激活
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-muted-foreground text-sm mt-1">
                                                            模型 ID:{" "}
                                                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                                                                {model.modelId}
                                                            </code>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm">
                                                            <span className="text-muted-foreground">
                                                                输入:
                                                            </span>{" "}
                                                            <span className="font-semibold">
                                                                $
                                                                {model.inputPricePerMillion.toFixed(
                                                                    2,
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs ml-1">
                                                                / 1M tokens
                                                            </span>
                                                        </div>
                                                        <div className="text-sm mt-1">
                                                            <span className="text-muted-foreground">
                                                                输出:
                                                            </span>{" "}
                                                            <span className="font-semibold">
                                                                $
                                                                {model.outputPricePerMillion.toFixed(
                                                                    2,
                                                                )}
                                                            </span>
                                                            <span className="text-muted-foreground text-xs ml-1">
                                                                / 1M tokens
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator className="mt-4" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    )}
                </div>
            )}

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>价格说明</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        • 所有价格以美元(USD)计价,单位为每百万 tokens(1M tokens)
                    </p>
                    <p>
                        • 实际费用 = (输入tokens数量 / 1,000,000) × 输入价格 +
                        (输出tokens数量 / 1,000,000) × 输出价格
                    </p>
                    <p>
                        •
                        价格信息来源于各服务商官方定价,可能随时调整,请以官方最新价格为准
                    </p>
                    <p>• 标记为"估算"的价格为预估值,实际价格以官方发布为准</p>
                </CardContent>
            </Card>
        </div>
    );
}

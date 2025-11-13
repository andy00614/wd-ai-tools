/**
 * Seed AI Models Script
 * 用于初始化数据库中的 AI 模型数据
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";

const DB_PATH =
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/d3ea093d-a771-4501-b548-5c107514c0e2.sqlite";

const predefinedModels = [
    // OpenAI Models
    {
        id: crypto.randomUUID(),
        provider: "openai",
        modelId: "gpt-4o",
        displayName: "GPT-4 Omni",
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: crypto.randomUUID(),
        provider: "openai",
        modelId: "gpt-5",
        displayName: "GPT-5",
        inputPricePerMillion: 5.0,
        outputPricePerMillion: 15.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: crypto.randomUUID(),
        provider: "openai",
        modelId: "gpt-4.1-mini",
        displayName: "GPT-4.1 Mini",
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    // Google Models
    {
        id: crypto.randomUUID(),
        provider: "google",
        modelId: "gemini-2.5-flash",
        displayName: "Gemini 2.5 Flash",
        inputPricePerMillion: 0.075,
        outputPricePerMillion: 0.3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    // Anthropic Models
    {
        id: crypto.randomUUID(),
        provider: "anthropic",
        modelId: "claude-haiku-4.5",
        displayName: "Claude Haiku 4.5",
        inputPricePerMillion: 0.8,
        outputPricePerMillion: 4.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: crypto.randomUUID(),
        provider: "anthropic",
        modelId: "claude-sonnet-4.5",
        displayName: "Claude Sonnet 4.5",
        inputPricePerMillion: 3.0,
        outputPricePerMillion: 15.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    // Azure Models
    {
        id: crypto.randomUUID(),
        provider: "azure",
        modelId: "gpt-4o",
        displayName: "Azure GPT-4 Omni",
        inputPricePerMillion: 2.5,
        outputPricePerMillion: 10.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: crypto.randomUUID(),
        provider: "azure",
        modelId: "gpt-5",
        displayName: "Azure GPT-5",
        inputPricePerMillion: 5.0,
        outputPricePerMillion: 15.0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: crypto.randomUUID(),
        provider: "azure",
        modelId: "gpt-4.1-mini",
        displayName: "Azure GPT-4.1 Mini",
        inputPricePerMillion: 0.15,
        outputPricePerMillion: 0.6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },

    // Groq Models
    {
        id: crypto.randomUUID(),
        provider: "groq",
        modelId: "qwen-3-32b",
        displayName: "Qwen 3 32B",
        inputPricePerMillion: 0.1,
        outputPricePerMillion: 0.1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

async function seed() {
    console.log("🌱 开始初始化 AI 模型数据...");

    const sqlite = new Database(DB_PATH);
    const db = drizzle(sqlite, { schema });

    try {
        // 清空现有数据
        console.log("🗑️  清空现有数据...");
        await db.delete(schema.aiModels);

        // 插入新数据
        console.log("📥 插入模型数据...");
        await db.insert(schema.aiModels).values(predefinedModels);

        // 验证数据
        const models = await db.select().from(schema.aiModels);
        console.log(`✅ 成功插入 ${models.length} 个模型`);
        console.log("\n模型列表:");
        models.forEach((model) => {
            console.log(
                `  - ${model.displayName} (${model.provider}/${model.modelId})`,
            );
        });
    } catch (error) {
        console.error("❌ 初始化失败:", error);
        throw error;
    } finally {
        sqlite.close();
    }

    console.log("\n🎉 初始化完成!");
}

seed().catch(console.error);

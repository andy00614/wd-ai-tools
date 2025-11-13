/**
 * 简化的 Knowledge 测试 - 只测试页面加载和基本交互
 * 不调用 AI API，快速验证页面结构
 */

import { expect, test } from "@playwright/test";

test.describe("Knowledge Page Basic Tests", () => {
    test("should load knowledge list page", async ({ page }) => {
        await page.goto("/dashboard/knowledge");
        await page.waitForLoadState("networkidle");

        // 验证页面标题
        await expect(page.getByText("Knowledge Point Generator")).toBeVisible();

        // 验证创建按钮
        await expect(page.getByRole("link", { name: /create/i })).toBeVisible();
    });

    test("should load new knowledge creation page", async ({ page }) => {
        await page.goto("/dashboard/knowledge/new");
        await page.waitForLoadState("networkidle");

        // 验证页面元素
        await expect(page.getByText("创建新知识")).toBeVisible();
        await expect(page.getByLabel(/输入您的问题或主题/i)).toBeVisible();
        await expect(page.getByText("AI 模型")).toBeVisible();
        await expect(page.getByText("OpenAI GPT-4o")).toBeVisible();

        // 验证生成按钮存在（但未点击）
        const generateButton = page.getByRole("button", {
            name: /生成知识内容和题目/i,
        });
        await expect(generateButton).toBeVisible();

        // 初始状态下按钮应该是禁用的（因为没有输入）
        // 不验证禁用状态，因为有默认值
    });

    test("should enable generate button after entering topic", async ({
        page,
    }) => {
        await page.goto("/dashboard/knowledge/new");
        await page.waitForLoadState("networkidle");

        // 输入主题
        await page.getByLabel(/输入您的问题或主题/i).fill("Test Topic for E2E");

        // 验证生成按钮启用
        const generateButton = page.getByRole("button", {
            name: /生成知识内容和题目/i,
        });
        await expect(generateButton).toBeEnabled();
    });
});

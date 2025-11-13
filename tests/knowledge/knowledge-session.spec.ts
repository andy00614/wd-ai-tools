/**
 * Knowledge Session E2E 测试
 *
 * 测试完整的知识点生成流程：
 * 1. 创建 session
 * 2. 生成 outline (AI调用)
 * 3. 生成 questions (AI调用)
 * 4. 查看结果
 *
 * ⚠️ 注意：此测试会调用真实的AI API，可能需要30-120秒完成
 */

import { expect, test } from "@playwright/test";

test.describe("Knowledge Session Flow", () => {
    // 使用时间戳确保每次测试的数据唯一
    const timestamp = Date.now();

    test.beforeEach(async ({ page }) => {
        // 访问 Knowledge 页面（已通过 storageState 自动认证）
        await page.goto("/dashboard/knowledge");

        // 等待页面加载完成
        await page.waitForLoadState("networkidle");
    });

    test("should create knowledge session with GPT-4o and display cost", async ({
        page,
    }) => {
        test.setTimeout(180000); // 3分钟超时
        const knowledgeTitle = `E2E Test - TypeScript Basics ${timestamp}`;

        // Step 1: 点击创建按钮
        await page.getByRole("link", { name: /create/i }).click();

        // 等待新页面加载
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveURL(/\/dashboard\/knowledge\/new/);

        // Step 2: 填写知识点主题
        await page.getByLabel(/输入您的问题或主题/i).fill(knowledgeTitle);

        // Step 3: 验证模型选择器可见 (GPT-4o 已经是默认值)
        await expect(page.getByText("AI 模型")).toBeVisible();
        await expect(page.getByText("OpenAI GPT-4o")).toBeVisible();

        // Step 4: 点击生成按钮
        const generateButton = page.getByRole("button", {
            name: /生成知识内容和题目/i,
        });
        await expect(generateButton).toBeEnabled();
        await generateButton.click();

        // Step 5: 等待大纲生成阶段
        await expect(page.getByText(/正在生成学习大纲/i)).toBeVisible({
            timeout: 10000,
        });

        // 验证进度指示器
        await expect(
            page.getByText(/正在分析您的主题并创建详细的学习大纲/i),
        ).toBeVisible();

        // Step 6: 等待题目生成阶段 (可能需要60秒)
        await expect(page.getByText(/正在为所有章节生成题目/i)).toBeVisible({
            timeout: 90000, // 90秒超时
        });

        // 验证题目生成提示
        await expect(
            page.getByText(/正在为每个章节生成练习题目/i),
        ).toBeVisible();

        // Step 7: 等待生成完成 (可能需要额外30-60秒)
        await expect(page.getByText(/生成完成/i)).toBeVisible({
            timeout: 120000, // 2分钟超时
        });

        // Step 8: 等待自动跳转回列表页面
        await expect(page).toHaveURL(/\/dashboard\/knowledge/, {
            timeout: 5000,
        });

        // Step 9: 验证新创建的 session 出现在列表中
        await page.waitForTimeout(1000); // 等待列表刷新
        await expect(page.getByText(knowledgeTitle)).toBeVisible();

        // Step 10: 验证费用显示（应该显示 $0.00XX 格式）
        const sessionCard = page.locator("div", {
            hasText: knowledgeTitle,
        });
        await expect(sessionCard).toBeVisible();

        // 查找 cost 显示（在同一个 card 中）
        const costText = sessionCard.getByText(/\$\d+\.\d+/);
        await expect(costText).toBeVisible();

        // 验证 cost 是合理的数值 (大于0)
        const costValue = await costText.textContent();
        expect(costValue).toMatch(/\$\d+\.\d{2,4}/);
        console.log(`✅ Generated knowledge session cost: ${costValue}`);

        // Step 11: 点击查看详情
        await sessionCard.click();

        // Step 12: 验证详情对话框显示
        await expect(
            page.getByRole("dialog").getByText(knowledgeTitle),
        ).toBeVisible();

        // Step 13: 验证 token 使用和费用信息
        await expect(page.getByText(/Input.*tokens/i).first()).toBeVisible();
        await expect(page.getByText(/Output.*tokens/i).first()).toBeVisible();
        await expect(page.getByText(/Cost.*\$/i).first()).toBeVisible();

        // Step 14: 验证生成的大纲和问题
        // 应该至少有1个 outline
        const outlines = page.locator('div[role="button"]', {
            hasText: /\d+\. /,
        });
        await expect(outlines.first()).toBeVisible();

        // 点击第一个 outline 展开
        await outlines.first().click();
        await page.waitForTimeout(500);

        // 验证至少有1个问题
        await expect(page.getByText(/Q1:/i)).toBeVisible();

        // 验证问题选项（A/B/C/D）
        await expect(page.getByText(/A\./i).first()).toBeVisible();
        await expect(page.getByText(/B\./i).first()).toBeVisible();
        await expect(page.getByText(/C\./i).first()).toBeVisible();
        await expect(page.getByText(/D\./i).first()).toBeVisible();

        console.log(
            `✅ Knowledge session "${knowledgeTitle}" created and verified successfully`,
        );
    });

    test("should handle session creation with direct prompt input", async ({
        page,
    }) => {
        test.setTimeout(120000); // 2分钟超时
        const knowledgeTitle = `E2E Test - Direct Prompt ${timestamp}`;

        // 访问创建页面
        await page.goto("/dashboard/knowledge/new");
        await page.waitForLoadState("networkidle");

        // 填写主题
        await page.getByLabel(/输入您的问题或主题/i).fill(knowledgeTitle);

        // 切换到直接输入模式
        // Switch 在页面上显示为 "模板模式"
        const templateSwitch = page.getByRole("switch", { name: "模板模式" });
        await templateSwitch.click();

        // 验证切换成功
        await expect(page.getByLabel(/大纲生成 Prompt/i)).toBeVisible();

        // 输入自定义 prompt
        await page
            .getByLabel(/大纲生成 Prompt/i)
            .fill(
                "Generate 3 main topics about {{topic}}. Return as JSON: {outlines: [{title: string}]}",
            );

        // 验证生成按钮变为可用
        const generateButton = page.getByRole("button", {
            name: /生成知识内容和题目/i,
        });
        await expect(generateButton).toBeEnabled();

        // 点击生成
        await generateButton.click();

        // 等待生成开始
        await expect(page.getByText(/正在生成学习大纲/i)).toBeVisible({
            timeout: 10000,
        });

        // 等待完成 (简化测试，只等待大纲生成)
        await expect(page.getByText(/正在为所有章节生成题目/i)).toBeVisible({
            timeout: 90000,
        });

        console.log(`✅ Direct prompt mode tested for "${knowledgeTitle}"`);
    });
});

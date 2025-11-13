/**
 * Cost Tracking E2E 测试
 *
 * 专门测试费用追踪功能：
 * 1. 验证费用在列表中正确显示
 * 2. 验证费用在详情中正确显示
 * 3. 验证 token 统计准确
 * 4. 对比不同模型的费用
 *
 * ⚠️ 注意：此测试会调用真实的AI API
 */

import { expect, test } from "@playwright/test";

test.describe("Cost Tracking", () => {
    const timestamp = Date.now();

    test.beforeEach(async ({ page }) => {
        await page.goto("/dashboard/knowledge");
        await page.waitForLoadState("networkidle");
    });

    test("should display accurate cost information for GPT-4o model", async ({
        page,
    }) => {
        test.setTimeout(240000); // 4分钟超时
        const knowledgeTitle = `Cost Test - GPT-4o ${timestamp}`;

        // 创建 session
        await page.getByRole("link", { name: /create/i }).click();
        await page.waitForLoadState("networkidle");

        await page.getByLabel(/输入您的问题或主题/i).fill(knowledgeTitle);

        // 确保使用 GPT-4o (默认)
        await expect(page.getByText("AI 模型")).toBeVisible();
        await expect(page.getByText("OpenAI GPT-4o")).toBeVisible();

        await page.getByRole("button", { name: /生成知识内容和题目/i }).click();

        // 等待生成完成
        await expect(page.getByText(/生成完成/i)).toBeVisible({
            timeout: 180000,
        });

        // 等待跳转
        await expect(page).toHaveURL(/\/dashboard\/knowledge/, {
            timeout: 5000,
        });

        await page.waitForTimeout(1000);

        // 验证列表中显示费用
        const sessionCard = page.locator("div", {
            hasText: knowledgeTitle,
        });
        await expect(sessionCard).toBeVisible();

        // 提取费用文本
        const costInList = await sessionCard
            .getByText(/\$\d+\.\d+/)
            .textContent();
        expect(costInList).toBeTruthy();
        console.log(`📊 Cost displayed in list: ${costInList}`);

        // 验证费用格式
        expect(costInList).toMatch(/\$\d+\.\d{2,4}/);

        // 点击查看详情
        await sessionCard.click();

        // 等待详情对话框
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // 验证详情中的费用信息
        await expect(dialog.getByText(/Cost.*\$/i)).toBeVisible();

        // 提取详情中的费用
        const costInDetail = await dialog
            .getByText(/Cost:/)
            .locator("..")
            .getByText(/\$\d+\.\d+/)
            .textContent();

        console.log(`📊 Cost displayed in detail: ${costInDetail}`);

        // 验证列表和详情中的费用一致
        expect(costInList).toBe(costInDetail);

        // 验证 token 统计存在
        const inputTokensText = await dialog.getByText(/Input:/).textContent();
        const outputTokensText = await dialog
            .getByText(/Output:/)
            .textContent();

        console.log(`📊 Token usage: ${inputTokensText}, ${outputTokensText}`);

        // 提取 token 数字
        const inputTokens =
            Number.parseInt(
                inputTokensText?.match(/(\d+)\s*tokens/)?.[1] || "0",
                10,
            ) || 0;
        const outputTokens =
            Number.parseInt(
                outputTokensText?.match(/(\d+)\s*tokens/)?.[1] || "0",
                10,
            ) || 0;

        // 验证 token 数量合理（应该 > 0）
        expect(inputTokens).toBeGreaterThan(0);
        expect(outputTokens).toBeGreaterThan(0);

        console.log(
            `✅ Input tokens: ${inputTokens}, Output tokens: ${outputTokens}`,
        );

        // 验证费用计算合理
        // GPT-4o: $2.50 per 1M input, $10.00 per 1M output
        const expectedCost =
            (inputTokens / 1_000_000) * 2.5 + (outputTokens / 1_000_000) * 10.0;
        const actualCost = Number.parseFloat(
            costInDetail?.replace("$", "") || "0",
        );

        // 允许小数点误差
        const costDifference = Math.abs(expectedCost - actualCost);
        expect(costDifference).toBeLessThan(0.001); // 误差小于 $0.001

        console.log(
            `✅ Cost calculation verified: Expected $${expectedCost.toFixed(4)}, Actual ${costInDetail}`,
        );
    });

    test("should track cumulative cost across outline and question generation", async ({
        page,
    }) => {
        test.setTimeout(240000); // 4分钟超时
        const knowledgeTitle = `Cumulative Cost Test ${timestamp}`;

        // 创建 session
        await page.goto("/dashboard/knowledge/new");
        await page.waitForLoadState("networkidle");

        await page.getByLabel(/输入您的问题或主题/i).fill(knowledgeTitle);

        await page.getByRole("button", { name: /生成知识内容和题目/i }).click();

        // 等待大纲生成完成
        await expect(page.getByText(/正在为所有章节生成题目/i)).toBeVisible({
            timeout: 90000,
        });

        console.log("✅ Outline generation completed (cost accumulated)");

        // 等待题目生成完成
        await expect(page.getByText(/生成完成/i)).toBeVisible({
            timeout: 180000,
        });

        console.log("✅ Question generation completed (cost accumulated)");

        // 等待跳转
        await expect(page).toHaveURL(/\/dashboard\/knowledge/, {
            timeout: 5000,
        });

        await page.waitForTimeout(1000);

        // 查看详情
        await page.locator("div", { hasText: knowledgeTitle }).click();

        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();

        // 验证累计费用
        const costText = await dialog
            .getByText(/Cost:/)
            .locator("..")
            .getByText(/\$\d+\.\d+/)
            .textContent();

        console.log(`📊 Total cumulative cost: ${costText}`);

        // 验证费用 > 0 (因为是两次 AI 调用的累计)
        const cost = Number.parseFloat(costText?.replace("$", "") || "0");
        expect(cost).toBeGreaterThan(0);

        console.log(
            `✅ Cumulative cost tracking verified: ${costText} (includes outline + questions)`,
        );
    });

    test("should display cost with correct precision", async ({ page }) => {
        // 如果已有数据，测试第一个 session
        const firstSession = page
            .locator("div[class*='cursor-pointer']")
            .first();

        if (await firstSession.isVisible()) {
            // 验证列表中的费用格式
            const costInList = firstSession.getByText(/\$\d+\.\d+/);

            if (await costInList.isVisible()) {
                const costText = await costInList.textContent();

                // 验证格式
                // 小于 $0.01 应该显示 4 位小数
                // 大于等于 $0.01 应该显示 2 位小数
                expect(costText).toMatch(/\$\d+\.\d{2,4}/);

                const cost = Number.parseFloat(
                    costText?.replace("$", "") || "0",
                );

                if (cost < 0.01) {
                    expect(costText).toMatch(/\$\d+\.\d{4}/);
                    console.log(
                        `✅ Small cost format correct: ${costText} (4 decimals)`,
                    );
                } else {
                    expect(costText).toMatch(/\$\d+\.\d{2}/);
                    console.log(
                        `✅ Normal cost format correct: ${costText} (2 decimals)`,
                    );
                }
            } else {
                console.log("⚠️ No cost data found, skipping format test");
            }
        } else {
            console.log("⚠️ No sessions found, skipping format test");
        }
    });
});

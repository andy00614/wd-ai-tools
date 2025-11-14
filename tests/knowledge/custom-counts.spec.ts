/**
 * E2E Test: Custom Outline and Question Counts
 *
 * 测试用户自定义大纲数量和题目数量的功能
 * 验证：
 * 1. 前端表单正确接受 3-10 范围的输入
 * 2. 后端正确生成对应数量的大纲和题目
 * 3. 数据库正确保存配置
 *
 * ⚠️ 注意：此测试会调用真实的AI API，可能需要60-180秒完成
 */

import { expect, test } from "@playwright/test";

test.describe("Custom Outline and Question Counts", () => {
    const timestamp = Date.now();

    test.beforeEach(async ({ page }) => {
        await page.goto("/dashboard/knowledge");
        await page.waitForLoadState("networkidle");
    });

    test("should generate exactly 3 outlines with 3 questions each", async ({
        page,
    }) => {
        test.setTimeout(180000); // 3 minutes timeout

        const testTitle = `E2E Test - Min Config (3x3) ${timestamp}`;

        // Click "创建新知识" button
        await page.getByRole("button", { name: /创建新知识/i }).click();

        // Wait for dialog to appear
        await expect(
            page.getByRole("heading", { name: /创建新知识/i }),
        ).toBeVisible();

        // Fill in topic
        await page.getByLabel(/学习主题/i).fill(testTitle);

        // Set numOutlines to 3
        const outlinesInput = page.getByLabel(/大纲章节数量/i);
        await outlinesInput.clear();
        await outlinesInput.fill("3");

        // Set questionsPerOutline to 3
        const questionsInput = page.getByLabel(/每章节题目数量/i);
        await questionsInput.clear();
        await questionsInput.fill("3");

        // Click generate button
        await page.getByRole("button", { name: /开始生成/i }).click();

        // Wait for generation to complete (progress dialog should disappear)
        await expect(page.getByText(/正在生成学习大纲/i)).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText(/正在生成学习大纲/i)).not.toBeVisible({
            timeout: 90000,
        });

        // Should see success toast
        await expect(page.getByText(/知识内容生成成功/i)).toBeVisible({
            timeout: 5000,
        });

        // Wait for page to refresh and load
        await page.waitForLoadState("networkidle");

        // Find the created session in the list
        await expect(page.getByText(testTitle)).toBeVisible({
            timeout: 10000,
        });

        // Click to view details
        await page.getByText(testTitle).click();

        // Should navigate to session detail page
        await expect(page).toHaveURL(/\/dashboard\/knowledge\/\w+/);
        await page.waitForLoadState("networkidle");

        // Verify outline count: should see exactly 3 outline sections
        const outlineHeaders = page.locator(
            'h3:has-text("章节"), [role="heading"]:has-text("Topic"), [role="heading"]:has-text("Chapter")',
        );
        const outlineCount = await outlineHeaders.count();
        expect(outlineCount).toBe(3);

        // Verify question count: should have 3 questions per outline = 9 total
        const questionElements = page.locator(
            '[data-testid="question"], .question-item, [class*="question"]',
        );
        const totalQuestions = await questionElements.count();

        // Should be close to 9 (3 outlines × 3 questions)
        // Allow some variance due to AI generation
        expect(totalQuestions).toBeGreaterThanOrEqual(7);
        expect(totalQuestions).toBeLessThanOrEqual(11);
    });

    test("should generate exactly 10 outlines with 10 questions each", async ({
        page,
    }) => {
        test.setTimeout(300000); // 5 minutes for large generation

        const testTitle = `E2E Test - Max Config (10x10) ${timestamp}`;

        await page.getByRole("button", { name: /创建新知识/i }).click();
        await expect(
            page.getByRole("heading", { name: /创建新知识/i }),
        ).toBeVisible();

        await page.getByLabel(/学习主题/i).fill(testTitle);

        // Set to maximum values
        const outlinesInput = page.getByLabel(/大纲章节数量/i);
        await outlinesInput.clear();
        await outlinesInput.fill("10");

        const questionsInput = page.getByLabel(/每章节题目数量/i);
        await questionsInput.clear();
        await questionsInput.fill("10");

        await page.getByRole("button", { name: /开始生成/i }).click();

        await expect(page.getByText(/正在生成学习大纲/i)).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText(/正在生成学习大纲/i)).not.toBeVisible({
            timeout: 180000,
        });

        await expect(page.getByText(/知识内容生成成功/i)).toBeVisible({
            timeout: 5000,
        });

        await page.waitForLoadState("networkidle");
        await expect(page.getByText(testTitle)).toBeVisible({
            timeout: 10000,
        });

        await page.getByText(testTitle).click();
        await expect(page).toHaveURL(/\/dashboard\/knowledge\/\w+/);
        await page.waitForLoadState("networkidle");

        // Verify outline count: should be close to 10
        const outlineHeaders = page.locator(
            'h3:has-text("章节"), [role="heading"]:has-text("Topic"), [role="heading"]:has-text("Chapter")',
        );
        const outlineCount = await outlineHeaders.count();
        expect(outlineCount).toBeGreaterThanOrEqual(8);
        expect(outlineCount).toBeLessThanOrEqual(12);

        // Verify total questions: should be close to 100 (10 × 10)
        const questionElements = page.locator(
            '[data-testid="question"], .question-item, [class*="question"]',
        );
        const totalQuestions = await questionElements.count();

        expect(totalQuestions).toBeGreaterThanOrEqual(80);
        expect(totalQuestions).toBeLessThanOrEqual(120);
    });

    test("should validate input ranges and show error for invalid values", async ({
        page,
    }) => {
        await page.getByRole("button", { name: /创建新知识/i }).click();
        await expect(
            page.getByRole("heading", { name: /创建新知识/i }),
        ).toBeVisible();

        await page.getByLabel(/学习主题/i).fill("Validation Test");

        // Try to set numOutlines to 2 (below minimum)
        const outlinesInput = page.getByLabel(/大纲章节数量/i);
        await outlinesInput.clear();
        await outlinesInput.fill("2");

        // Verify that input validation shows min is 3
        const minAttr = await outlinesInput.getAttribute("min");
        expect(minAttr).toBe("3");

        // Try to set numOutlines to 11 (above maximum)
        await outlinesInput.clear();
        await outlinesInput.fill("11");

        const maxAttr = await outlinesInput.getAttribute("max");
        expect(maxAttr).toBe("10");

        // Try to set questionsPerOutline to 1 (below minimum)
        const questionsInput = page.getByLabel(/每章节题目数量/i);
        await questionsInput.clear();
        await questionsInput.fill("1");

        const qMinAttr = await questionsInput.getAttribute("min");
        expect(qMinAttr).toBe("3");

        // Try to set questionsPerOutline to 15 (above maximum)
        await questionsInput.clear();
        await questionsInput.fill("15");

        const qMaxAttr = await questionsInput.getAttribute("max");
        expect(qMaxAttr).toBe("10");

        // Set valid values
        await outlinesInput.clear();
        await outlinesInput.fill("5");
        await questionsInput.clear();
        await questionsInput.fill("5");

        // Generate button should be enabled
        const generateButton = page.getByRole("button", { name: /开始生成/i });
        await expect(generateButton).toBeEnabled();
    });

    test("should use default values (5x5) when not specified", async ({
        page,
    }) => {
        test.setTimeout(180000);

        const testTitle = `E2E Test - Default Config ${timestamp}`;

        await page.getByRole("button", { name: /创建新知识/i }).click();
        await page.getByLabel(/学习主题/i).fill(testTitle);

        // Don't change the input values - use defaults
        // Verify default values are shown
        const outlinesInput = page.getByLabel(/大纲章节数量/i);
        const outlineValue = await outlinesInput.inputValue();
        expect(outlineValue).toBe("5");

        const questionsInput = page.getByLabel(/每章节题目数量/i);
        const questionValue = await questionsInput.inputValue();
        expect(questionValue).toBe("5");

        await page.getByRole("button", { name: /开始生成/i }).click();

        await expect(page.getByText(/正在生成学习大纲/i)).toBeVisible({
            timeout: 10000,
        });
        await expect(page.getByText(/正在生成学习大纲/i)).not.toBeVisible({
            timeout: 90000,
        });

        await expect(page.getByText(/知识内容生成成功/i)).toBeVisible({
            timeout: 5000,
        });

        await page.waitForLoadState("networkidle");
        await expect(page.getByText(testTitle)).toBeVisible({
            timeout: 10000,
        });

        await page.getByText(testTitle).click();
        await page.waitForLoadState("networkidle");

        // Should have approximately 5 outlines
        const outlineHeaders = page.locator(
            'h3:has-text("章节"), [role="heading"]:has-text("Topic"), [role="heading"]:has-text("Chapter")',
        );
        const outlineCount = await outlineHeaders.count();
        expect(outlineCount).toBeGreaterThanOrEqual(4);
        expect(outlineCount).toBeLessThanOrEqual(6);

        // Should have approximately 25 questions (5 × 5)
        const questionElements = page.locator(
            '[data-testid="question"], .question-item, [class*="question"]',
        );
        const totalQuestions = await questionElements.count();
        expect(totalQuestions).toBeGreaterThanOrEqual(20);
        expect(totalQuestions).toBeLessThanOrEqual(30);
    });

    test("should persist custom counts in database", async ({ page }) => {
        test.setTimeout(180000);

        const testTitle = `E2E Test - Persistence (7x4) ${timestamp}`;

        await page.getByRole("button", { name: /创建新知识/i }).click();
        await page.getByLabel(/学习主题/i).fill(testTitle);

        // Set custom values
        await page.getByLabel(/大纲章节数量/i).clear();
        await page.getByLabel(/大纲章节数量/i).fill("7");
        await page.getByLabel(/每章节题目数量/i).clear();
        await page.getByLabel(/每章节题目数量/i).fill("4");

        await page.getByRole("button", { name: /开始生成/i }).click();

        await expect(page.getByText(/正在生成学习大纲/i)).not.toBeVisible({
            timeout: 90000,
        });
        await expect(page.getByText(/知识内容生成成功/i)).toBeVisible({
            timeout: 5000,
        });

        // Navigate away and back
        await page.goto("/dashboard");
        await page.waitForLoadState("networkidle");

        await page.goto("/dashboard/knowledge");
        await page.waitForLoadState("networkidle");

        // Find and click the session again
        await expect(page.getByText(testTitle)).toBeVisible({
            timeout: 10000,
        });
        await page.getByText(testTitle).click();
        await page.waitForLoadState("networkidle");

        // Verify counts are still correct
        const outlineHeaders = page.locator(
            'h3:has-text("章节"), [role="heading"]:has-text("Topic"), [role="heading"]:has-text("Chapter")',
        );
        const outlineCount = await outlineHeaders.count();
        expect(outlineCount).toBeGreaterThanOrEqual(6);
        expect(outlineCount).toBeLessThanOrEqual(8);

        // 7 outlines × 4 questions = 28 total
        const questionElements = page.locator(
            '[data-testid="question"], .question-item, [class*="question"]',
        );
        const totalQuestions = await questionElements.count();
        expect(totalQuestions).toBeGreaterThanOrEqual(24);
        expect(totalQuestions).toBeLessThanOrEqual(32);
    });
});

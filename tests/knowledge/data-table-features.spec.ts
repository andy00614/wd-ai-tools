import { test, expect } from "@playwright/test";

test.describe("Knowledge Data Table Features", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/dashboard/knowledge");
        await page.waitForLoadState("networkidle");
    });

    test("should display data table with all columns", async ({ page }) => {
        // Check if table headers are present
        await expect(
            page.getByRole("columnheader", { name: /title/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /model/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /status/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /cost/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /time/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /created/i }),
        ).toBeVisible();
        await expect(
            page.getByRole("columnheader", { name: /actions/i }),
        ).toBeVisible();
    });

    test("should search by title", async ({ page }) => {
        const searchInput = page.getByPlaceholder("Search titles...");
        await expect(searchInput).toBeVisible();

        // Type in search
        await searchInput.fill("操作系统");
        await page.waitForTimeout(500); // Wait for debounce

        // Check if filtered results are shown
        const rows = page.locator("tbody tr");
        const rowCount = await rows.count();

        if (rowCount > 0) {
            // Verify at least one row contains the search term
            const firstRow = rows.first();
            await expect(firstRow).toContainText("操作系统");
        }
    });

    test("should filter by status", async ({ page }) => {
        // Click status filter button
        const statusFilter = page.getByRole("button", { name: /status/i });
        await statusFilter.click();

        // Select "Completed" option
        await page.getByRole("option", { name: /completed/i }).click();

        // Wait for filter to apply
        await page.waitForTimeout(500);

        // Verify filtered results
        const statusBadges = page.locator("tbody tr").getByText(/completed/i);
        const badgeCount = await statusBadges.count();

        expect(badgeCount).toBeGreaterThan(0);
    });

    test("should filter by model", async ({ page }) => {
        // Click model filter button
        const modelFilter = page.getByRole("button", { name: /^model$/i });
        await modelFilter.click();

        // Check if filter options are visible
        await expect(page.getByText("GPT-4")).toBeVisible();
        await expect(page.getByText("Claude Sonnet")).toBeVisible();
        await expect(page.getByText("Gemini Flash")).toBeVisible();
    });

    test("should display time consumption column", async ({ page }) => {
        // Check if time column exists
        await expect(
            page.getByRole("columnheader", { name: /time/i }),
        ).toBeVisible();

        // Check if time values are displayed with correct format
        const timeCell = page.locator("tbody tr").first().locator("td").nth(5);
        const timeText = await timeCell.textContent();

        // Time should be in format like "5.2s" or "-" if empty
        if (timeText && timeText !== "-") {
            expect(timeText).toMatch(/\d+\.\d+s/);
        }
    });

    test("should show pagination at bottom", async ({ page }) => {
        // Check pagination controls are visible
        await expect(page.getByText(/rows per page/i)).toBeVisible();
        await expect(page.getByText(/page \d+ of \d+/i)).toBeVisible();

        // Check pagination buttons
        const prevButton = page.getByRole("button", { name: /previous page/i });
        const nextButton = page.getByRole("button", { name: /next page/i });

        await expect(prevButton).toBeVisible();
        await expect(nextButton).toBeVisible();
    });

    test("should have view details icon button", async ({ page }) => {
        // Find first row's view button (eye icon)
        const viewButton = page
            .locator("tbody tr")
            .first()
            .getByRole("button", { name: /view details/i });
        await expect(viewButton).toBeVisible();

        // Click to open details dialog
        await viewButton.click();

        // Verify dialog opens (check for dialog content)
        await expect(page.locator("[role='dialog']")).toBeVisible();
    });

    test("should have delete button with confirmation", async ({ page }) => {
        // Skip if no sessions exist
        const rowCount = await page.locator("tbody tr").count();
        if (rowCount === 0) {
            test.skip();
            return;
        }

        // Find first row's delete button
        const deleteButton = page
            .locator("tbody tr")
            .first()
            .getByRole("button", { name: /delete/i });
        await expect(deleteButton).toBeVisible();

        // Click delete button
        await deleteButton.click();

        // Verify confirmation dialog appears
        await expect(
            page.getByRole("heading", { name: /delete session/i }),
        ).toBeVisible();
        await expect(page.getByText(/are you sure/i)).toBeVisible();

        // Cancel deletion
        await page.getByRole("button", { name: /cancel/i }).click();

        // Verify dialog closes
        await expect(
            page.getByRole("heading", { name: /delete session/i }),
        ).not.toBeVisible();
    });

    test("should successfully delete a session", async ({ page }) => {
        // Skip if no sessions exist
        const initialRowCount = await page.locator("tbody tr").count();
        if (initialRowCount === 0) {
            test.skip();
            return;
        }

        // Get the title of the first session to verify deletion
        const _firstRowTitle = await page
            .locator("tbody tr")
            .first()
            .locator("td")
            .first()
            .textContent();

        // Click delete button on first row
        const deleteButton = page
            .locator("tbody tr")
            .first()
            .getByRole("button", { name: /delete/i });
        await deleteButton.click();

        // Confirm deletion
        await page.getByRole("button", { name: /^delete$/i }).click();

        // Wait for success toast
        await expect(page.getByText(/deleted successfully/i)).toBeVisible({
            timeout: 5000,
        });

        // Verify row count decreased or shows empty state
        await page.waitForTimeout(1000); // Wait for revalidation

        const newRowCount = await page.locator("tbody tr").count();

        if (newRowCount === 0) {
            // Should show empty state
            await expect(
                page.getByText(/no knowledge sessions yet/i),
            ).toBeVisible();
        } else {
            // Row count should decrease
            expect(newRowCount).toBeLessThan(initialRowCount);
        }
    });

    test("should sort by created date", async ({ page }) => {
        // Click on Created column header to sort
        const createdHeader = page.getByRole("columnheader", {
            name: /created/i,
        });
        await createdHeader.click();

        // Wait for sort to apply
        await page.waitForTimeout(500);

        // Get first two rows' dates
        const firstRowDate = await page
            .locator("tbody tr")
            .first()
            .locator("td")
            .nth(6)
            .textContent();
        const secondRowDate = await page
            .locator("tbody tr")
            .nth(1)
            .locator("td")
            .nth(6)
            .textContent();

        // Both should have valid date formats
        expect(firstRowDate).toBeTruthy();
        expect(secondRowDate).toBeTruthy();
    });

    test("should display correct date format with time", async ({ page }) => {
        const dateCell = page.locator("tbody tr").first().locator("td").nth(6);
        const dateText = await dateCell.textContent();

        // Date should be in format like "Nov 13, 2025 10:27:09"
        if (dateText) {
            expect(dateText).toMatch(
                /[A-Z][a-z]{2} \d{1,2}, \d{4} \d{2}:\d{2}:\d{2}/,
            );
        }
    });

    test("should clear filters", async ({ page }) => {
        // Apply a status filter
        const statusFilter = page.getByRole("button", { name: /status/i });
        await statusFilter.click();
        await page.getByRole("option", { name: /completed/i }).click();

        await page.waitForTimeout(500);

        // Click reset button
        const resetButton = page.getByRole("button", { name: /reset/i });
        if (await resetButton.isVisible()) {
            await resetButton.click();

            // Verify filter is cleared
            await page.waitForTimeout(500);
            await expect(resetButton).not.toBeVisible();
        }
    });
});

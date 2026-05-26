import { expect, test } from "@playwright/test";

import { expectNoEvalDashboard, loginAsAdmin } from "./helpers";

test.describe("Formalist browser smoke", () => {
    test.skip(
        process.env.RUN_BROWSER_E2E !== "1",
        "Set RUN_BROWSER_E2E=1 with local services available to run browser smoke tests."
    );

    test("covers admin, settings, chat, source preview, responsive layout, and no eval dashboard", async ({
        page,
    }) => {
        await loginAsAdmin(page);

        await page.goto("/admin/settings");
        await expect(
            page.getByRole("heading", { name: "Settings" })
        ).toBeVisible();
        await expect(page.getByText("Deployment Status")).toBeVisible();

        await page.goto("/chat");
        await expect(
            page.getByRole("button", { name: "New chat" })
        ).toBeVisible();
        await expect(page.getByLabel("Message")).toBeVisible();

        await page.setViewportSize({ height: 740, width: 390 });
        await expect(page.getByLabel("Message")).toBeVisible();

        await page.goto("/api/source/document/not-a-uuid");
        await expect(page.locator("body")).toContainText("Invalid");

        await expectNoEvalDashboard(page);
    });
});

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
    await page.goto("/admin/login");
    await page.getByLabel("Admin password").fill("admin-pass");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
        page.getByRole("heading", { name: "Admin dashboard" })
    ).toBeVisible();
}

export async function expectNoEvalDashboard(page: Page) {
    await page.goto("/admin/evals");
    await expect(page.getByText("404")).toBeVisible();
}

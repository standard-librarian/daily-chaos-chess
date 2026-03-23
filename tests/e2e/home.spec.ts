import { expect, test } from "@playwright/test";

test("homepage explains the game loop", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /the crowd writes the next move/i })).toBeVisible();
  await expect(page.getByText(/One winning prompt becomes canon each day/i)).toBeVisible();
});

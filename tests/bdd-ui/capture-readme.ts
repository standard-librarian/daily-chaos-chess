import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium, expect } from "@playwright/test";

import { startBddUiServer } from "./server";

async function run(): Promise<void> {
  const server = await startBddUiServer({ port: 3101, databaseUrl: "file:./local.readme.db" });

  try {
    const browser = await chromium.launch({ headless: process.env.PLAYWRIGHT_HEADLESS === "1" });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1180 } });

    await page.request.post(`${server.baseURL}/api/test/reset`);
    await page.goto(server.baseURL, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("board-stage")).toHaveAttribute("data-scene-ready", "true");

    const outputPath = path.join(process.cwd(), "docs/readme/hero-home.png");
    await mkdir(path.dirname(outputPath), { recursive: true });
    await page.locator(".hero-stage").screenshot({ path: outputPath });

    await browser.close();
  } finally {
    await server.stop();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

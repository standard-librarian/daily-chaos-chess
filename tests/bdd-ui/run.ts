import { spawn } from "node:child_process";

import { startBddUiServer } from "./server";

async function run(): Promise<void> {
  const server = await startBddUiServer();

  try {
    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn(
        "node",
        [
          "--import",
          "tsx",
          "./node_modules/@cucumber/cucumber/bin/cucumber.js",
          "--import",
          "tests/bdd-ui/steps.ts",
          "features/ui/**/*.feature"
        ],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            BASE_URL: server.baseURL,
            PLAYWRIGHT_HEADLESS: process.env.PLAYWRIGHT_HEADLESS ?? "0"
          },
          stdio: "inherit"
        }
      );

      child.on("exit", (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    await server.stop();
  }
}

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

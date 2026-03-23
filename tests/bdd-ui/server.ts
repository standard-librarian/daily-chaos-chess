import { spawn } from "node:child_process";
import { once } from "node:events";

interface StartedServer {
  baseURL: string;
  stop: () => Promise<void>;
}

async function waitForServer(url: string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/test/health`);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for test server at ${url}`);
}

export async function startBddUiServer({
  port = 3100,
  databaseUrl = "file:./local.e2e.db"
}: {
  port?: number;
  databaseUrl?: string;
} = {}): Promise<StartedServer> {
  const baseURL = `http://127.0.0.1:${port}`;
  const server = spawn("pnpm", ["dev"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      E2E_MODE: "1",
      TURSO_DATABASE_URL: databaseUrl
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout?.on("data", (chunk) => process.stdout.write(`[bdd-ui:web] ${chunk}`));
  server.stderr?.on("data", (chunk) => process.stderr.write(`[bdd-ui:web] ${chunk}`));

  try {
    await waitForServer(baseURL);
  } catch (error) {
    server.kill("SIGTERM");
    throw error;
  }

  return {
    baseURL,
    async stop() {
      server.kill("SIGTERM");
      await once(server, "exit").catch(() => undefined);
    }
  };
}

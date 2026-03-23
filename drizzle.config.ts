import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";

export default defineConfig({
  dialect: "turso",
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  }
});

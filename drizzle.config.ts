import { defineConfig } from "drizzle-kit";

import { env } from "./app/utils/env";

export default defineConfig({
  dialect: "postgresql",
  schema: "./app/server/infrastructure/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});

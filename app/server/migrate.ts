import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "~/server/infrastructure/drizzle";

await migrate(db, { migrationsFolder: "./drizzle" });
await db.$client.end();

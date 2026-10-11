import { Pool } from "pg";

import { env } from "~/utils/env";

const tablesToTruncate = [
  "Board",
  "Owner",
  "AuthSession",
  "AuthState",
  "JetstreamCursor",
];

const pool = new Pool({ connectionString: env.DATABASE_URL });

export const truncateAllTables = async () => {
  await pool.query(
    `TRUNCATE TABLE ${tablesToTruncate
      .map((t) => `"${t}"`)
      .join(", ")} RESTART IDENTITY CASCADE;`,
  );
};

export const disconnectTruncatePool = () => pool.end();

import pg from "pg";

const url = new URL(process.env.DATABASE_URL);
const databaseName = url.pathname.slice(1);
url.pathname = "/postgres";

const client = new pg.Client({ connectionString: url.toString() });
await client.connect();
try {
  await client.query(`CREATE DATABASE "${databaseName}"`);
} catch (error) {
  if (error.code !== "42P04") {
    // 42P04 = duplicate_database (既に存在する場合は無視)
    throw error;
  }
}
await client.end();

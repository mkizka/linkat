import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";

const globalSetup = async () => {
  const container = await new PostgreSqlContainer("postgres:18-alpine").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  execSync("pnpm prisma migrate deploy", { stdio: "inherit" });
  return () => container.stop();
};

export default globalSetup;

import { execSync, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TestNetwork } from "@atproto/dev-env";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Wait } from "testcontainers";

import { PORTS } from "./constants";

// TestNetworkのPDSはos.tmpdir()以下にデータを作って終了後も残すので、専用ディレクトリに集めて終了時に消す
const tmp = await mkdtemp(join(tmpdir(), "linkat-dev-env-"));
process.env.TMPDIR = tmp;

const postgres = await new PostgreSqlContainer("postgres:18-alpine").start();
const DATABASE_URL = postgres.getConnectionUri();
execSync("pnpm drizzle-kit migrate", {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL },
});

// TestNetworkは必須にしているが、AppViewはredisを使わない
process.env.REDIS_HOST ??= "localhost";

const network = await TestNetwork.create({
  dbPostgresUrl: DATABASE_URL,
  dbPostgresSchema: "linkat",
  plc: { port: PORTS.plc },
  pds: { port: PORTS.pds, hostname: "localhost" },
  bsky: { port: PORTS.bsky },
});

// OAuthのスコープに含めるpermission-setをPDSが解決出来るようにする
const agent = network.pds.getAgent();
await agent.login({ identifier: "lex-authority.test", password: "hunter2" });
await agent.com.atproto.repo.createRecord({
  repo: agent.assertDid,
  collection: "com.atproto.lexicon.schema",
  rkey: "blue.linkat.permissionSet",
  record: {
    lexicon: 1,
    id: "blue.linkat.permissionSet",
    defs: {
      main: {
        type: "permission-set",
        title: "Linkat",
        detail: "Create, update, and delete your board",
        permissions: [
          {
            type: "permission",
            resource: "repo",
            collection: ["blue.linkat.board"],
          },
        ],
      },
    },
  },
});

await network.pds.getAgent().createAccount({
  handle: "alice.test",
  email: "alice@example.com",
  password: "password",
});

const jetstream = await new GenericContainer(
  "ghcr.io/bluesky-social/jetstream:v0.3.3",
)
  .withNetworkMode("host")
  .withEnvironment({
    JETSTREAM_ADDR: `:${PORTS.jetstream}`,
    JETSTREAM_RELAY_URL: `http://localhost:${PORTS.pds}`,
    JETSTREAM_PLC_URL: `http://localhost:${PORTS.plc}`,
    JETSTREAM_DATA_DIR: "/tmp/jetstream",
    JETSTREAM_BACKFILL_REPOS: agent.assertDid,
  })
  .withWaitStrategy(Wait.forLogMessage(/steady-state consumer running/))
  .start();

process.stdout.write("Test account: alice.test / password\n");

const app = spawn(process.argv.slice(2).join(" "), {
  shell: true,
  detached: true,
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL,
    ATPROTO_PLC_URL: `http://localhost:${PORTS.plc}`,
    ATPROTO_HANDLE_RESOLVER_URL: `http://localhost:${PORTS.pds}`,
    JETSTREAM_URL: `ws://localhost:${PORTS.jetstream}/subscribe`,
  },
});

app.on("exit", async () => {
  await network.close();
  await Promise.all([jetstream.stop(), postgres.stop()]);
  await rm(tmp, { recursive: true, force: true });
  process.exit();
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (app.pid) process.kill(-app.pid, "SIGTERM");
  });
}

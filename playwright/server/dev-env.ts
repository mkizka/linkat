import { TestNetwork } from "@atproto/dev-env";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Wait } from "testcontainers";

import { PORTS } from "./constants";

const postgres = await new PostgreSqlContainer("postgres:18-alpine").start();

// TestNetworkは必須にしているが、AppViewはredisを使わない
process.env.REDIS_HOST ??= "localhost";

const network = await TestNetwork.create({
  dbPostgresUrl: postgres.getConnectionUri(),
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

await new GenericContainer("ghcr.io/bluesky-social/jetstream:v0.3.3")
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

process.stdout.write("atproto network is ready\n");

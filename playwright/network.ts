import { TestNetwork } from "@atproto/dev-env";
import pg from "pg";

import { PORTS } from "./ports";

const DB_SCHEMA = "linkat";

// 前回の実行で残ったデータとPLCの内容が食い違わないように作り直す
const client = new pg.Client(process.env.DATABASE_URL);
await client.connect();
for (const prefix of ["appview", "bsync", "ozone"]) {
  await client.query(`DROP SCHEMA IF EXISTS ${prefix}_${DB_SCHEMA} CASCADE`);
}
await client.end();

// TestNetworkは必須にしているが、AppViewはredisを使わない
process.env.REDIS_HOST ??= "localhost";

const network = await TestNetwork.create({
  dbPostgresUrl: process.env.DATABASE_URL,
  dbPostgresSchema: DB_SCHEMA,
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

// playwrightのwebServerはこの出力を待ってから次のサーバーを起動する
process.stdout.write("atproto network is ready\n");

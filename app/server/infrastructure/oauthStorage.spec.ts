import type {
  NodeSavedSession,
  NodeSavedState,
} from "@atproto/oauth-client-node";
import { Pool } from "pg";

import { env } from "~/utils/env";

import { db } from "./drizzle";
import { sessionStoreFactory, stateStoreFactory } from "./oauthStorage";

const pool = new Pool({ connectionString: env.DATABASE_URL });

afterAll(async () => {
  await pool.end();
});

const selectStates = async (key: string): Promise<unknown[]> => {
  const { rows } = await pool.query<{ state: string }>(
    `SELECT state FROM "AuthState" WHERE key = $1`,
    [key],
  );
  return rows.map((row): unknown => JSON.parse(row.state));
};

const selectSessions = async (key: string): Promise<unknown[]> => {
  const { rows } = await pool.query<{ session: string }>(
    `SELECT session FROM "AuthSession" WHERE key = $1`,
    [key],
  );
  return rows.map((row): unknown => JSON.parse(row.session));
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const dummyState = { verifier: "verifier1" } as NodeSavedState;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const dummySession = { authMethod: "none" } as unknown as NodeSavedSession;

describe("StateStore", () => {
  const stateStore = stateStoreFactory({ db });

  describe("get", () => {
    test("保存されていない場合はundefinedを返す", async () => {
      // arrange
      // act
      const actual = await stateStore.get("key1");
      // assert
      expect(actual).toBeUndefined();
    });
    test("保存されている場合はパースしたstateを返す", async () => {
      // arrange
      await pool.query(`INSERT INTO "AuthState" (key, state) VALUES ($1, $2)`, [
        "key1",
        JSON.stringify(dummyState),
      ]);
      // act
      const actual = await stateStore.get("key1");
      // assert
      expect(actual).toEqual(dummyState);
    });
  });

  describe("set", () => {
    test("新規にstateを保存できる", async () => {
      // arrange
      // act
      await stateStore.set("key1", dummyState);
      // assert
      expect(await selectStates("key1")).toEqual([dummyState]);
    });
    test("既存のstateを上書きできる", async () => {
      // arrange
      await pool.query(`INSERT INTO "AuthState" (key, state) VALUES ($1, $2)`, [
        "key1",
        JSON.stringify(dummyState),
      ]);
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const newState = { verifier: "verifier2" } as NodeSavedState;
      // act
      await stateStore.set("key1", newState);
      // assert
      expect(await selectStates("key1")).toEqual([newState]);
    });
  });

  describe("del", () => {
    test("保存したstateを削除できる", async () => {
      // arrange
      await pool.query(`INSERT INTO "AuthState" (key, state) VALUES ($1, $2)`, [
        "key1",
        JSON.stringify(dummyState),
      ]);
      // act
      await stateStore.del("key1");
      // assert
      expect(await selectStates("key1")).toEqual([]);
    });
  });
});

describe("SessionStore", () => {
  const sessionStore = sessionStoreFactory({ db });

  describe("get", () => {
    test("保存されていない場合はundefinedを返す", async () => {
      // arrange
      // act
      const actual = await sessionStore.get("key1");
      // assert
      expect(actual).toBeUndefined();
    });
    test("保存されている場合はパースしたsessionを返す", async () => {
      // arrange
      await pool.query(
        `INSERT INTO "AuthSession" (key, session) VALUES ($1, $2)`,
        ["key1", JSON.stringify(dummySession)],
      );
      // act
      const actual = await sessionStore.get("key1");
      // assert
      expect(actual).toEqual(dummySession);
    });
  });

  describe("set", () => {
    test("新規にsessionを保存できる", async () => {
      // arrange
      // act
      await sessionStore.set("key1", dummySession);
      // assert
      expect(await selectSessions("key1")).toEqual([dummySession]);
    });
    test("既存のsessionを上書きできる", async () => {
      // arrange
      await pool.query(
        `INSERT INTO "AuthSession" (key, session) VALUES ($1, $2)`,
        ["key1", JSON.stringify(dummySession)],
      );
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const newSession = {
        authMethod: "private_key_jwt",
      } as unknown as NodeSavedSession;
      // act
      await sessionStore.set("key1", newSession);
      // assert
      expect(await selectSessions("key1")).toEqual([newSession]);
    });
  });

  describe("del", () => {
    test("保存したsessionを削除できる", async () => {
      // arrange
      await pool.query(
        `INSERT INTO "AuthSession" (key, session) VALUES ($1, $2)`,
        ["key1", JSON.stringify(dummySession)],
      );
      // act
      await sessionStore.del("key1");
      // assert
      expect(await selectSessions("key1")).toEqual([]);
    });
  });
});

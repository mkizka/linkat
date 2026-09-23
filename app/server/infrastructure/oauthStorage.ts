import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { eq } from "drizzle-orm";

import type { Db } from "~/server/infrastructure/drizzle";
import {
  authSessionTable,
  authStateTable,
} from "~/server/infrastructure/schema";

export const stateStoreFactory = ({ db }: { db: Db }): NodeSavedStateStore => ({
  async get(key) {
    const [authState] = await db
      .select()
      .from(authStateTable)
      .where(eq(authStateTable.key, key));
    if (!authState) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(authState.state) as NodeSavedState;
  },
  async set(key, state) {
    const data = { key, state: JSON.stringify(state) };
    await db
      .insert(authStateTable)
      .values(data)
      .onConflictDoUpdate({ target: authStateTable.key, set: data });
  },
  async del(key) {
    await db.delete(authStateTable).where(eq(authStateTable.key, key));
  },
});

export const sessionStoreFactory = ({
  db,
}: {
  db: Db;
}): NodeSavedSessionStore => ({
  async get(key) {
    const [authSession] = await db
      .select()
      .from(authSessionTable)
      .where(eq(authSessionTable.key, key));
    if (!authSession) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(authSession.session) as NodeSavedSession;
  },
  async set(key, session) {
    const data = { key, session: JSON.stringify(session) };
    await db
      .insert(authSessionTable)
      .values(data)
      .onConflictDoUpdate({ target: authSessionTable.key, set: data });
  },
  async del(key) {
    await db.delete(authSessionTable).where(eq(authSessionTable.key, key));
  },
});

import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { eq } from "drizzle-orm";

import { db } from "~/server/infrastructure/drizzle";
import {
  authSessionTable,
  authStateTable,
} from "~/server/infrastructure/schema";

export class StateStore implements NodeSavedStateStore {
  async get(key: string): Promise<NodeSavedState | undefined> {
    const [authState] = await db
      .select()
      .from(authStateTable)
      .where(eq(authStateTable.key, key));
    if (!authState) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(authState.state) as NodeSavedState;
  }

  async set(key: string, state: NodeSavedState) {
    const data = { key, state: JSON.stringify(state) };
    await db
      .insert(authStateTable)
      .values(data)
      .onConflictDoUpdate({ target: authStateTable.key, set: data });
  }

  async del(key: string) {
    await db.delete(authStateTable).where(eq(authStateTable.key, key));
  }
}

export class SessionStore implements NodeSavedSessionStore {
  async get(key: string): Promise<NodeSavedSession | undefined> {
    const [authSession] = await db
      .select()
      .from(authSessionTable)
      .where(eq(authSessionTable.key, key));
    if (!authSession) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return JSON.parse(authSession.session) as NodeSavedSession;
  }

  async set(key: string, session: NodeSavedSession) {
    const data = { key, session: JSON.stringify(session) };
    await db
      .insert(authSessionTable)
      .values(data)
      .onConflictDoUpdate({ target: authSessionTable.key, set: data });
  }

  async del(key: string) {
    await db.delete(authSessionTable).where(eq(authSessionTable.key, key));
  }
}

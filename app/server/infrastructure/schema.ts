import {
  bigint,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const ownerTable = pgTable(
  "Owner",
  {
    did: text().primaryKey(),
    avatar: text(),
    avatarCid: text(),
    description: text(),
    displayName: text(),
    handle: text(),
    createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp({ precision: 3 }).notNull(),
  },
  (table) => [uniqueIndex("Owner_handle_key").on(table.handle)],
);

export const boardTable = pgTable(
  "Board",
  {
    id: serial().primaryKey(),
    ownerDid: text().notNull(),
    record: text().notNull(),
    createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp({ precision: 3 }).notNull(),
  },
  // 持ち主の写しが無いボードもあるため、外部キーは張らない
  (table) => [uniqueIndex("Board_ownerDid_key").on(table.ownerDid)],
);

export const authSessionTable = pgTable("AuthSession", {
  key: text().primaryKey(),
  session: text().notNull(),
});

export const authStateTable = pgTable("AuthState", {
  key: text().primaryKey(),
  state: text().notNull(),
});

export const jetstreamCursorTable = pgTable("JetstreamCursor", {
  id: integer().primaryKey().default(1),
  cursor: bigint({ mode: "number" }).notNull(),
});

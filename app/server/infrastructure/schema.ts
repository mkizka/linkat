import {
  bigint,
  foreignKey,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("User", {
  did: text().primaryKey(),
  avatar: text(),
  description: text(),
  displayName: text(),
  handle: text().notNull(),
  createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ precision: 3 }).notNull(),
});

export const boardTable = pgTable(
  "Board",
  {
    id: serial().primaryKey(),
    userDid: text().notNull(),
    record: text().notNull(),
    createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp({ precision: 3 }).notNull(),
  },
  (table) => [
    uniqueIndex("Board_userDid_key").on(table.userDid),
    foreignKey({
      columns: [table.userDid],
      foreignColumns: [userTable.did],
      name: "Board_userDid_fkey",
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
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

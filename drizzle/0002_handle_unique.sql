ALTER TABLE "User" ALTER COLUMN "handle" DROP NOT NULL;--> statement-breakpoint
UPDATE "User" SET "handle" = NULL WHERE "did" IN (
  SELECT "did" FROM (
    SELECT "did", ROW_NUMBER() OVER (PARTITION BY "handle" ORDER BY "updatedAt" DESC, "did") AS "rank" FROM "User"
  ) AS "ranked" WHERE "rank" > 1
);--> statement-breakpoint
CREATE UNIQUE INDEX "User_handle_key" ON "User" USING btree ("handle");

ALTER TABLE "Board" DROP CONSTRAINT "Board_userDid_fkey";--> statement-breakpoint
DELETE FROM "User" WHERE NOT EXISTS (
  SELECT 1 FROM "Board" WHERE "Board"."userDid" = "User"."did"
);

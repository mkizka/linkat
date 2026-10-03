ALTER TABLE "Board" DROP CONSTRAINT "Board_userDid_fkey";--> statement-breakpoint
ALTER TABLE "User" RENAME TO "Owner";--> statement-breakpoint
ALTER INDEX "User_handle_key" RENAME TO "Owner_handle_key";--> statement-breakpoint
ALTER TABLE "Owner" RENAME CONSTRAINT "User_pkey" TO "Owner_pkey";--> statement-breakpoint
ALTER TABLE "Board" RENAME COLUMN "userDid" TO "ownerDid";--> statement-breakpoint
ALTER INDEX "Board_userDid_key" RENAME TO "Board_ownerDid_key";--> statement-breakpoint
DELETE FROM "Owner" WHERE NOT EXISTS (
  SELECT 1 FROM "Board" WHERE "Board"."ownerDid" = "Owner"."did"
);

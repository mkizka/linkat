ALTER TABLE "User" RENAME TO "Owner";--> statement-breakpoint
ALTER TABLE "Owner" RENAME CONSTRAINT "User_pkey" TO "Owner_pkey";--> statement-breakpoint
ALTER INDEX "User_handle_key" RENAME TO "Owner_handle_key";--> statement-breakpoint
ALTER TABLE "Board" RENAME COLUMN "userDid" TO "ownerDid";--> statement-breakpoint
ALTER INDEX "Board_userDid_key" RENAME TO "Board_ownerDid_key";

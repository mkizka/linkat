ALTER TABLE "User" RENAME COLUMN "avatar" TO "avatarCid";--> statement-breakpoint
UPDATE "User" SET "avatarCid" = substring("avatarCid" from '/([^/@]+)(@[a-z]+)*$');

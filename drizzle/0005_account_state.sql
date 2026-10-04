ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "User" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "User" SET "active" = false WHERE "status" <> 'active';--> statement-breakpoint
UPDATE "User" SET "status" = NULL WHERE "status" IN ('active', 'inactive');

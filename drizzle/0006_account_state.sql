ALTER TABLE "Owner" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "Owner" ALTER COLUMN "status" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Owner" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
UPDATE "Owner" SET "active" = false WHERE "status" <> 'active';--> statement-breakpoint
UPDATE "Owner" SET "status" = NULL WHERE "status" IN ('active', 'inactive');

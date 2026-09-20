CREATE TABLE IF NOT EXISTS "AuthSession" (
	"key" text PRIMARY KEY NOT NULL,
	"session" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "AuthState" (
	"key" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Board" (
	"id" serial PRIMARY KEY NOT NULL,
	"userDid" text NOT NULL,
	"record" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "JetstreamCursor" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"cursor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"did" text PRIMARY KEY NOT NULL,
	"avatar" text,
	"description" text,
	"displayName" text,
	"handle" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "Board" ADD CONSTRAINT "Board_userDid_fkey" FOREIGN KEY ("userDid") REFERENCES "public"."User"("did") ON DELETE restrict ON UPDATE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "Board_userDid_key" ON "Board" USING btree ("userDid");
CREATE TABLE "AuthSession" (
	"key" text PRIMARY KEY NOT NULL,
	"session" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "AuthState" (
	"key" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Board" (
	"id" serial PRIMARY KEY NOT NULL,
	"userDid" text NOT NULL,
	"record" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "JetstreamCursor" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"cursor" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"did" text PRIMARY KEY NOT NULL,
	"avatar" text,
	"description" text,
	"displayName" text,
	"handle" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Board" ADD CONSTRAINT "Board_userDid_fkey" FOREIGN KEY ("userDid") REFERENCES "public"."User"("did") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Board_userDid_key" ON "Board" USING btree ("userDid");
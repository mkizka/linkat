CREATE TABLE "Moderation" (
	"did" text PRIMARY KEY NOT NULL,
	"level" text NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) NOT NULL
);

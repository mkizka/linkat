ALTER TABLE "User" ADD COLUMN "avatarCid" text;--> statement-breakpoint
UPDATE "User" SET "avatarCid" = substring("avatar" from '^https://cdn\.bsky\.app/img/avatar/plain/[^/]+/(baf[a-z2-7]+)(@[a-z]+)?$');

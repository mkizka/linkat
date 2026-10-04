UPDATE "Owner" SET "avatarCid" = substring("avatar" from '^https://cdn\.bsky\.app/img/avatar/plain/[^/]+/([^@/]+)@') WHERE "avatarCid" IS NULL AND "avatar" IS NOT NULL;

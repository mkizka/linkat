import { z } from "zod";

export const MAX_BSKY_LINKS = 10;

export const bskyLinkUrlSchema = z.url({ protocol: /^https$/ });

import emojiRegex from "emoji-regex";
import { z } from "zod";

const isOnlySingleEmoji = (val: string) => {
  const emojis = val.match(emojiRegex());
  return emojis?.length === 1 && val === emojis[0];
};

export const cardSchema = z.object({
  url: z
    .url()
    .refine((val) => val.startsWith("https://") || val.startsWith("http://"))
    .or(z.literal(""))
    .optional(),
  text: z.string().optional(),
  emoji: z.string().refine(isOnlySingleEmoji).or(z.literal("")).optional(),
});

export type ValidCard = z.infer<typeof cardSchema>;

export const MAX_EXPORT_CARDS = 10;

export const isExportableCard = (card: ValidCard) =>
  !!card.url?.startsWith("https://");

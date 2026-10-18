import emojiRegex from "emoji-regex";
import { z } from "zod";

const isOnlySingleEmoji = (val: string) => {
  const emojis = val.match(emojiRegex());
  return emojis?.length === 1 && val === emojis[0];
};

export const cardSchema = z
  .object({
    url: z
      .url()
      .refine((val) => val.startsWith("https://") || val.startsWith("http://"))
      .or(z.literal(""))
      .optional(),
    text: z.string().optional(),
    emoji: z.string().refine(isOnlySingleEmoji).or(z.literal("")).optional(),
  })
  .refine((card) => card.url || card.text, {
    params: { code: "url-or-text-required" },
  });

export type BoardCard = z.infer<typeof cardSchema>;

export const boardSchema = z.object({
  cards: z
    .unknown()
    .array()
    .transform((val) =>
      // パースが通るならパース結果、そうでなければフィルタする
      val.flatMap((card) => {
        try {
          return cardSchema.parse(card);
        } catch {
          return [];
        }
      }),
    ),
});

import { z } from "zod";

export const cardSchema = z.object({
  url: z
    .string()
    .url()
    .refine((val) => val.startsWith("https://") || val.startsWith("http://"))
    .or(z.literal(""))
    .optional(),
  text: z.string().optional(),
  emoji: z
    .string()
    .regex(/^\p{Emoji}$/u)
    .or(z.literal(""))
    .optional(),
});

export type ValidCard = z.infer<typeof cardSchema>;

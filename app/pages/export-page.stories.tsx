import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExportPage } from "./export-page";

const meta = {
  component: ExportPage,
  parameters: { layout: "fullscreen" },
  args: {
    handle: "example.bsky.social",
    cards: [
      { url: "https://bsky.app/profile/example.bsky.social", text: "Bluesky" },
      { url: "https://github.com/example", text: "GitHub", emoji: "🐙" },
      { text: "テキストのみのカード" },
      { url: "https://example.com", text: "ブログ", emoji: "✏️" },
      { url: "http://example.com", text: "httpのカード" },
      { url: "https://example.com/portfolio" },
    ],
  },
} satisfies Meta<typeof ExportPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Done: Story = {
  args: {
    exportedCards: [
      { url: "https://bsky.app/profile/example.bsky.social", text: "Bluesky" },
      { url: "https://github.com/example", text: "GitHub" },
      { url: "https://example.com/portfolio" },
    ],
  },
};

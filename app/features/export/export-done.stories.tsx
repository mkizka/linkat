import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExportDone } from "./export-done";

const meta = {
  component: ExportDone,
  args: {
    handle: "me.bsky.social",
    cards: [
      { url: "https://github.com/me", text: "GitHub" },
      { url: "https://me.example.com", text: "ブログ" },
      { url: "https://portfolio.example.com" },
    ],
  },
} satisfies Meta<typeof ExportDone>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

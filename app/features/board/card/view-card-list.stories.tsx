import type { Meta, StoryObj } from "@storybook/react-vite";

import { ViewCardList } from "./view-card-list";

const meta = {
  component: ViewCardList,
  args: {
    cards: [
      { url: "https://example.com", text: "Example" },
      { url: "https://bsky.app/profile/example.bsky.social" },
      { text: "テキストのみのカード", emoji: "📝" },
    ],
  },
} satisfies Meta<typeof ViewCardList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

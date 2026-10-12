import type { Meta, StoryObj } from "@storybook/react-vite";

import { ViewCard } from "./view-card";

const meta = {
  component: ViewCard,
  args: {
    card: { url: "https://example.com", text: "Example" },
  },
} satisfies Meta<typeof ViewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Link: Story = {};

export const Text: Story = {
  args: { card: { text: "テキストのみのカード", emoji: "📝" } },
};

export const BlueskyProfile: Story = {
  args: {
    card: { url: "https://bsky.app/profile/example.bsky.social" },
  },
};

export const BlueskyFeed: Story = {
  args: {
    card: {
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/feed/whats-hot",
    },
  },
};

export const BlueskyPost: Story = {
  args: {
    card: {
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l",
    },
  },
};

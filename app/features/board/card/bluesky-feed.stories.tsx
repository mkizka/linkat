import type { Meta, StoryObj } from "@storybook/react-vite";

import { BlueskyFeedView } from "./bluesky-feed";

const meta = {
  component: BlueskyFeedView,
  args: {
    feed: {
      displayName: "サンプルフィード",
      description: "フィードの説明文です。\n複数行にも対応しています。",
      creatorHandle: "example.bsky.social",
    },
    error: false,
    url: "https://bsky.app/profile/example.bsky.social/feed/sample",
  },
} satisfies Meta<typeof BlueskyFeedView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { feed: null },
};

export const Error: Story = {
  args: { error: true },
};

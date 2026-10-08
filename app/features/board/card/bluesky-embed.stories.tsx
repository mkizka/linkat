import type { Meta, StoryObj } from "@storybook/react-vite";

import { BlueskyEmbed } from "./bluesky-embed";

const meta = {
  component: BlueskyEmbed,
  args: {
    blueskyUri:
      "at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3l6oveex3ii2l",
  },
} satisfies Meta<typeof BlueskyEmbed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

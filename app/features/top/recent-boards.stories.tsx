import type { Meta, StoryObj } from "@storybook/react-vite";

import { RecentBoards } from "./recent-boards";

const meta = {
  component: RecentBoards,
  args: {
    owners: Array.from({ length: 8 }, (_, i) => ({
      did: `did:plc:${i}`,
      handleOrDid: `user${i}.bsky.social`,
      displayHandle: `@user${i}.bsky.social`,
      displayName: `User ${i}`,
      description: null,
      avatarUrl: null,
    })),
  },
} satisfies Meta<typeof RecentBoards>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

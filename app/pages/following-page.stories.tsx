import type { Meta, StoryObj } from "@storybook/react-vite";

import { FollowingPage } from "./following-page";

const now = new Date("2026-10-11T12:00:00Z");

const owner = (name: string) => ({
  did: `did:plc:${name}` as const,
  handleOrDid: `${name}.bsky.social`,
  displayHandle: `@${name}.bsky.social`,
  displayName: name,
  avatarUrl: null,
});

const meta = {
  component: FollowingPage,
  parameters: { layout: "fullscreen" },
  args: {
    boards: [
      { owner: owner("neko"), updatedAt: new Date("2026-10-11T09:00:00Z") },
      { owner: owner("taro"), updatedAt: new Date("2026-10-10T12:00:00Z") },
      { owner: owner("alice"), updatedAt: new Date("2026-09-11T12:00:00Z") },
    ],
    url: "https://linkat.blue",
    now,
  },
} satisfies Meta<typeof FollowingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { boards: [] },
};

export const Failed: Story = {
  args: { boards: null },
};

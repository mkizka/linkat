import type { Meta, StoryObj } from "@storybook/react-vite";

import { TopPage } from "./top-page";

const meta = {
  component: TopPage,
  parameters: { layout: "fullscreen" },
  args: {
    editor: null,
    hasBoard: false,
    experimental: false,
    recentOwners: Array.from({ length: 8 }, (_, i) => ({
      did: `did:plc:${i}`,
      handleOrDid: `user${i}.bsky.social`,
      displayHandle: `@user${i}.bsky.social`,
      displayName: `User ${i}`,
      avatarUrl: null,
    })),
  },
} satisfies Meta<typeof TopPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const editor = {
  did: "did:plc:me",
  handleOrDid: "me.bsky.social",
  displayHandle: "@me.bsky.social",
  displayName: "Me",
  avatarUrl: null,
} as const;

export const Login: Story = {
  args: { editor, hasBoard: true },
};

export const LoginWithoutBoard: Story = {
  args: { editor, hasBoard: false },
};

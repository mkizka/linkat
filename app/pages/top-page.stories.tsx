import type { Meta, StoryObj } from "@storybook/react-vite";

import { TopPage } from "./top-page";

const meta = {
  component: TopPage,
  parameters: { layout: "fullscreen" },
  args: {
    isLogin: false,
    sampleUrl: "https://linkat.blue/sample",
    recentOwners: Array.from({ length: 8 }, (_, i) => ({
      did: `did:plc:${i}`,
      handleOrDid: `user${i}.bsky.social`,
      displayHandle: `@user${i}.bsky.social`,
      displayName: `User ${i}`,
      description: null,
      avatarUrl: null,
    })),
  },
} satisfies Meta<typeof TopPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Login: Story = {
  args: { isLogin: true },
};

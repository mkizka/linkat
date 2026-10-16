import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardActions } from "./board-actions";

const meta = {
  component: BoardActions,
  args: {
    owner: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
    url: "https://linkat.blue/example.bsky.social",
    isMine: false,
    isLogin: false,
  },
} satisfies Meta<typeof BoardActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mine: Story = {
  args: { isMine: true, isLogin: true },
};

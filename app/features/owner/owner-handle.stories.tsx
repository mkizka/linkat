import type { Meta, StoryObj } from "@storybook/react-vite";

import { OwnerHandle } from "./owner-handle";

const meta = {
  component: OwnerHandle,
  args: {
    owner: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
  },
} satisfies Meta<typeof OwnerHandle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InvalidHandle: Story = {
  args: {
    owner: {
      did: "did:plc:example",
      handleOrDid: "did:plc:example",
      displayHandle: null,
      displayName: "Example",
      avatarUrl: null,
    },
  },
};

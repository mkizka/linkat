import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProfileCard } from "./profile-card";

const meta = {
  component: ProfileCard,
  args: {
    owner: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
    url: "https://linkat.blue/example.bsky.social",
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithEditButton: Story = {
  args: { showEditButton: true },
};

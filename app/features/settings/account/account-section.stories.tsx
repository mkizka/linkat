import type { Meta, StoryObj } from "@storybook/react-vite";

import { AccountSection } from "./account-section";

const meta = {
  component: AccountSection,
  args: {
    editor: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
  },
} satisfies Meta<typeof AccountSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

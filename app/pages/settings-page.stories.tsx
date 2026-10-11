import type { Meta, StoryObj } from "@storybook/react-vite";

import { SettingsPage } from "./settings-page";

const meta = {
  component: SettingsPage,
  parameters: { layout: "fullscreen" },
  args: {
    editor: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
  },
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { EditorProfile } from "./editor-profile";

const meta = {
  component: EditorProfile,
  args: {
    editor: {
      did: "did:plc:me",
      handleOrDid: "me.bsky.social",
      displayHandle: "@me.bsky.social",
      displayName: "Me",
      avatarUrl: null,
      synced: true,
    },
  },
} satisfies Meta<typeof EditorProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

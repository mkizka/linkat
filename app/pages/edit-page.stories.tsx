import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { EditPage } from "./edit-page";

const meta = {
  component: EditPage,
  parameters: { layout: "fullscreen" },
  args: {
    editor: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
    board: {
      cards: [
        { url: "https://example.com", text: "Example" },
        { text: "テキストのみのカード", emoji: "📝" },
      ],
    },
    url: "https://linkat.blue/example.bsky.social",
    syncState: "ready",
    onRetrySync: fn(),
  },
} satisfies Meta<typeof EditPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SyncLoading: Story = {
  args: { syncState: "loading" },
};

export const SyncError: Story = {
  args: { syncState: "error" },
};

import type { Meta, StoryObj } from "@storybook/react-vite";

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
  },
} satisfies Meta<typeof EditPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

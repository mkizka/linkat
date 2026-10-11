import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardViewer } from "./board-viewer";

const meta = {
  component: BoardViewer,
  args: {
    owner: {
      did: "did:plc:example",
      handleOrDid: "example.bsky.social",
      displayHandle: "@example.bsky.social",
      displayName: "Example",
      avatarUrl: null,
    },
    board: {
      cards: [
        { url: "https://example.com", text: "Example" },
        { url: "https://bsky.app/profile/example.bsky.social" },
        { text: "テキストのみのカード", emoji: "📝" },
      ],
    },
    url: "https://linkat.blue/example.bsky.social",
  },
} satisfies Meta<typeof BoardViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mine: Story = {
  args: { isMine: true },
};

export const Editable: Story = {
  args: { editable: true, isMine: true },
};

export const Empty: Story = {
  args: { board: null },
};

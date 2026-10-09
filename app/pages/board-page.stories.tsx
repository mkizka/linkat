import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardPage, HiddenBoardPage } from "./board-page";

const meta = {
  component: BoardPage,
  parameters: { layout: "fullscreen" },
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
    isMine: false,
  },
} satisfies Meta<typeof BoardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mine: Story = {
  args: { isMine: true },
};

export const Saved: Story = {
  args: { isMine: true },
  parameters: { path: "/?success" },
};

export const Hidden: Story = {
  render: () => <HiddenBoardPage status="takendown" />,
};

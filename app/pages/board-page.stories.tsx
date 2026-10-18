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
        { url: "https://example.com" },
        { text: "テキストのみのカード" },
        { url: "https://example.com", text: "テキストとURLのカード" },
        {
          url: "https://example.com",
          text: "絵文字アイコンのカード",
          emoji: "📝",
        },
        {
          url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l",
        },
        {
          url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/feed/whats-hot",
        },
      ],
    },
    url: "https://linkat.blue/example.bsky.social",
    isMine: false,
    isLogin: false,
    admin: null,
  },
} satisfies Meta<typeof BoardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { board: { cards: [] } },
};

export const LoggedIn: Story = {
  args: { isLogin: true },
};

export const Mine: Story = {
  args: { isMine: true, isLogin: true },
};

export const Saved: Story = {
  args: { isMine: true, isLogin: true },
  parameters: { path: "/?success" },
};

export const AdminUnlisted: Story = {
  args: { admin: { moderationLevel: "unlisted" } },
};

export const AdminHidden: Story = {
  args: { admin: { moderationLevel: "hidden" } },
};

export const Hidden: Story = {
  render: () => <HiddenBoardPage status="takendown" />,
};

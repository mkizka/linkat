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
  },
} satisfies Meta<typeof EditPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

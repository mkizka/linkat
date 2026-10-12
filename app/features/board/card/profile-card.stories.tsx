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
      description: null,
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

export const WithLongDescription: Story = {
  args: {
    owner: {
      ...meta.args.owner,
      description:
        "1行目の自己紹介です\n2行目の自己紹介です\n3行目は折りたたまれて見えません",
    },
  },
};

export const WithLongSingleLineDescription: Story = {
  args: {
    owner: {
      ...meta.args.owner,
      description:
        "改行を含まない長い自己紹介の例です。Linkatでリンク集を作っています。Blueskyでは主にWeb開発や日々の出来事について投稿しています。気軽にフォローしてください。",
    },
  },
};

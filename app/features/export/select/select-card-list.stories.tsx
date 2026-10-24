import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SelectCardList } from "./select-card-list";

const meta = {
  component: SelectCardList,
  args: {
    cards: [
      { url: "https://example.com", text: "Example" },
      { url: "https://bsky.app/profile/example.bsky.social" },
      { text: "テキストのみのカード", emoji: "📝" },
    ],
    selected: [0],
    onChange: () => {},
  },
  render: function Render(args) {
    const [selected, setSelected] = useState(args.selected);
    return (
      <SelectCardList {...args} selected={selected} onChange={setSelected} />
    );
  },
} satisfies Meta<typeof SelectCardList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const links = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    url: `https://example.com/${i + 1}`,
    text: `リンク${i + 1}`,
  }));

export const Full: Story = {
  args: {
    cards: links(11),
    selected: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
};

export const WithInvalidCards: Story = {
  args: {
    cards: [
      { text: "URLの無いカード", emoji: "📝" },
      ...links(2),
      { url: "https://example.com", text: "あ".repeat(41) },
    ],
    selected: [1, 2],
  },
};

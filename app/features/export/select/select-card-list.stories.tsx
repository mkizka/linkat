import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SelectCardList } from "./select-card-list";

const meta = {
  component: SelectCardList,
  args: {
    maxLinks: 10,
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

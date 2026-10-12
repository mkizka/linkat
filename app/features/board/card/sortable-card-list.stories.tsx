import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { CardFormProvider } from "~/features/board/form/card-form-provider";

import { SortableCardList } from "./sortable-card-list";

const cards = [
  { id: "1", url: "https://example.com", text: "Example" },
  { id: "2", url: "https://bsky.app/profile/example.bsky.social" },
  { id: "3", text: "テキストのみのカード", emoji: "📝" },
];

const meta = {
  component: SortableCardList,
  decorators: [
    (Story) => (
      <CardFormProvider onSubmit={fn()}>
        <Story />
      </CardFormProvider>
    ),
  ],
  args: { cards },
} satisfies Meta<typeof SortableCardList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sortable: Story = {
  render: function Render(args) {
    const [cards, setCards] = useState(args.cards);
    return <SortableCardList cards={cards} onChange={setCards} />;
  },
};

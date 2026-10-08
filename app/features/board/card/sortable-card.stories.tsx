import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CardFormProvider } from "~/features/board/form/card-form-provider";

import { SortableCard } from "./sortable-card";

const meta = {
  component: SortableCard,
  decorators: [
    (Story) => (
      <CardFormProvider onSubmit={fn()} onDelete={fn()}>
        <Story />
      </CardFormProvider>
    ),
  ],
  args: {
    card: { id: "1", url: "https://example.com", text: "Example" },
  },
} satisfies Meta<typeof SortableCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Link: Story = {};

export const Text: Story = {
  args: { card: { id: "1", text: "テキストのみのカード", emoji: "📝" } },
};

export const BlueskyProfile: Story = {
  args: {
    card: { id: "1", url: "https://bsky.app/profile/example.bsky.social" },
  },
};

export const BlueskyFeed: Story = {
  args: {
    card: {
      id: "1",
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/feed/whats-hot",
    },
  },
};

export const BlueskyPost: Story = {
  args: {
    card: {
      id: "1",
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l",
    },
  },
};

export const Sortable: Story = {
  args: { sortable: true },
};

export const Dragging: Story = {
  args: { sortable: true, isDragging: true },
};

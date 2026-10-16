import type { Meta, StoryObj } from "@storybook/react-vite";

import { SelectCard } from "./select-card";

const meta = {
  component: SelectCard,
  args: {
    card: { url: "https://example.com", text: "Example" },
    isSelected: false,
    onToggle: () => {},
  },
} satisfies Meta<typeof SelectCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { isSelected: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Text: Story = {
  args: { card: { text: "テキストのみのカード", emoji: "📝" } },
};

export const Http: Story = {
  args: { card: { url: "http://example.com", text: "httpのカード" } },
};

export const BlueskyPost: Story = {
  args: {
    card: {
      url: "https://bsky.app/profile/did:plc:z72i7hdynmk6r22z27h6tvur/post/3l6oveex3ii2l",
    },
    isSelected: true,
  },
};

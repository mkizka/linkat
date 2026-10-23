import type { Meta, StoryObj } from "@storybook/react-vite";

import { EditorMenu } from "./editor-menu";

const meta = {
  component: EditorMenu,
  args: {
    handle: "me.bsky.social",
    hasBoard: true,
    experimental: false,
  },
} satisfies Meta<typeof EditorMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutBoard: Story = {
  args: { hasBoard: false },
};

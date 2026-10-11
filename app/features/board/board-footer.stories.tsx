import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardFooter } from "./board-footer";

const meta = {
  component: BoardFooter,
  args: { showCreateLink: false },
} satisfies Meta<typeof BoardFooter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCreateLink: Story = {
  args: { showCreateLink: true },
};

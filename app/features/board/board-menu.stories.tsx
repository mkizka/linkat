import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { BoardMenu } from "./board-menu";

const meta = {
  component: BoardMenu,
  args: { isLogin: false, onShare: fn(), onModerate: null },
} satisfies Meta<typeof BoardMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoggedIn: Story = {
  args: { isLogin: true },
};

export const Admin: Story = {
  args: { isLogin: true, onModerate: fn() },
};

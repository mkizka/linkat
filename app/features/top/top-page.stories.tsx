import type { Meta, StoryObj } from "@storybook/react-vite";

import { TopPage } from "./top-page";

const meta = {
  component: TopPage,
  parameters: { layout: "fullscreen" },
  args: { isLogin: false },
} satisfies Meta<typeof TopPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Login: Story = {
  args: { isLogin: true },
};

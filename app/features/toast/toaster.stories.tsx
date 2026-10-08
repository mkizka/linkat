import type { Meta, StoryObj } from "@storybook/react-vite";

import { Toaster } from "./toaster";

const meta = {
  component: Toaster,
  args: { toast: { type: "success", message: "保存しました" } },
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Error: Story = {
  args: { toast: { type: "error", message: "エラーが発生しました" } },
};

export const Info: Story = {
  args: { toast: { type: "info", message: "お知らせ" } },
};

export const Warning: Story = {
  args: { toast: { type: "warning", message: "注意してください" } },
};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorPage } from ".";

const meta = {
  component: ErrorPage,
} satisfies Meta<typeof ErrorPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: { title: "404", text: "ページが見つかりませんでした" },
};

export const Error: Story = {
  args: { title: "Error", text: "エラーが発生しました" },
};

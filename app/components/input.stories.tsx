import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta = {
  component: Input,
  args: {
    label: "URL",
    placeholder: "https://example.com",
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithErrors: Story = {
  args: { errors: ["URLの形式が正しくありません"] },
};

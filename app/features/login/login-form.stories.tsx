import type { Meta, StoryObj } from "@storybook/react-vite";

import { LoginForm } from "./login-form";

const meta = {
  component: LoginForm,
} satisfies Meta<typeof LoginForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

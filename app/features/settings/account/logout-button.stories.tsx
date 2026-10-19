import type { Meta, StoryObj } from "@storybook/react-vite";

import { LogoutButton } from "./logout-button";

const meta = {
  component: LogoutButton,
} satisfies Meta<typeof LogoutButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

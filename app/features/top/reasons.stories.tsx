import type { Meta, StoryObj } from "@storybook/react-vite";

import { Reasons } from "./reasons";

const meta = {
  component: Reasons,
} satisfies Meta<typeof Reasons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

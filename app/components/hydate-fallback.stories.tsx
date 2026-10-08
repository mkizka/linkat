import type { Meta, StoryObj } from "@storybook/react-vite";

import { HydrateFallback } from "./hydate-fallback";

const meta = {
  component: HydrateFallback,
} satisfies Meta<typeof HydrateFallback>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

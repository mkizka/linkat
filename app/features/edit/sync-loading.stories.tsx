import type { Meta, StoryObj } from "@storybook/react-vite";

import { SyncLoading } from "./sync-loading";

const meta = {
  component: SyncLoading,
} satisfies Meta<typeof SyncLoading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

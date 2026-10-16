import type { Meta, StoryObj } from "@storybook/react-vite";

import { SyncButton } from "./sync-button";

const meta = {
  component: SyncButton,
} satisfies Meta<typeof SyncButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

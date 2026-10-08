import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SyncError } from "./sync-error";

const meta = {
  component: SyncError,
  args: { onRetry: fn() },
} satisfies Meta<typeof SyncError>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

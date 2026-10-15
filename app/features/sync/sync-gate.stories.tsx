import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { SyncGate } from "./sync-gate";

const meta = {
  component: SyncGate,
  parameters: { layout: "fullscreen" },
  args: {
    state: "loading",
    onRetry: fn(),
    children: <p>同期済みのページ</p>,
  },
} satisfies Meta<typeof SyncGate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loading: Story = {};

export const Failure: Story = {
  args: { state: "error" },
};

export const Ready: Story = {
  args: { state: "ready" },
};

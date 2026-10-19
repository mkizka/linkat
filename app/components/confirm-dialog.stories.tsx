import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { ConfirmDialog } from "./confirm-dialog";

const meta = {
  component: ConfirmDialog,
  args: {
    open: true,
    title: "保存していない変更があります",
    description: "このまま戻ると変更は失われます。",
    cancelLabel: "編集を続ける",
    confirmLabel: "破棄して戻る",
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

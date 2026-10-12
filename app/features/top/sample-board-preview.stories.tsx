import type { Meta, StoryObj } from "@storybook/react-vite";

import { SampleBoardPreview } from "./sample-board-preview";

const meta = {
  component: SampleBoardPreview,
  args: {
    url: "https://linkat.blue/sample",
  },
} satisfies Meta<typeof SampleBoardPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

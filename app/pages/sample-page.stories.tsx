import type { Meta, StoryObj } from "@storybook/react-vite";

import { SamplePage } from "./sample-page";

const meta = {
  component: SamplePage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SamplePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

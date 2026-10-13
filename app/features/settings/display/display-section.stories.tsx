import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplaySection } from "./display-section";

const meta = {
  component: DisplaySection,
} satisfies Meta<typeof DisplaySection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

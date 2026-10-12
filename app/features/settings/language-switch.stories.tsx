import type { Meta, StoryObj } from "@storybook/react-vite";

import { LanguageSwitch } from "./language-switch";

const meta = {
  component: LanguageSwitch,
} satisfies Meta<typeof LanguageSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

import type { Meta, StoryObj } from "@storybook/react-vite";

import { BoardSection } from "./board-section";

const meta = {
  component: BoardSection,
  args: { handle: "example.bsky.social" },
} satisfies Meta<typeof BoardSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

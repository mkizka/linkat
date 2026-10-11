import type { Meta, StoryObj } from "@storybook/react-vite";

import { DeleteBoardButton } from "./delete-button";

const meta = {
  component: DeleteBoardButton,
  args: { handle: "example.bsky.social" },
} satisfies Meta<typeof DeleteBoardButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

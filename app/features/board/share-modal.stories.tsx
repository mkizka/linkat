import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShareModal } from "./share-modal";

const meta = {
  component: ShareModal,
  args: { url: "https://linkat.blue/example.bsky.social" },
  parameters: { path: "/?success" },
} satisfies Meta<typeof ShareModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

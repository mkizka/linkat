import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShareModal } from "./share-modal";

const meta = {
  component: ShareModal,
  args: {
    ref: (el: HTMLDialogElement | null) => el?.showModal(),
    url: "https://linkat.blue/example.bsky.social",
    title: "ボードを共有",
    shareText:
      "Exampleさんのボード #linkat https://linkat.blue/example.bsky.social",
  },
} satisfies Meta<typeof ShareModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

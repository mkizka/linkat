import type { Meta, StoryObj } from "@storybook/react-vite";

import { AboutArticle } from "./about-article";

const meta = {
  component: AboutArticle,
  args: {
    title: "Linkatについて",
    content: "<p>Linkatはリンク集を作れるサービスです。</p>",
  },
} satisfies Meta<typeof AboutArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

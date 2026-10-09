import type { Meta, StoryObj } from "@storybook/react-vite";

import { AboutPage } from "./about-page";

const meta = {
  component: AboutPage,
  parameters: { layout: "fullscreen" },
  args: {
    about: {
      title: "Linkatについて",
      content: "<p>Linkatはリンク集を作れるサービスです。</p>",
    },
  },
} satisfies Meta<typeof AboutPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

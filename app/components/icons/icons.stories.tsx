import type { Meta, StoryObj } from "@storybook/react-vite";

import { BlueskyIcon } from "./bluesky";
import { GitHubIcon } from "./github";
import { TwitterIcon } from "./twitter";

const meta = {
  title: "components/icons",
  component: BlueskyIcon,
} satisfies Meta<typeof BlueskyIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bluesky: Story = {};

export const GitHub: Story = {
  render: (args) => <GitHubIcon {...args} />,
};

export const Twitter: Story = {
  render: (args) => <TwitterIcon {...args} />,
};

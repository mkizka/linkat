import type { Meta, StoryObj } from "@storybook/react-vite";

import { Footer, Header, Main, RootLayout } from "./layout";

const meta = {
  component: RootLayout,
  args: {
    children: <Main className="py-20">コンテンツ</Main>,
  },
} satisfies Meta<typeof RootLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Login: Story = {
  args: { isLogin: true },
};

export const HeaderOnly: Story = {
  render: () => <Header isLogin />,
};

export const FooterWithNavigation: Story = {
  render: () => <Footer withNavigation />,
};

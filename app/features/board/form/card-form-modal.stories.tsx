import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CardFormModal } from "./card-form-modal";
import { CardFormProvider } from "./card-form-provider";

const meta = {
  component: CardFormModal,
  args: { onDelete: fn() },
  decorators: [
    (Story) => (
      <CardFormProvider onSubmit={fn()}>
        <Story />
      </CardFormProvider>
    ),
  ],
} satisfies Meta<typeof CardFormModal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

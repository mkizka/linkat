import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { CardFormProvider } from "~/features/board/form/card-form-provider";

import { SortableCard } from "./sortable-card";

const meta = {
  component: SortableCard,
  decorators: [
    (Story) => (
      <CardFormProvider onSubmit={fn()}>
        <Story />
      </CardFormProvider>
    ),
  ],
  args: {
    card: { id: "1", url: "https://example.com", text: "Example" },
  },
} satisfies Meta<typeof SortableCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dragging: Story = {
  args: { isDragging: true },
};

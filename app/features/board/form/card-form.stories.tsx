import { useFormMetadata } from "@conform-to/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect } from "react";
import { fn } from "storybook/test";

import { CardForm } from "./card-form";
import type { CardFormPayload } from "./card-form-provider";
import { CardFormProvider } from "./card-form-provider";

const meta = {
  component: CardForm,
  decorators: [
    (Story) => (
      <CardFormProvider onSubmit={fn()} onDelete={fn()}>
        <Story />
      </CardFormProvider>
    ),
  ],
} satisfies Meta<typeof CardForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Create: Story = {};

function EditingCardForm() {
  const form = useFormMetadata<CardFormPayload>();
  useEffect(() => {
    form.update({ name: "id", value: "1" });
    form.update({ name: "url", value: "https://example.com" });
    form.update({ name: "text", value: "Example" });
    form.update({ name: "emoji", value: "🔗" });
    // eslint-disable-next-line @eslint-react/exhaustive-deps
  }, []);
  return <CardForm />;
}

export const Edit: Story = {
  render: () => <EditingCardForm />,
};

import { FormProvider, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { z } from "zod";

import { cardModal } from "./card-form-modal";

const schema = z
  .object({
    text: z.string().optional(),
    url: z.string().url().optional(),
    id: z.string().optional(),
  })
  .refine((value) => value.text || value.url, {
    message: "どちらかは入力してください",
  });

export type CardFormPayload = z.infer<typeof schema>;

type CardFormProps = {
  onSubmit: (payload: CardFormPayload) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
};

export function CardFormProvider({
  onSubmit,
  onDelete,
  children,
}: CardFormProps) {
  const [form] = useForm({
    id: "card-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: (event, { submission, formData }) => {
      event.preventDefault();
      const payload = submission?.payload as CardFormPayload;
      if (formData.get("action") === "delete") {
        if (payload.id) onDelete(payload.id);
      } else {
        onSubmit(payload);
      }
      cardModal.close();
    },
  });
  return <FormProvider context={form.context}>{children}</FormProvider>;
}

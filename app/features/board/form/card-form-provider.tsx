import { FormProvider, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { z } from "zod";

const schema = z
  .object({
    text: z.string().optional(),
    url: z.string().url().optional(),
  })
  .refine((value) => value.text || value.url, {
    message: "どちらかは入力してください",
  });

export type CardFormSchema = z.infer<typeof schema>;

type CardFormProps = {
  onSubmit: (payload: CardFormSchema) => void;
  children: React.ReactNode;
};

export function CardFormProvider({ onSubmit, children }: CardFormProps) {
  const [form] = useForm({
    id: "add-card-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: (event, { submission }) => {
      // prepare
      event.preventDefault();

      // submit
      const payload = submission?.payload as CardFormSchema;
      onSubmit(payload);

      // cleanup
      (event.target as HTMLFormElement).reset();
    },
  });
  return <FormProvider context={form.context}>{children}</FormProvider>;
}

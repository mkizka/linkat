import { FormProvider, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const _schema = z.object({
  text: z.string().optional(),
  url: z.string().url().optional(),
  id: z.string().optional(),
});

export type CardFormPayload = z.infer<typeof _schema>;

type CardFormProps = {
  onSubmit: (payload: CardFormPayload) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  children: React.ReactNode;
};

export function CardFormProvider({
  onSubmit,
  onDelete,
  children,
}: CardFormProps) {
  const { t } = useTranslation();
  const schema = _schema.refine((value) => value.text || value.url, {
    message: t("card-form-provider.input-required-error-message"),
  });
  const [form] = useForm({
    id: "card-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event, { submission, formData }) => {
      event.preventDefault();
      const payload = submission?.payload as CardFormPayload;
      if (formData.get("action") === "delete") {
        if (payload.id) await onDelete(payload.id);
      } else {
        await onSubmit(payload);
      }
    },
  });
  return <FormProvider context={form.context}>{children}</FormProvider>;
}

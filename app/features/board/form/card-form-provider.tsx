import { FormProvider, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { cardSchema } from "~/models/board";

const schema = cardSchema.safeExtend({
  id: z.string().optional(),
});

export type CardFormPayload = z.infer<typeof schema>;

type CardFormProps = {
  onSubmit: (payload: CardFormPayload) => Promise<void> | void;
  children: React.ReactNode;
};

export function CardFormProvider({ onSubmit, children }: CardFormProps) {
  const { t } = useTranslation();
  const [form] = useForm({
    id: "card-form",
    constraint: getZodConstraint(schema),
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema,
        error: (issue) =>
          issue.code === "custom" &&
          issue.params?.code === "url-or-text-required"
            ? t("card-form-provider.input-required-error-message")
            : undefined,
      });
    },
    onSubmit: async (event, { submission }) => {
      event.preventDefault();
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const payload = submission?.payload as CardFormPayload;
      await onSubmit(payload);
    },
  });
  return <FormProvider context={form.context}>{children}</FormProvider>;
}

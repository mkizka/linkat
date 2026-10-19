import { useTranslation } from "react-i18next";
import { Form } from "react-router";

import { cn } from "~/utils/cn";

const languages = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "English" },
];

export function LanguageSwitch() {
  const { i18n } = useTranslation();
  return (
    <Form className="join">
      {languages.map(({ value, label }) => (
        <button
          key={value}
          type="submit"
          name="lng"
          value={value}
          className={cn(
            "btn join-item btn-sm",
            i18n.language === value && "btn-primary",
          )}
          aria-pressed={i18n.language === value}
          data-umami-event="click-settings-lang"
          data-umami-event-action={`select-${value}`}
        >
          {label}
        </button>
      ))}
    </Form>
  );
}

import { CheckIcon, NoSymbolIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

import { Card } from "~/components/card";
import { type BoardCard, isExportableCard } from "~/models/board";
import { cn } from "~/utils/cn";

import { CardContent } from "./card-content";
import { parseCard } from "./parser";

type Props = {
  card: BoardCard;
  isSelected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function SelectCard({ card, isSelected, disabled, onToggle }: Props) {
  const { t } = useTranslation();
  const parsed = parseCard(card);

  if (!isExportableCard(card)) {
    return (
      <div className="card border-[1.5px] border-dashed border-base-content/20">
        <div className="card-body flex-row items-center gap-2 px-4 py-4">
          <div className="min-w-0 flex-1 opacity-50">
            <CardContent parsed={parsed} />
          </div>
          <span className="badge shrink-0 gap-1 badge-sm font-bold">
            <NoSymbolIcon className="size-3" />
            {card.url ? t("export.not-https-badge") : t("export.no-url-badge")}
          </span>
        </div>
      </div>
    );
  }

  const check = (
    <span
      className={cn(
        "grid size-6 shrink-0 place-items-center rounded-full",
        isSelected
          ? "bg-primary text-primary-content"
          : "border-[1.5px] border-base-content/30 bg-base-100",
      )}
    >
      {isSelected && <CheckIcon className="size-4" strokeWidth={3} />}
    </span>
  );

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "w-full rounded-box text-left disabled:cursor-not-allowed disabled:opacity-50",
        isSelected && "ring-2 ring-primary",
      )}
      data-testid="select-card"
    >
      {parsed.type === "embed" ? (
        <div className="relative">
          <div className="pointer-events-none">
            <CardContent parsed={parsed} />
          </div>
          <div className="absolute top-3 right-3">{check}</div>
        </div>
      ) : (
        <Card>
          <div className="card-body flex-row items-center gap-2 px-4 py-4">
            <div className="pointer-events-none min-w-0 flex-1">
              <CardContent parsed={parsed} />
            </div>
            {check}
          </div>
        </Card>
      )}
    </button>
  );
}

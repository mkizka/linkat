import { LinkIcon } from "@heroicons/react/24/outline";

import { Card } from "~/components/card";
import type { ValidCard } from "~/models/card";

type Props = {
  card: ValidCard;
};

export const BoardCard = ({ card }: Props) => {
  const component = (
    <Card>
      <div className="card-body flex-row items-center gap-4">
        <LinkIcon className="size-8" />
        <p className="flex-1 truncate">{card.text || card.url}</p>
      </div>
    </Card>
  );
  if (card.url) {
    return (
      <a href={card.url} target="_blank" rel="noopener noreferrer">
        {component}
      </a>
    );
  }
  return component;
};

import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

import { Button } from "~/components/button";

import { Sortable } from "./sortable";

const sampleCards = [
  {
    id: "1",
    text: "1. URLあり",
    url: "https://example.com/1",
  },
  {
    id: "2",
    text: "2. URLなし",
  },
  {
    id: "3",
    text: "https://example.com/3",
    url: "https://example.com/3",
  },
];

export function BoardEditor() {
  const [cards, setCards] = useState(sampleCards);
  return (
    <div className="py-8">
      <Sortable cards={cards} setCards={setCards} />
      <Button className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow">
        <PencilSquareIcon className="size-8" />
        保存
      </Button>
    </div>
  );
}

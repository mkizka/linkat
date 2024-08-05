import { arrayMoveImmutable } from "array-move";
import { useState } from "react";
import SortableList, { SortableItem } from "react-easy-sort";
import { useHydrated } from "remix-utils/use-hydrated";

import { Card } from "~/components/card";

const containerClass = "grid grid-cols-1 gap-2 md:grid-cols-2";

export function Sortable() {
  const hydrated = useHydrated();
  const [items, setItems] = useState(Array.from({ length: 10 }, (_, i) => i));

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    setItems((array) => arrayMoveImmutable(array, oldIndex, newIndex));
  };

  if (!hydrated) {
    return (
      <div className={containerClass}>
        {items.map((item) => (
          <Card key={item}></Card>
        ))}
      </div>
    );
  }

  return (
    <SortableList onSortEnd={onSortEnd} className={containerClass}>
      {items.map((item) => (
        <SortableItem key={item}>
          <Card className="pointer-events-none select-none"></Card>
        </SortableItem>
      ))}
    </SortableList>
  );
}

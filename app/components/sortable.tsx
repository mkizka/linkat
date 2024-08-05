import { arrayMoveImmutable } from "array-move";
import { useState } from "react";
import SortableList, { SortableItem } from "react-easy-sort";

import { Card } from "~/components/card";

export function Sortable() {
  const [items, setItems] = useState(Array.from({ length: 10 }, (_, i) => i));

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    setItems((array) => arrayMoveImmutable(array, oldIndex, newIndex));
  };

  return (
    <SortableList
      onSortEnd={onSortEnd}
      className="grid grid-cols-1 gap-2 md:grid-cols-2"
    >
      {items.map((item) => (
        <SortableItem key={item}>
          <Card className="pointer-events-none select-none"></Card>
        </SortableItem>
      ))}
    </SortableList>
  );
}

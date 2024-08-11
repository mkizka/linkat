import { PencilSquareIcon } from "@heroicons/react/24/solid";

import { Button } from "./button";
import { Sortable } from "./sortable";

export function BoardEditor() {
  return (
    <div>
      <Sortable />
      <Button className="btn-circle btn-lg fixed bottom-4 right-4 w-32 shadow">
        <PencilSquareIcon className="size-8" />
        保存
      </Button>
    </div>
  );
}

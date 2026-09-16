import type { JetstreamCursorRepository } from "~/server/infrastructure/jetstreamCursorRepository";
import { jetstreamCursorRepository } from "~/server/infrastructure/jetstreamCursorRepository";

export const loadCursor = ({
  repository = jetstreamCursorRepository,
}: { repository?: JetstreamCursorRepository } = {}) => repository.load();

export const saveCursor = (
  cursor: number,
  {
    repository = jetstreamCursorRepository,
  }: { repository?: JetstreamCursorRepository } = {},
) => repository.save(cursor);

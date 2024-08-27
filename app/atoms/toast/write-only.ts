import { atom } from "jotai";

import type { Toast } from "./base";
import { toastsAtom } from "./base";

const MAX_TOAST_COUNT = 3;
const REMOVE_DELAY = 2000;

export const pushToastAtom = atom(
  null,
  (_, set, message: string, level: Toast["level"]) => {
    const newToast = { message, level, id: crypto.randomUUID() };
    set(toastsAtom, (prev) => [...prev, newToast].slice(-MAX_TOAST_COUNT));

    // 一定時間表示した後削除アニメーションを開始
    setTimeout(() => {
      set(toastsAtom, (prev) =>
        prev.map((item) =>
          item.id === newToast.id ? { ...item, removing: true } : item,
        ),
      );
    }, REMOVE_DELAY);

    // 削除アニメーションが終わったら削除
    setTimeout(() => {
      set(toastsAtom, (prev) => prev.filter((item) => item.id !== newToast.id));
    }, REMOVE_DELAY + 100);
  },
);

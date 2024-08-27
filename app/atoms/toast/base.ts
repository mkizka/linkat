import { atom } from "jotai";

export type Toast = {
  id: string;
  message: string;
  level: "success" | "error";
  removing?: boolean;
};

export const toastsAtom = atom<Toast[]>([]);

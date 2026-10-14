import { create } from "zustand";

// Remplace Recoil (incompatible avec React 19) : chaque "atome" est un petit store zustand
// et useAtomState / useAtomValue gardent la même forme que useRecoilState / useRecoilValue.
const createAtom = (initialValue) =>
  create((set) => ({
    value: initialValue,
    setValue: (next) =>
      set((state) => ({
        value: typeof next === "function" ? next(state.value) : next,
      })),
  }));

export const loadingState = createAtom(false);
export const sideMenuState = createAtom(false);

export const useAtomValue = (atom) => atom((state) => state.value);

export const useAtomState = (atom) => [
  atom((state) => state.value),
  atom((state) => state.setValue),
];

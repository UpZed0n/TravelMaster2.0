"use client";

import { create } from "zustand";

type Sel = {
  activePlanId: string | null;
  setActivePlanId: (id: string | null) => void;
};

export const useSelectionStore = create<Sel>((set) => ({
  activePlanId: null,
  setActivePlanId: (activePlanId) => set({ activePlanId }),
}));

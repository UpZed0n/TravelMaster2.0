"use client";

import { create } from "zustand";

export type AppLayer = "home" | "map" | "strategies" | "diary";

type NavState = {
  layer: AppLayer;
  /** When opening map from AI tool-calling */
  mapSearchQuery: string | null;
  /** When true, Home enters from top (returning from map/overlay) */
  homeEnterFromTop: boolean;
  setLayer: (l: AppLayer) => void;
  openMapWithQuery: (q: string) => void;
  clearMapQuery: () => void;
  clearHomeEnterFlag: () => void;
};

export const useNavigationStore = create<NavState>((set, get) => ({
  layer: "home",
  mapSearchQuery: null,
  homeEnterFromTop: false,
  setLayer: (layer) => {
    const prev = get().layer;
    const homeEnterFromTop =
      layer === "home" && (prev === "map" || prev === "strategies" || prev === "diary");
    set({ layer, homeEnterFromTop });
  },
  openMapWithQuery: (mapSearchQuery) =>
    set({ layer: "map", mapSearchQuery }),
  clearMapQuery: () => set({ mapSearchQuery: null }),
  clearHomeEnterFlag: () => set({ homeEnterFromTop: false }),
}));


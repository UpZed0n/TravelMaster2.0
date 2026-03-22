"use client";

import { create } from "zustand";

export type SettingsState = {
  apiKey: string;
  /** OpenAI-compatible base, e.g. https://dashscope.aliyuncs.com/compatible-mode/v1 */
  apiBaseUrl: string;
  model: string;
  amapKey: string;
  amapSecurityCode: string;
  setApiKey: (v: string) => void;
  setApiBaseUrl: (v: string) => void;
  setModel: (v: string) => void;
  setAmapKey: (v: string) => void;
  setAmapSecurityCode: (v: string) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  apiKey: "",
  apiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen-plus",
  amapKey: "",
  amapSecurityCode: "",
  setApiKey: (apiKey) => set({ apiKey }),
  setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
  setModel: (model) => set({ model }),
  setAmapKey: (amapKey) => set({ amapKey }),
  setAmapSecurityCode: (amapSecurityCode) => set({ amapSecurityCode }),
}));

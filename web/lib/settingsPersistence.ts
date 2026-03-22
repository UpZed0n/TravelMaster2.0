"use client";

import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { useSettingsStore } from "@/store/settings";

const LEGACY_KEY = "tour-talk-settings";
const WEB_BUNDLE_KEY = "tour-talk-settings-v2";

const SEC = {
  apiKey: "tour_secret_api_key",
  amapKey: "tour_secret_amap_key",
  amapSec: "tour_secret_amap_sec",
} as const;

const PREF = {
  apiBaseUrl: "tour_pref_api_base_url",
  model: "tour_pref_model",
} as const;

const DEFAULTS = {
  apiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  model: "qwen-plus",
};

async function getSecure(key: string): Promise<string> {
  try {
    const { value } = await SecureStoragePlugin.get({ key });
    return value ?? "";
  } catch {
    return "";
  }
}

async function setSecure(key: string, value: string) {
  if (!value) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      /* noop */
    }
    return;
  }
  await SecureStoragePlugin.set({ key, value });
}

function readWebBundle(): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  const next = localStorage.getItem(WEB_BUNDLE_KEY);
  if (next) {
    try {
      return JSON.parse(next) as Record<string, string>;
    } catch {
      return null;
    }
  }
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const parsed = JSON.parse(legacy) as { state?: Record<string, string> };
      const st = parsed.state;
      if (st) {
        localStorage.setItem(
          WEB_BUNDLE_KEY,
          JSON.stringify({
            apiKey: st.apiKey ?? "",
            apiBaseUrl: st.apiBaseUrl ?? DEFAULTS.apiBaseUrl,
            model: st.model ?? DEFAULTS.model,
            amapKey: st.amapKey ?? "",
            amapSecurityCode: st.amapSecurityCode ?? "",
          })
        );
        localStorage.removeItem(LEGACY_KEY);
        return JSON.parse(localStorage.getItem(WEB_BUNDLE_KEY)!) as Record<
          string,
          string
        >;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function writeWebBundle(s: {
  apiKey: string;
  apiBaseUrl: string;
  model: string;
  amapKey: string;
  amapSecurityCode: string;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(WEB_BUNDLE_KEY, JSON.stringify(s));
}

/** Load persisted settings into the Zustand store (call once on app start). */
export async function bootstrapSettings() {
  if (typeof window === "undefined") return;

  if (Capacitor.isNativePlatform()) {
    const [apiKey, amapKey, amapSec, baseRes, modelRes] = await Promise.all([
      getSecure(SEC.apiKey),
      getSecure(SEC.amapKey),
      getSecure(SEC.amapSec),
      Preferences.get({ key: PREF.apiBaseUrl }),
      Preferences.get({ key: PREF.model }),
    ]);
    useSettingsStore.setState({
      apiKey,
      amapKey,
      amapSecurityCode: amapSec,
      apiBaseUrl: baseRes.value || DEFAULTS.apiBaseUrl,
      model: modelRes.value || DEFAULTS.model,
    });
    return;
  }

  const bundle = readWebBundle();
  if (bundle) {
    useSettingsStore.setState({
      apiKey: bundle.apiKey ?? "",
      apiBaseUrl: bundle.apiBaseUrl ?? DEFAULTS.apiBaseUrl,
      model: bundle.model ?? DEFAULTS.model,
      amapKey: bundle.amapKey ?? "",
      amapSecurityCode: bundle.amapSecurityCode ?? "",
    });
  }
}

async function persistNativeSnapshot(s: ReturnType<typeof useSettingsStore.getState>) {
  await Promise.all([
    setSecure(SEC.apiKey, s.apiKey),
    setSecure(SEC.amapKey, s.amapKey),
    setSecure(SEC.amapSec, s.amapSecurityCode),
    Preferences.set({ key: PREF.apiBaseUrl, value: s.apiBaseUrl }),
    Preferences.set({ key: PREF.model, value: s.model }),
  ]);
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Subscribe to store changes and persist (debounced). Returns unsubscribe. */
export function subscribeSettingsPersistence() {
  return useSettingsStore.subscribe((state) => {
    if (typeof window === "undefined") return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      void (async () => {
        if (Capacitor.isNativePlatform()) {
          await persistNativeSnapshot(state);
        } else {
          writeWebBundle({
            apiKey: state.apiKey,
            apiBaseUrl: state.apiBaseUrl,
            model: state.model,
            amapKey: state.amapKey,
            amapSecurityCode: state.amapSecurityCode,
          });
        }
      })();
    }, 250);
  });
}

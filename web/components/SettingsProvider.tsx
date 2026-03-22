"use client";

import { useEffect } from "react";
import {
  bootstrapSettings,
  subscribeSettingsPersistence,
} from "@/lib/settingsPersistence";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      await bootstrapSettings();
      if (cancelled) return;
      unsub = subscribeSettingsPersistence();
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return <>{children}</>;
}

"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { useSettingsStore } from "@/store/settings";
import { cn } from "@/lib/utils";

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const model = useSettingsStore((s) => s.model);
  const amapKey = useSettingsStore((s) => s.amapKey);
  const amapSecurityCode = useSettingsStore((s) => s.amapSecurityCode);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const setModel = useSettingsStore((s) => s.setModel);
  const setAmapKey = useSettingsStore((s) => s.setAmapKey);
  const setAmapSecurityCode = useSettingsStore((s) => s.setAmapSecurityCode);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "rounded-full p-2",
          "shadow-[8px_8px_16px_rgba(0,0,0,0.06),-6px_-6px_14px_rgba(255,255,255,0.95)]"
        )}
        aria-label="设置"
      >
        <Settings className="h-5 w-5 text-slate-600" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/30 px-3 pb-8 pt-16">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">设置</h2>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto text-sm">
              <label className="block">
                <span className="text-slate-600">OpenAI 兼容 Base URL</span>
                <input
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">Model</span>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">API Key（仅存本地）</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">高德 Web Key</span>
                <input
                  value={amapKey}
                  onChange={(e) => setAmapKey(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </label>
              <label className="block">
                <span className="text-slate-600">高德安全密钥 (securityJsCode)</span>
                <input
                  type="password"
                  value={amapSecurityCode}
                  onChange={(e) => setAmapSecurityCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-teal-400"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-full bg-slate-800 py-2.5 text-sm font-medium text-white"
            >
              完成
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

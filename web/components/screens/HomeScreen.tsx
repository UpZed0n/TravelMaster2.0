"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronUp, Plus } from "lucide-react";
import { HomeChat } from "@/components/chat/HomeChat";
import { SettingsDialog } from "@/components/SettingsDialog";
import { cn } from "@/lib/utils";
import { db, type PlanRecord, type ScheduleEventRecord } from "@/lib/db";
import { dayColumnIndex, weekIsoDates } from "@/lib/calendar";
import { useSettingsStore } from "@/store/settings";
import { useSelectionStore } from "@/store/selection";

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const HOURS = [6, 9, 10, 12, 13];

function daysFromNow(iso: string) {
  const t = new Date(iso + "T12:00:00");
  const now = new Date();
  const diff = t.getTime() - now.setHours(0, 0, 0, 0);
  return Math.ceil(diff / 86400000);
}

export function HomeScreen({
  onOpenMap,
  onOpenStrategies,
  onOpenDiary,
}: {
  onOpenMap: () => void;
  onOpenStrategies: () => void;
  onOpenDiary: () => void;
}) {
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const apiKeyVal = useSettingsStore((s) => s.apiKey);
  const activePlanId = useSelectionStore((s) => s.activePlanId);
  const setActivePlanId = useSelectionStore((s) => s.setActivePlanId);

  const [plans, setPlans] = useState<PlanRecord[]>([]);
  const [events, setEvents] = useState<ScheduleEventRecord[]>([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("云南之旅");
  const [newLoc, setNewLoc] = useState("大理");
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));

  const refresh = useCallback(async () => {
    const p = await db.plans.toArray();
    setPlans(p);
    if (!activePlanId && p[0]) setActivePlanId(p[0].id);
    const ev = await db.scheduleEvents.toArray();
    setEvents(ev);
  }, [activePlanId, setActivePlanId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activePlan = useMemo(
    () => plans.find((p) => p.id === activePlanId) ?? plans[0],
    [plans, activePlanId]
  );

  const weekDates = useMemo(
    () => (activePlan ? weekIsoDates(activePlan.targetDate) : []),
    [activePlan]
  );

  const weekEvents = useMemo(() => {
    if (!activePlan) return [];
    return events.filter((e) => e.planId === activePlan.id);
  }, [events, activePlan]);

  const addPlan = async () => {
    const id = crypto.randomUUID();
    await db.plans.add({
      id,
      title: newTitle || "新计划",
      location: newLoc || "目的地",
      targetDate: newDate,
      tasks: [],
    });
    await db.scheduleEvents.add({
      id: crypto.randomUUID(),
      planId: id,
      day: newDate,
      startMinutes: 9 * 60,
      endMinutes: 12 * 60,
      title: "示例行程",
      categoryColor: "#14b8a6",
    });
    setActivePlanId(id);
    setPlanOpen(false);
    await refresh();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold italic tracking-tight text-slate-900">Tour Talk</h1>
        <SettingsDialog />
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-hidden">
        <section
          className={cn(
            "flex min-h-[140px] flex-col overflow-hidden rounded-[24px] p-3",
            "bg-white/70 shadow-[8px_8px_18px_rgba(0,0,0,0.07),-6px_-6px_16px_rgba(255,255,255,0.95)]"
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Tour Plan</h2>
            <button
              type="button"
              onClick={() => setPlanOpen(true)}
              className="rounded-full bg-teal-500/15 p-1.5 text-teal-700"
              aria-label="新建计划"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {plans.map((p) => {
              const d = daysFromNow(p.targetDate);
              const active = p.id === activePlan?.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePlanId(p.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-full px-4 py-2.5 text-left text-sm",
                    active
                      ? "bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-md"
                      : "bg-white/90 text-slate-700 shadow-inner"
                  )}
                >
                  <span className="truncate font-medium">{p.title || "xxx旅游"}</span>
                  <span className={cn("shrink-0 text-xs", active ? "text-white/90" : "text-teal-600")}>
                    {d >= 0 ? `还有 ${d} 天` : `已过去 ${-d} 天`}
                  </span>
                </button>
              );
            })}
            {!plans.length && (
              <p className="text-center text-xs text-slate-400">暂无计划，点击 + 创建</p>
            )}
          </div>
        </section>

        <section
          className={cn(
            "flex min-h-[160px] flex-col overflow-hidden rounded-[24px] p-3",
            "bg-white/70 shadow-[8px_8px_18px_rgba(0,0,0,0.07),-6px_-6px_16px_rgba(255,255,255,0.95)]"
          )}
        >
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Calendar</h2>
          <div className="min-h-0 flex-1 overflow-x-auto">
            <div className="grid min-w-[280px] grid-cols-[48px_repeat(7,minmax(0,1fr))] gap-px text-[10px]">
              <div />
              {WEEK.map((d) => (
                <div key={d} className="text-center font-medium text-slate-500">
                  {d}
                </div>
              ))}
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="flex items-start justify-end pr-1 pt-1 text-slate-400">
                    {String(h).padStart(2, "0")}:00
                  </div>
                  {WEEK.map((_, di) => {
                    const ev = weekEvents.find((e) => {
                      const col = dayColumnIndex(weekDates, e.day);
                      const startH = Math.floor(e.startMinutes / 60);
                      return col === di && startH === h;
                    });
                    return (
                      <div
                        key={`${h}-${di}`}
                        className="min-h-[28px] rounded-md border border-white/30 bg-slate-50/80"
                      >
                        {ev ? (
                          <div
                            className="h-full rounded-md px-0.5 py-0.5 text-[9px] leading-tight text-white"
                            style={{ backgroundColor: ev.categoryColor || "#14b8a6" }}
                          >
                            {ev.title}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onOpenDiary}
          className={cn(
            "rounded-full py-3 text-sm font-medium text-slate-700",
            "shadow-[inset_4px_4px_10px_rgba(0,0,0,0.08),inset_-4px_-4px_10px_rgba(255,255,255,0.95)]"
          )}
        >
          旅行日记
        </button>
        <button
          type="button"
          onClick={onOpenStrategies}
          className={cn(
            "rounded-full py-3 text-sm font-medium text-slate-700",
            "shadow-[8px_8px_16px_rgba(0,0,0,0.06),-8px_-8px_16px_rgba(255,255,255,0.95)]"
          )}
        >
          攻略记录
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-xs shadow-inner">
        <span className="shrink-0 text-slate-500">API Key</span>
        <input
          type="password"
          value={apiKeyVal}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none"
        />
      </label>

      <div className="mt-3 min-h-0 shrink-0">
        <HomeChat />
      </div>

      <button
        type="button"
        onClick={onOpenMap}
        className="mt-2 flex flex-col items-center gap-1 pb-1 text-xs text-slate-500"
      >
        <ChevronUp className="h-6 w-6 animate-bounce text-teal-500" />
        <span>上滑进入地图</span>
      </button>

      {planOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="mb-2 font-semibold">新建旅行计划</h3>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="标题"
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={newLoc}
              onChange={(e) => setNewLoc(e.target.value)}
              placeholder="地点"
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPlanOpen(false)}
                className="flex-1 rounded-full border py-2 text-sm"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void addPlan()}
                className="flex-1 rounded-full bg-slate-800 py-2 text-sm text-white"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

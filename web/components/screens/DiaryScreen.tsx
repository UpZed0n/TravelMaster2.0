"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Plus, Sparkles, Trash2 } from "lucide-react";
import { streamChatCompletion, type ChatMessage } from "@/lib/ai/streamOpenAI";
import { copyText } from "@/lib/clipboard";
import { db, type DiaryRecord, type ScheduleEventRecord } from "@/lib/db";
import { useSettingsStore } from "@/store/settings";
import { useSelectionStore } from "@/store/selection";
import { cn } from "@/lib/utils";

function diaryLabel(d: DiaryRecord): string {
  const date = new Date(d.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const line = d.content.trim().split(/\r?\n/)[0]?.slice(0, 22) ?? "";
  return line ? `${date} · ${line}` : `${date} · 空白`;
}

export function DiaryScreen({ onBack }: { onBack: () => void }) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const model = useSettingsStore((s) => s.model);
  const activePlanId = useSelectionStore((s) => s.activePlanId);

  const [diaries, setDiaries] = useState<DiaryRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [aiOut, setAiOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [copyHint, setCopyHint] = useState("");
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = activeId;

  const planId = activePlanId ?? "";

  const activeDiary = useMemo(
    () => diaries.find((d) => d.id === activeId) ?? null,
    [diaries, activeId]
  );

  const reload = useCallback(async () => {
    if (!planId) {
      setDiaries([]);
      setActiveId(null);
      setContent("");
      return;
    }
    let list = await db.diaries.where("planId").equals(planId).toArray();
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    if (list.length === 0) {
      const id = crypto.randomUUID();
      const rec: DiaryRecord = {
        id,
        planId,
        content: "",
        updatedAt: Date.now(),
      };
      await db.diaries.add(rec);
      list = [rec];
    }
    setDiaries(list);
    const prev = activeIdRef.current;
    const nextId =
      prev && list.some((d) => d.id === prev) ? prev : list[0].id;
    setActiveId(nextId);
    setContent(list.find((d) => d.id === nextId)?.content ?? "");
  }, [planId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persistContent = useCallback(
    async (diaryId: string, text: string) => {
      await db.diaries.update(diaryId, {
        content: text,
        updatedAt: Date.now(),
      });
      setDiaries((rows) =>
        rows
          .map((r) =>
            r.id === diaryId
              ? { ...r, content: text, updatedAt: Date.now() }
              : r
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    },
    []
  );

  const save = async () => {
    if (!activeId) return;
    await persistContent(activeId, content);
  };

  const switchTo = async (id: string) => {
    if (id === activeId) return;
    if (activeId) await persistContent(activeId, content);
    const d = diaries.find((x) => x.id === id);
    setActiveId(id);
    setContent(d?.content ?? "");
  };

  const addDiary = async () => {
    if (!planId) return;
    if (activeId) await persistContent(activeId, content);
    const id = crypto.randomUUID();
    const rec: DiaryRecord = {
      id,
      planId,
      content: "",
      updatedAt: Date.now(),
    };
    await db.diaries.add(rec);
    await reload();
    setActiveId(id);
    setContent("");
  };

  const removeDiary = async (id: string) => {
    if (!planId) return;
    const ok = typeof window !== "undefined" ? window.confirm("删除这篇日记？") : true;
    if (!ok) return;
    await db.diaries.delete(id);
    const remaining = await db.diaries.where("planId").equals(planId).toArray();
    if (remaining.length === 0) {
      await db.diaries.add({
        id: crypto.randomUUID(),
        planId,
        content: "",
        updatedAt: Date.now(),
      });
    }
    await reload();
  };

  const aiAssist = async () => {
    if (!apiKey || !planId || !activeId) return;
    setBusy(true);
    setAiOut("");
    const plan = await db.plans.get(planId);
    const evs: ScheduleEventRecord[] = plan
      ? await db.scheduleEvents
          .where("planId")
          .equals(planId)
          .filter((e) => e.day === plan.targetDate)
          .toArray()
      : [];
    const schedText = evs
      .map((e) => `${e.title} ${e.startMinutes}-${e.endMinutes}`)
      .join("；");

    const prompt = `你是一名旅行日记作家。地点：${plan?.location ?? ""}；日期：${plan?.targetDate ?? ""}；日程：${schedText}。请根据用户要求写一段有生活感的日记。用户说明：${content.slice(0, 800)}`;

    const messages: ChatMessage[] = [
      { role: "system", content: "请用中文写作，语气自然。" },
      { role: "user", content: prompt },
    ];

    let acc = "";
    try {
      for await (const delta of streamChatCompletion({
        baseUrl: apiBaseUrl,
        apiKey,
        model,
        messages,
      })) {
        acc += delta;
        setAiOut(acc);
      }
    } catch (e) {
      setAiOut(`请求失败：${String((e as Error).message)}`);
    }
    setBusy(false);
  };

  const handleCopyAi = async () => {
    if (!aiOut) return;
    const ok = await copyText(aiOut);
    setCopyHint(ok ? "已复制" : "复制失败");
    setTimeout(() => setCopyHint(""), 2000);
  };

  const handleInsertAi = () => {
    if (!aiOut) return;
    const next = content ? `${content.trimEnd()}\n\n${aiOut}` : aiOut;
    setContent(next);
  };

  const noPlan = !planId;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#e8eaef] px-3 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70 || info.velocity.y > 400) onBack();
        }}
        className="mb-2 flex items-center justify-between"
      >
        <div>
          <p className="text-[10px] text-slate-400">Swipe down to return</p>
          <h1 className="text-xl font-bold italic text-slate-900">Tour Diary</h1>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={noPlan || !activeDiary}
          className="rounded-full bg-white px-5 py-2 text-sm font-medium text-slate-800 shadow-md disabled:opacity-40"
        >
          Save
        </button>
      </motion.div>

      {noPlan ? (
        <p className="mb-2 rounded-2xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
          请先在首页创建并选择旅行计划。
        </p>
      ) : (
        <div className="mb-2 flex max-h-[100px] flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-600">日记列表</span>
            <button
              type="button"
              onClick={() => void addDiary()}
              className="flex items-center gap-1 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-800"
            >
              <Plus className="h-3.5 w-3.5" />
              新建
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
            {diaries.map((d) => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center gap-1 rounded-xl border px-2 py-1.5 text-left text-xs",
                  d.id === activeId
                    ? "border-teal-400 bg-teal-50/90"
                    : "border-transparent bg-white/70"
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-slate-800"
                  onClick={() => void switchTo(d.id)}
                >
                  {diaryLabel(d)}
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="删除日记"
                  onClick={() => void removeDiary(d.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1 rounded-[28px] bg-white/90 p-4 shadow-lg">
        <textarea
          value={noPlan ? "" : content}
          onChange={(e) => setContent(e.target.value)}
          disabled={noPlan}
          placeholder="今天的行程太棒了！AI帮写日记…"
          className="h-[min(220px,36vh)] w-full resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={busy || noPlan}
          onClick={() => void aiAssist()}
          className={cn(
            "absolute bottom-4 right-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white",
            "bg-gradient-to-r from-teal-400 to-cyan-500 shadow-[0_8px_24px_rgba(45,212,191,0.45)]",
            "disabled:opacity-50"
          )}
        >
          <span className="rounded bg-white/20 px-1 text-xs">AI</span>
          AI帮写
        </button>
      </div>

      {aiOut ? (
        <div className="relative mt-3 rounded-[24px] border border-white/60 bg-white/55 p-4 pr-10 text-sm leading-relaxed text-slate-700 shadow-md backdrop-blur-md">
          <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-white/60 bg-white/55" />
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => void handleCopyAi()}
              className="rounded-lg bg-white/80 p-1.5 text-slate-600 shadow-sm hover:text-teal-600"
              title="复制"
              aria-label="复制 AI 内容"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleInsertAi}
              disabled={noPlan}
              className="whitespace-nowrap rounded-lg bg-teal-500/15 px-2 py-1 text-[10px] font-medium text-teal-800 disabled:opacity-40"
            >
              插入正文
            </button>
          </div>
          {aiOut}
          <Sparkles className="absolute bottom-3 right-3 h-4 w-4 text-teal-400" />
          {copyHint ? (
            <span className="mt-2 block text-[10px] text-teal-600">{copyHint}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-slate-300/80" />
    </div>
  );
}

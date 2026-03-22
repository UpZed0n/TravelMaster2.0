"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { HomeChat } from "@/components/chat/HomeChat";
import { db, type StrategyRecord } from "@/lib/db";
import { reindexStrategy } from "@/lib/rag/indexStrategy";
import { cn } from "@/lib/utils";

export function StrategyScreen({ onBack }: { onBack: () => void }) {
  const [list, setList] = useState<StrategyRecord[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const refresh = useCallback(async () => {
    const rows = await db.strategies.orderBy("updatedAt").reverse().toArray();
    setList(rows);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setBody("");
    setEditorOpen(true);
  };

  const openEdit = (s: StrategyRecord) => {
    setEditingId(s.id);
    setTitle(s.title);
    setBody(s.content);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingId(null);
    setTitle("");
    setBody("");
  };

  const save = async () => {
    const t = title || "未命名攻略";
    const c = body;
    if (editingId) {
      await db.strategies.update(editingId, {
        title: t,
        content: c,
        updatedAt: Date.now(),
      });
      const rec: StrategyRecord = {
        id: editingId,
        title: t,
        content: c,
        updatedAt: Date.now(),
      };
      try {
        await reindexStrategy(rec);
      } catch {
        /* optional */
      }
    } else {
      const id = crypto.randomUUID();
      const rec: StrategyRecord = {
        id,
        title: t,
        content: c,
        updatedAt: Date.now(),
      };
      await db.strategies.add(rec);
      try {
        await reindexStrategy(rec);
      } catch {
        /* optional */
      }
    }
    closeEditor();
    await refresh();
  };

  const remove = async () => {
    if (!editingId) return;
    const ok =
      typeof window !== "undefined"
        ? window.confirm("删除这篇攻略？将同时移除本地向量索引。")
        : true;
    if (!ok) return;
    await db.strategyChunks.where("strategyId").equals(editingId).delete();
    await db.strategies.delete(editingId);
    closeEditor();
    await refresh();
  };

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(224,231,245,0.95), rgba(200,220,235,0.98))",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' /%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 100 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.y > 70 || info.velocity.y > 400) onBack();
        }}
        className="relative z-10 flex flex-col px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold italic text-slate-900">Tour Talk</h1>
          <span className="text-[10px] text-slate-500">Swipe down to return</span>
        </div>
        <div className="mb-2 flex justify-center">
          <ChevronDown className="h-5 w-5 text-slate-500" />
        </div>

        <div
          className={cn(
            "mb-3 min-h-[120px] flex-1 space-y-2 overflow-y-auto rounded-[28px] border border-white/50 p-3",
            "bg-white/40 shadow-xl backdrop-blur-xl"
          )}
        >
          {list.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => openEdit(s)}
              className="w-full rounded-2xl bg-white/80 px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm active:scale-[0.99]"
            >
              {s.title}
            </button>
          ))}
          {!list.length && (
            <p className="py-6 text-center text-xs text-slate-500">暂无攻略，点击右下角新建</p>
          )}
          <div className="mx-auto mt-2 h-2 w-24 rounded-full bg-slate-400/40" />
        </div>

        <div className="relative z-10 min-h-0 shrink-0 pb-24">
          <HomeChat />
        </div>
      </motion.div>

      <button
        type="button"
        onClick={openNew}
        className={cn(
          "absolute bottom-8 right-4 z-20 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-900",
          "bg-gradient-to-r from-teal-300 to-cyan-400 shadow-[0_8px_28px_rgba(45,212,191,0.5)]"
        )}
      >
        <Plus className="h-5 w-5" />
        New Strategy
      </button>

      {editorOpen ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/35 px-3 pb-10">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] border border-white/60 bg-white p-4 shadow-2xl">
            <h3 className="mb-2 font-semibold">
              {editingId ? "编辑攻略" : "新建攻略"}
            </h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="标题"
              className="mb-2 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Markdown 正文"
              className="mb-3 h-48 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="flex-1 rounded-full border py-2 text-sm"
              >
                取消
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={() => void remove()}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
                >
                  删除
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void save()}
                className="min-w-[120px] flex-1 rounded-full bg-slate-800 py-2 text-sm text-white"
              >
                保存并索引
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Copy, MapPin, Send, Sparkles } from "lucide-react";
import { streamChatCompletion, type ChatMessage } from "@/lib/ai/streamOpenAI";
import { tryParseNavigateMap, tryParseStrategyArchive } from "@/lib/ai/parseAssistant";
import { retrieveTopChunks } from "@/lib/rag/retrieve";
import { useSettingsStore } from "@/store/settings";
import { useNavigationStore } from "@/store/navigation";
import { db } from "@/lib/db";
import { reindexStrategy } from "@/lib/rag/indexStrategy";
import { copyText } from "@/lib/clipboard";

const SYSTEM = `你是 Tour Talk 旅行助手。优先使用用户本地攻略（若有上下文）。当用户想去某地或需要导航时，在回复末尾单独输出一行 JSON（不要加 Markdown 代码块）：
{"action":"navigate_map","query":"地点关键词"}
当用户需要保存攻略时，用如下 Markdown 代码块输出：
\`\`\`tour-strategy
title: 标题
content: |
  多行正文
\`\`\``;

type Msg = { role: "user" | "assistant"; content: string };

export function HomeChat() {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const model = useSettingsStore((s) => s.model);
  const openMapWithQuery = useNavigationStore((s) => s.openMapWithQuery);

  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "你好，我是 Qwen AI。告诉我你的目的地，或让我根据攻略帮你规划。需要地图时我会为你打开。",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [copyIdx, setCopyIdx] = useState<number | null>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    if (!apiKey) {
      setMsgs((m) => [...m, { role: "assistant", content: "请先在设置或首页填写 API Key。" }]);
      return;
    }
    setInput("");
    const nextThread: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs([...nextThread, { role: "assistant", content: "" }]);
    setBusy(true);

    let rag = "";
    try {
      const chunks = await retrieveTopChunks(text, 3);
      if (chunks.length) {
        rag = "\n\n[本地攻略片段]\n" + chunks.join("\n---\n");
      }
    } catch {
      /* RAG 可选 */
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM + rag },
      ...nextThread.map((x) => ({ role: x.role, content: x.content })),
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
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (e) {
      acc = `请求失败：${String((e as Error).message)}`;
      setMsgs((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
    }

    const nav = tryParseNavigateMap(acc);
    if (nav) openMapWithQuery(nav);

    const strat = tryParseStrategyArchive(acc);
    if (strat) {
      const id = crypto.randomUUID();
      await db.strategies.add({
        id,
        title: strat.title,
        content: strat.content,
        updatedAt: Date.now(),
      });
      try {
        await reindexStrategy({
          id,
          title: strat.title,
          content: strat.content,
          updatedAt: Date.now(),
        });
      } catch {
        /* 索引失败仍可保存正文 */
      }
    }

    setBusy(false);
  };

  const handleCopy = async (idx: number, text: string) => {
    const ok = await copyText(text);
    setCopyIdx(ok ? idx : null);
    setTimeout(() => setCopyIdx(null), 1500);
  };

  return (
    <div
      className={[
        "flex h-[300px] flex-col overflow-hidden rounded-[24px]",
        "bg-white/55 shadow-[inset_4px_4px_12px_rgba(0,0,0,0.06),inset_-4px_-4px_12px_rgba(255,255,255,0.85)]",
      ].join(" ")}
    >
      <div className="shrink-0 py-2 text-center text-xs font-medium tracking-wide text-slate-500">
        Qwen AI
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2 text-sm">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "relative ml-auto max-w-[88%] rounded-2xl rounded-br-sm bg-slate-200/90 pl-2 pr-8 py-2 text-slate-800"
                : "relative mr-auto max-w-[92%] rounded-2xl rounded-bl-sm bg-white/90 pl-2 pr-8 py-2 text-slate-700 shadow-sm"
            }
          >
            <span className="whitespace-pre-wrap break-words">{m.content}</span>
            {m.content ? (
              <button
                type="button"
                title="复制"
                aria-label="复制本条消息"
                onClick={() => void handleCopy(i, m.content)}
                className="absolute right-1 top-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            ) : null}
            {copyIdx === i ? (
              <span className="absolute bottom-0 right-1 text-[9px] text-teal-600">已复制</span>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-white/40 px-2 py-2">
        <MapPin className="h-4 w-4 shrink-0 text-teal-500" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), void send())}
          placeholder="输入消息…"
          className="min-w-0 flex-1 rounded-full bg-white/80 px-3 py-2 text-sm outline-none ring-1 ring-slate-200/80 focus:ring-teal-400"
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={busy}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 text-white shadow-md disabled:opacity-50"
          aria-label="发送"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-2 pb-2 text-[10px] text-slate-400">
        <Sparkles className="h-3 w-3" />
        <span>本地 RAG（保存攻略后生效）</span>
      </div>
    </div>
  );
}

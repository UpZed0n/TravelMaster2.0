"use client";

import { db, type StrategyRecord } from "@/lib/db";
import { chunkMarkdown, embedText } from "@/lib/rag/embed";

export async function reindexStrategy(strategy: StrategyRecord) {
  await db.strategyChunks.where("strategyId").equals(strategy.id).delete();
  const chunks = chunkMarkdown(strategy.content);
  let i = 0;
  for (const text of chunks) {
    const vector = await embedText(text);
    await db.strategyChunks.add({
      id: `${strategy.id}_c_${i++}`,
      strategyId: strategy.id,
      text,
      vector: Array.from(vector),
    });
  }
}

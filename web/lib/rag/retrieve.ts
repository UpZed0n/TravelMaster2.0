import { db } from "@/lib/db";
import { embedText, cosineSimilarity } from "@/lib/rag/embed";

export async function retrieveTopChunks(
  query: string,
  topK = 3
): Promise<string[]> {
  const chunks = await db.strategyChunks.toArray();
  if (!chunks.length) return [];

  const qVec = await embedText(query);
  const scored = chunks
    .map((c) => ({
      text: c.text,
      score: cosineSimilarity(qVec, new Float32Array(c.vector)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .filter((x) => x.score > 0.15);

  return scored.map((s) => s.text);
}

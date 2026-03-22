"use client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipePromise: Promise<any> | null = null;

export async function getEmbedder() {
  if (!pipePromise) {
    pipePromise = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");
      env.allowLocalModels = false;
      env.backends.onnx.wasm.numThreads = 1;
      return pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    })();
  }
  return pipePromise;
}

export async function embedText(text: string): Promise<Float32Array> {
  const pipe = await getEmbedder();
  const out = await pipe(text, { pooling: "mean", normalize: true });
  const data = out.data as Float32Array;
  return data;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function chunkMarkdown(content: string, maxLen = 320): string[] {
  const parts = content.split(/\n\n+/);
  const chunks: string[] = [];
  let buf = "";
  for (const p of parts) {
    if ((buf + p).length > maxLen && buf) {
      chunks.push(buf.trim());
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.length ? chunks : [content.slice(0, maxLen)];
}

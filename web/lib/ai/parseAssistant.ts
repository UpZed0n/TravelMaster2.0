/** Try to parse navigate_map action from model output. */
export function tryParseNavigateMap(text: string): string | null {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const j = JSON.parse(text.slice(start, end + 1)) as {
        action?: string;
        query?: string;
      };
      if (j.action === "navigate_map" && j.query) return j.query;
    }
  } catch {
    /* ignore */
  }
  const loose = text.match(/navigate_map[\s\S]{0,400}?"query"\s*:\s*"([^"]+)"/);
  return loose?.[1] ?? null;
}

export type StrategyArchivePayload = { title: string; content: string };

/** ```tour-strategy ... ``` fenced block */
export function tryParseStrategyArchive(text: string): StrategyArchivePayload | null {
  const fence = /```tour-strategy\s*([\s\S]*?)```/m.exec(text);
  if (!fence?.[1]) return null;
  const body = fence[1].trim();
  const title = /^title:\s*(.+)$/m.exec(body)?.[1]?.trim();
  const contentPipe = /^content:\s*\|\s*([\s\S]+)$/m.exec(body)?.[1]?.trim();
  const contentPlain = /^content:\s*([\s\S]+)$/m.exec(body)?.[1]?.trim();
  const content = contentPipe ?? contentPlain;
  if (title && content) return { title, content };
  return null;
}

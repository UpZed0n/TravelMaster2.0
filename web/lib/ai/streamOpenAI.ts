export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamOpenAIOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  tools?: unknown;
  toolChoice?: unknown;
};

export async function* streamChatCompletion(
  options: StreamOpenAIOptions
): AsyncGenerator<string, void, unknown> {
  const url = `${options.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      stream: true,
      messages: options.messages,
      ...(options.tools ? { tools: options.tools } : {}),
      ...(options.toolChoice ? { tool_choice: options.toolChoice } : {}),
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI-compatible error ${res.status}: ${t}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta.length) yield delta;
      } catch {
        /* ignore partial JSON */
      }
    }
  }
}

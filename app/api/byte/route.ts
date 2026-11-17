import { buildSystemPrompt, scriptedAnswer } from "@/lib/byte";

// Byte's brain. Answers questions about the site owner with Groq's free API,
// and falls back to scripted answers from lib/data.ts when:
//   - GROQ_API_KEY isn't set,
//   - the free daily limit is used up, or
//   - Groq is slow or down.
// Environment variables (set in Vercel, never in the code):
//   GROQ_API_KEY  free key from https://console.groq.com/keys
//   GROQ_MODEL    optional, defaults to openai/gpt-oss-120b

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY = 8;
const TIMEOUT_MS = 12_000;

// Best-effort rate limit per IP, so one visitor can't burn the free daily quota.
// Serverless instances don't share memory, so this only slows down bursts.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > MAX_PER_WINDOW;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  const raw = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    const role = (m as ChatMessage)?.role;
    const content = (m as ChatMessage)?.content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS);
    if (text) messages.push({ role, content: text });
  }
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") return null;
  return messages;
}

async function askGroq(messages: ChatMessage[], apiKey: string): Promise<string | null> {
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
        temperature: 0.6,
        max_completion_tokens: 600,
        // gpt-oss models think before answering; keep it quick for a chat bubble.
        ...(model.startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Byte: Groq returned ${res.status}`, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    return typeof reply === "string" && reply.trim() ? reply.trim() : null;
  } catch (err) {
    console.error("Byte: Groq request failed", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) return Response.json({ error: "Invalid request." }, { status: 400 });

  const question = messages[messages.length - 1].content;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Over the per-visitor limit: still answer, just without spending AI quota.
  const apiKey = process.env.GROQ_API_KEY;
  if (apiKey && !rateLimited(ip)) {
    const reply = await askGroq(messages, apiKey);
    if (reply) return Response.json({ reply, source: "ai" });
  }

  return Response.json({ reply: scriptedAnswer(question), source: "scripted" });
}

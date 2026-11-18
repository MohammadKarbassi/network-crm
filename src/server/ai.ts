import "server-only";
import { z } from "zod";

// ArvanCloud AI gateway, OpenAI-compatible (verified: Bearer auth, /models, json_schema response_format).
// Model chosen by test: GPT-4.1-Mini follows strict JSON schemas; DeepSeek-V4.1-Flash and others ignored them.

export const aiEnabled = () => Boolean(process.env.AI_API_KEY && process.env.AI_MODEL && process.env.AI_BASE_URL);

export class AiError extends Error {}

/**
 * Asks the model for JSON matching `schema`. The same zod schema builds the JSON schema sent to the API
 * and validates the reply, so a drifting model fails loudly instead of writing bad data.
 */
export async function generateJson<T extends z.ZodType>(schema: T, system: string, user: string, { timeoutMs = 45_000 } = {}): Promise<z.infer<T>> {
  if (!aiEnabled()) throw new AiError("هوش مصنوعی پیکربندی نشده است.");
  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema; // the API rejects the meta key

  let res: Response;
  try {
    res = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: `${system}\nپاسخ را فقط به‌صورت JSON مطابق اسکیما بده. متن‌ها به فارسی روان و محاوره‌ای-رسمی باشند.` },
          { role: "user", content: user },
        ],
        response_format: { type: "json_schema", json_schema: { name: "result", strict: true, schema: jsonSchema } },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    throw new AiError(e instanceof Error && e.name === "TimeoutError" ? "پاسخ هوش مصنوعی طول کشید؛ دوباره تلاش کنید." : "اتصال به سرویس هوش مصنوعی برقرار نشد.");
  }
  if (!res.ok) {
    console.error("[ai] HTTP", res.status, (await res.text()).slice(0, 300));
    throw new AiError(`سرویس هوش مصنوعی خطا داد (${res.status}).`);
  }
  const content = ((await res.json()) as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new AiError("پاسخ هوش مصنوعی قابل خواندن نبود.");
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    console.error("[ai] schema mismatch", result.error.issues.slice(0, 3));
    throw new AiError("پاسخ هوش مصنوعی با قالب مورد انتظار نمی‌خواند.");
  }
  return result.data;
}

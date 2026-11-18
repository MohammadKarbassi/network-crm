import "server-only";

// Docs: https://kavenegar.com/rest.html — every call returns { return: { status, message }, entries }.
const BASE = "https://api.kavenegar.com/v1";

export class KavenegarError extends Error {
  constructor(public status: number, message: string) {
    super(`Kavenegar ${status}: ${message}`);
  }
}

type Entry = { messageid: number; status: number; statustext: string; receptor: string; cost: number };

async function call(method: string, params: Record<string, string>): Promise<Entry[]> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  if (!apiKey) throw new Error("KAVENEGAR_API_KEY is not set");

  const res = await fetch(`${BASE}/${apiKey}/${method}.json`, {
    method: "POST",
    body: new URLSearchParams(params),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { return?: { status: number; message: string }; entries?: Entry[] } | null;
  const status = json?.return?.status ?? res.status;
  if (status !== 200) throw new KavenegarError(status, json?.return?.message ?? res.statusText);
  return json?.entries ?? [];
}

/** Template-based send (verify/lookup). Used for OTP; the template must contain %token. */
export async function sendLookup(receptor: string, template: string, token: string) {
  const [entry] = await call("verify/lookup", { receptor, template, token });
  return entry;
}

/** Plain-text send to up to 200 numbers. */
export async function sendSms(receptors: string[], message: string) {
  if (receptors.length > 200) throw new Error("Kavenegar accepts at most 200 receptors per call");
  const params: Record<string, string> = { receptor: receptors.join(","), message };
  if (process.env.KAVENEGAR_SENDER) params.sender = process.env.KAVENEGAR_SENDER;
  return call("sms/send", params);
}

import "server-only";

/** Which channels are configured, so the UI can disable the others instead of failing later. */
export const channelStatus = () => ({
  SMS: Boolean(process.env.KAVENEGAR_API_KEY),
  EMAIL: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
});

/** Test-mode guard: with MESSAGING_ALLOWLIST set, only listed recipients get real messages. */
export function isAllowedRecipient(to: string) {
  const list = process.env.MESSAGING_ALLOWLIST?.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !list?.length || list.includes(to.trim().toLowerCase());
}

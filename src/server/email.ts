import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transport: Transporter | undefined;

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP settings are not set");
  const port = Number(SMTP_PORT || 465);
  transport ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 587 uses STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transport;
}

/** EMAIL_FROM may be a full address or just a display name ("CX"); a bare name sends from the SMTP account. */
function sender() {
  const from = process.env.EMAIL_FROM?.trim();
  const account = process.env.SMTP_USER!;
  if (!from) return account;
  return from.includes("@") ? from : { name: from, address: account };
}

export async function sendEmail(to: string, subject: string, text: string) {
  const info = await getTransport().sendMail({ from: sender(), to, subject, text });
  return info.messageId;
}

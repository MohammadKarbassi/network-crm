import "server-only";
import type { Channel } from "@/generated/prisma/enums";
import type { Audience } from "@/lib/schemas";
import { db } from "@/server/db";

export type Recipient = { to: string; name: string; company: string | null; customerId?: string; leadId?: string };

/** Everyone the audience matches who has a phone (SMS) or email (EMAIL). */
export async function resolveAudience(audience: Audience, channel: Channel): Promise<Recipient[]> {
  const contact = channel === "SMS" ? { phone: { not: null } } : { email: { not: null } };
  const common = { ...contact, ...(audience.source && { source: audience.source }), ...(audience.ownerId && { ownerId: audience.ownerId }) };
  const select = { id: true, name: true, company: true, phone: true, email: true };

  const rows =
    audience.target === "customers"
      ? (await db.customer.findMany({ where: common, select })).map((r) => ({ ...r, customerId: r.id }))
      : (await db.lead.findMany({ where: { ...common, status: audience.status ?? { not: "CONVERTED" } }, select })).map((r) => ({ ...r, leadId: r.id }));

  // One message per address, even if two records share it.
  const seen = new Set<string>();
  return rows.flatMap((r) => {
    const to = (channel === "SMS" ? r.phone : r.email)!;
    if (seen.has(to)) return [];
    seen.add(to);
    return [{ to, name: r.name, company: r.company, customerId: "customerId" in r ? r.customerId : undefined, leadId: "leadId" in r ? r.leadId : undefined }];
  });
}

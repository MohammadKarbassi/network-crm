"use server";

import { toEnglishDigits } from "@/lib/phone";
import { ownedBy } from "@/server/auth/scope";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";

export type SearchHit = { id: string; kind: "customer" | "lead" | "deal"; title: string; subtitle: string | null; href: string };

/** ⌘K search across the records this user may see. */
export async function searchAction(query: string): Promise<SearchHit[]> {
  const me = await requireUser();
  // Arabic keyboards type ي/ك; stored Persian text uses ی/ک. Phones are stored with Latin digits.
  const q = query.trim().replace(/ي/g, "ی").replace(/ك/g, "ک");
  if (q.length < 2) return [];
  const text = { contains: q, mode: "insensitive" as const };
  const phone = toEnglishDigits(q).replace(/[\s-]/g, "");
  const contact = { ...ownedBy(me), OR: [{ name: text }, { company: text }, { phone: { contains: phone } }, { email: text }] };
  const [customers, leads, deals] = await Promise.all([
    db.customer.findMany({ where: contact, take: 5, select: { id: true, name: true, company: true } }),
    db.lead.findMany({ where: { ...contact, status: { not: "CONVERTED" } }, take: 5, select: { id: true, name: true, company: true } }),
    db.deal.findMany({ where: { ...ownedBy(me), title: text }, take: 5, select: { id: true, title: true, customer: { select: { name: true } } } }),
  ]);
  return [
    ...customers.map((c) => ({ id: c.id, kind: "customer" as const, title: c.name, subtitle: c.company, href: `/customers/${c.id}` })),
    ...leads.map((l) => ({ id: l.id, kind: "lead" as const, title: l.name, subtitle: l.company, href: `/leads/${l.id}` })),
    ...deals.map((d) => ({ id: d.id, kind: "deal" as const, title: d.title, subtitle: d.customer.name, href: `/deals?open=${d.id}` })),
  ];
}

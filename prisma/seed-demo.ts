import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { DealStage, LeadStatus, Priority, Source } from "../src/generated/prisma/enums";

// Demo data for local testing and the demo video. Opt-in (`npm run db:seed:demo`); never run it on production.
// Demo users get 0910000000x numbers, which are not real lines, so they cannot log in.
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; // deterministic, so reruns look the same
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
const daysAgo = (n: number, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(rand() * 60), 0, 0);
  return d;
};

const firstNames = ["مریم", "رضا", "نگار", "حسین", "زهرا", "امیر", "فاطمه", "مهدی", "سارا", "علی", "نازنین", "محمد", "الهام", "پویا", "شیما", "کیان"];
const lastNames = ["محمدی", "حسینی", "کریمی", "رحیمی", "موسوی", "جعفری", "صادقی", "نوری", "اکبری", "قاسمی", "طاهری", "شریفی"];
const companies = ["پخش البرز", "فولاد سپهر", "نرم‌افزار آوا", "کلینیک مهر", "آموزشگاه نوین", "رستوران زیتون", "بازرگانی پارس", "دکوراسیون آرین", "چاپ گستر", "تجهیزات پزشکی سینا", "کافه دنج", "مبلمان رویال"];
const dealTitles = ["قرارداد پشتیبانی سالانه", "خرید لایسنس ۱۰ کاربره", "پروژهٔ پیاده‌سازی", "تمدید اشتراک", "خرید تجهیزات", "مشاوره و آموزش تیم", "ارتقای پلن سازمانی"];
const sources: Source[] = ["WEBSITE", "WEBSITE", "INSTAGRAM", "INSTAGRAM", "REFERRAL", "PHONE", "EXHIBITION", "ADVERTISING"];
const person = () => `${pick(firstNames)} ${pick(lastNames)}`;
const phone = () => `0912${String(Math.floor(rand() * 9_000_000) + 1_000_000)}`;

async function main() {
  if (await db.user.findUnique({ where: { phone: "09100000001" } })) {
    console.log("Demo data already exists; skipping.");
    return;
  }
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("Run `npm run db:seed` first to create the admin.");

  const manager = await db.user.create({ data: { phone: "09100000001", name: "نیلوفر احمدی", role: "SALES_MANAGER" } });
  const reps = await Promise.all(
    ["کامران رستمی", "مینا یوسفی", "بهرام کاظمی"].map((name, i) => db.user.create({ data: { phone: `0910000000${i + 2}`, name, role: "SALES_REP" } })),
  );
  // Uneven skill so the team table has a story.
  const repWeight = [0.5, 0.3, 0.2];
  const pickRep = () => {
    const r = rand();
    return r < repWeight[0] ? reps[0] : r < repWeight[0] + repWeight[1] ? reps[1] : reps[2];
  };

  const customers = [];
  for (let i = 0; i < 30; i++) {
    const owner = pickRep();
    const createdAt = daysAgo(Math.floor(rand() * 180));
    const c = await db.customer.create({
      data: { name: person(), company: pick(companies), phone: phone(), source: pick(sources), ownerId: owner.id, createdAt },
    });
    await db.activity.create({ data: { type: "SYSTEM", body: "مشتری ثبت شد.", customerId: c.id, authorId: owner.id, createdAt } });
    customers.push(c);
  }

  const statuses: LeadStatus[] = ["NEW", "NEW", "CONTACTED", "CONTACTED", "QUALIFIED", "UNQUALIFIED"];
  const priorities: Priority[] = ["LOW", "MEDIUM", "MEDIUM", "HIGH"];
  for (let i = 0; i < 50; i++) {
    const owner = rand() < 0.15 ? null : pickRep();
    const createdAt = daysAgo(Math.floor(rand() * rand() * 60)); // skewed toward recent
    const lead = await db.lead.create({
      data: { name: person(), company: rand() < 0.6 ? pick(companies) : null, phone: phone(), source: pick(sources), status: pick(statuses), priority: pick(priorities), ownerId: owner?.id, createdAt },
    });
    await db.activity.create({ data: { type: "SYSTEM", body: "لید ثبت شد.", leadId: lead.id, authorId: owner?.id ?? admin.id, createdAt } });
  }

  const openStages: DealStage[] = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION"];
  const positions: Record<string, number> = {};
  for (let i = 0; i < 60; i++) {
    const customer = pick(customers);
    const age = Math.floor(rand() * 180);
    const closed = age > 14 && rand() < 0.75;
    const stage: DealStage = closed ? (rand() < 0.62 ? "WON" : "LOST") : pick(openStages);
    const amount = BigInt(Math.round((5 + rand() * rand() * 195) * 1_000_000 / 100_000) * 100_000); // 5M–200M Toman
    positions[stage] = (positions[stage] ?? -1) + 1;
    const deal = await db.deal.create({
      data: {
        title: pick(dealTitles),
        amount,
        stage,
        position: positions[stage],
        customerId: customer.id,
        ownerId: customer.ownerId,
        createdAt: daysAgo(age),
        closedAt: closed ? daysAgo(Math.max(0, age - 7 - Math.floor(rand() * 14))) : null,
        expectedCloseAt: closed ? null : daysAgo(-(3 + Math.floor(rand() * 40)), 12),
      },
    });
    await db.activity.create({ data: { type: "SYSTEM", body: `معامله «${deal.title}» ثبت شد.`, dealId: deal.id, customerId: customer.id, authorId: customer.ownerId, createdAt: deal.createdAt } });
  }

  const taskTitles = ["تماس پیگیری", "ارسال پیش‌فاکتور", "جلسهٔ دمو", "پیگیری پرداخت", "ارسال کاتالوگ", "هماهنگی جلسهٔ حضوری"];
  for (let i = 0; i < 40; i++) {
    const customer = pick(customers);
    const offset = Math.floor(rand() * 20) - 6; // some overdue, most upcoming
    const done = offset < 0 && rand() < 0.6;
    await db.task.create({
      data: {
        title: `${pick(taskTitles)} — ${customer.name}`,
        dueAt: daysAgo(-offset, 9 + Math.floor(rand() * 8)),
        doneAt: done ? daysAgo(-offset + 1) : null,
        assigneeId: customer.ownerId ?? reps[0].id,
        createdById: rand() < 0.3 ? manager.id : customer.ownerId,
        customerId: customer.id,
      },
    });
  }
  console.log("Demo data created: 4 users, 30 customers, 50 leads, 60 deals, 40 tasks.");
}

main().finally(() => db.$disconnect());

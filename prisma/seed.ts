import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { normalizeIranMobile } from "../src/lib/phone";

// Creates (or re-activates) the first admin so someone can log in. Safe to run repeatedly.
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const phone = normalizeIranMobile(process.env.SEED_ADMIN_PHONE ?? "");
  if (!phone) throw new Error("SEED_ADMIN_PHONE must be a valid Iranian mobile number");
  const name = process.env.SEED_ADMIN_NAME || "مدیر سیستم";
  const admin = await db.user.upsert({
    where: { phone },
    update: { role: "ADMIN", isActive: true },
    create: { phone, name, role: "ADMIN" },
  });
  console.log(`Admin ready: ${admin.phone}`);
}

main().finally(() => db.$disconnect());

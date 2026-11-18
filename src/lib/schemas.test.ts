import { describe, expect, it } from "vitest";
import { isoDay, tomanAmount } from "./schemas";

describe("tomanAmount", () => {
  it.each([
    ["۵۰٬۰۰۰٬۰۰۰", BigInt(50_000_000)],
    ["1,250,000", BigInt(1_250_000)],
    ["", BigInt(0)],
  ])("%s -> %s", (input, expected) => expect(tomanAmount.parse(input || undefined)).toBe(expected));

  it.each(["12.5", "-100", "abc", "1".repeat(16)])("rejects %s", (input) => expect(tomanAmount.safeParse(input).success).toBe(false));
});

describe("isoDay", () => {
  it("keeps the calendar day in Tehran", () => {
    const d = isoDay.parse("2026-11-21")!;
    expect(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(d)).toBe("2026-11-21");
  });
});

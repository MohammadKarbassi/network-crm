import { describe, expect, it } from "vitest";
import { scoreLead } from "./lead-score";

const base = { status: "NEW", priority: "MEDIUM", source: "WEBSITE", phone: null, email: null, interactions: 0, lastInteractionAt: null } as const;
const now = new Date("2026-11-19T12:00:00Z");

describe("scoreLead", () => {
  it("scores a bare new lead low", () => expect(scoreLead(base, now)).toMatchObject({ score: 26, band: "cold" }));
  it("rewards a qualified, referred, engaged lead", () => {
    const r = scoreLead({ ...base, status: "QUALIFIED", priority: "HIGH", source: "REFERRAL", phone: "1", email: "a", interactions: 5, lastInteractionAt: new Date("2026-11-17T12:00:00Z") }, now);
    expect(r).toMatchObject({ score: 100, band: "hot" });
  });
  it("caps unqualified leads", () => expect(scoreLead({ ...base, status: "UNQUALIFIED", priority: "HIGH", source: "REFERRAL" }, now).score).toBe(10));
  it("decays with time since last interaction", () => {
    const recent = scoreLead({ ...base, lastInteractionAt: new Date("2026-11-15T12:00:00Z") }, now).score;
    const old = scoreLead({ ...base, lastInteractionAt: new Date("2026-09-01T12:00:00Z") }, now).score;
    expect(recent - old).toBe(10);
  });
});

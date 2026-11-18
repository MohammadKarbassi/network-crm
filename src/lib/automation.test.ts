import { describe, expect, it } from "vitest";
import { automationTemplates, formatWait, matchesTrigger, stepsSchema } from "./automation";

describe("automation", () => {
  it("templates are valid step lists", () => {
    for (const t of automationTemplates) expect(stepsSchema.safeParse(t.steps).success).toBe(true);
  });
  it("rejects bad steps", () => {
    expect(stepsSchema.safeParse([]).success).toBe(false);
    expect(stepsSchema.safeParse([{ type: "WAIT", minutes: 0 }]).success).toBe(false);
    expect(stepsSchema.safeParse([{ type: "DELETE_ALL" }]).success).toBe(false);
  });
  it("matches trigger config", () => {
    expect(matchesTrigger({}, { stage: "WON" })).toBe(true);
    expect(matchesTrigger({ stage: "WON" }, { stage: "WON" })).toBe(true);
    expect(matchesTrigger({ stage: "WON" }, { stage: "LOST" })).toBe(false);
    expect(matchesTrigger({ status: "QUALIFIED" }, { status: "NEW" })).toBe(false);
  });
  it("formats waits", () => {
    expect(formatWait(1440)).toBe("۱ روز");
    expect(formatWait(120)).toBe("۲ ساعت");
    expect(formatWait(5)).toBe("۵ دقیقه");
  });
});

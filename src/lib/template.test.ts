import { expect, it } from "vitest";
import { fillTemplate } from "./template";

it("fills known placeholders and blanks the rest", () => {
  expect(fillTemplate("سلام {{name}} از {{ company }}{{x}}", { name: "مریم", company: "آوا" })).toBe("سلام مریم از آوا");
  expect(fillTemplate("سلام {{name}}", { name: null })).toBe("سلام ");
});

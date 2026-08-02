import { describe, expect, it } from "vitest";
import { dealScoreLabel, formatMoney } from "@rigscout/shared";

describe("formatMoney", () => {
  it("formats minor units as USD currency", () => {
    expect(formatMoney(59999)).toBe("$599.99");
  });

  it("handles zero", () => {
    expect(formatMoney(0)).toBe("$0.00");
  });
});

describe("dealScoreLabel", () => {
  it("labels null when history is limited", () => {
    expect(dealScoreLabel(null)).toBe("Insufficient history");
  });

  it("labels excellent deals", () => {
    expect(dealScoreLabel(85)).toBe("Excellent deal");
  });
});

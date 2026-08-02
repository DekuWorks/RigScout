import { describe, expect, it } from "vitest";
import { getLearnGuideMeta, learnGuideMeta, loadLearnGuide } from "./index";

const requiredSlugs = [
  "pc-components",
  "choosing-cpu-gpu",
  "sockets-chipsets",
  "psu-wattage-efficiency",
  "ram-types-capacity",
  "storage-types",
  "cooling-options",
  "avoiding-overpriced-prebuilts",
  "balanced-gaming-pc",
];

describe("learn content", () => {
  it("exposes the nine Phase 6 guides in order", () => {
    expect(learnGuideMeta.map((g) => g.slug)).toEqual(requiredSlugs);
    expect(new Set(learnGuideMeta.map((g) => g.slug)).size).toBe(requiredSlugs.length);
  });

  it("loads each guide body via lazy modules", async () => {
    for (const slug of requiredSlugs) {
      const meta = getLearnGuideMeta(slug);
      expect(meta).toBeTruthy();
      const guide = await loadLearnGuide(slug);
      expect(guide?.slug).toBe(slug);
      expect(guide?.body.length).toBeGreaterThan(200);
      expect(guide?.title).toBe(meta?.title);
    }
  });

  it("returns null for unknown slugs", async () => {
    expect(getLearnGuideMeta("missing")).toBeUndefined();
    expect(await loadLearnGuide("missing")).toBeNull();
  });
});

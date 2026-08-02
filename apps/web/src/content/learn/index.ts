import type { LearnGuide, LearnGuideMeta } from "./types";

const guideLoaders: Record<string, () => Promise<{ guide: LearnGuide }>> = {
  "pc-components": () => import("./guides/pc-components"),
  "choosing-cpu-gpu": () => import("./guides/choosing-cpu-gpu"),
  "sockets-chipsets": () => import("./guides/sockets-chipsets"),
  "psu-wattage-efficiency": () => import("./guides/psu-wattage"),
  "ram-types-capacity": () => import("./guides/ram-types"),
  "storage-types": () => import("./guides/storage-types"),
  "cooling-options": () => import("./guides/cooling-options"),
  "avoiding-overpriced-prebuilts": () => import("./guides/avoiding-prebuilts"),
  "balanced-gaming-pc": () => import("./guides/balanced-gaming-pc"),
};

/** Eager metadata for the Learn index (bodies load on demand). */
export const learnGuideMeta: LearnGuideMeta[] = [
  {
    slug: "pc-components",
    title: "What every PC component does",
    summary: "A plain-English tour of the parts inside a desktop PC and how they work together.",
    readingMinutes: 7,
    tags: ["basics", "components"],
    order: 1,
  },
  {
    slug: "choosing-cpu-gpu",
    title: "Choosing a CPU and GPU",
    summary: "How to balance processor and graphics spend for your resolution, games, and budget.",
    readingMinutes: 8,
    tags: ["cpu", "gpu", "budget"],
    order: 2,
  },
  {
    slug: "sockets-chipsets",
    title: "Understanding sockets and chipsets",
    summary: "Why CPU, motherboard, and RAM must match — and what chipset features actually matter.",
    readingMinutes: 7,
    tags: ["motherboard", "platform"],
    order: 3,
  },
  {
    slug: "psu-wattage-efficiency",
    title: "PSU wattage and efficiency",
    summary: "How much power you need, what 80 PLUS means, and why cheap PSUs are a false saving.",
    readingMinutes: 6,
    tags: ["psu", "power"],
    order: 4,
  },
  {
    slug: "ram-types-capacity",
    title: "RAM types and capacity",
    summary: "DDR4 vs DDR5, how much memory to buy, and when faster kits are worth it.",
    readingMinutes: 6,
    tags: ["ram", "memory"],
    order: 5,
  },
  {
    slug: "storage-types",
    title: "Storage types",
    summary: "NVMe, SATA SSD, and HDD — what to use for Windows, games, and archives.",
    readingMinutes: 5,
    tags: ["storage", "ssd"],
    order: 6,
  },
  {
    slug: "cooling-options",
    title: "Cooling options",
    summary: "Air vs AIO liquid, case airflow basics, and how to keep a gaming PC quiet and cool.",
    readingMinutes: 6,
    tags: ["cooling", "thermals"],
    order: 7,
  },
  {
    slug: "avoiding-overpriced-prebuilts",
    title: "Avoiding overpriced prebuilts",
    summary: "How to spot padded prebuilt pricing, weak PSUs, and marketing that wastes your budget.",
    readingMinutes: 7,
    tags: ["prebuilt", "budget", "value"],
    order: 8,
  },
  {
    slug: "balanced-gaming-pc",
    title: "Building a balanced gaming PC",
    summary: "A step-by-step framework to allocate budget, avoid weak links, and shop with RigScout.",
    readingMinutes: 8,
    tags: ["builds", "gaming", "checklist"],
    order: 9,
  },
].sort((a, b) => a.order - b.order);

export function getLearnGuideMeta(slug: string): LearnGuideMeta | undefined {
  return learnGuideMeta.find((guide) => guide.slug === slug);
}

export async function loadLearnGuide(slug: string): Promise<LearnGuide | null> {
  const loader = guideLoaders[slug];
  if (!loader) return null;
  const mod = await loader();
  return mod.guide;
}

export function listLearnTags(): string[] {
  const tags = new Set<string>();
  learnGuideMeta.forEach((guide) => guide.tags.forEach((tag) => tags.add(tag)));
  return [...tags].sort();
}

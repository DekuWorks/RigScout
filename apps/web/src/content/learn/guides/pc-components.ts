import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "pc-components",
  title: "What every PC component does",
  summary: "A plain-English tour of the parts inside a desktop PC and how they work together.",
  readingMinutes: 7,
  tags: ["basics", "components"],
  order: 1,
  body: `# What every PC component does

Building a PC is less mysterious when you know each part’s job. Think of a PC like a small workshop: power in, work done, heat out, storage kept.

## CPU (processor)

The CPU is the brain. It runs your operating system, games, and apps. More cores and higher clocks help with multitasking and CPU-heavy games or content work. The CPU must match your motherboard **socket**.

## Motherboard

The motherboard is the hub that connects everything. It sets your CPU socket, RAM type, expansion slots (PCIe), storage connectors, and many USB/network ports. Chipset features (overclocking, extra lanes) live here too.

## GPU (graphics card)

The GPU draws frames for games and creative apps. For most 1080p/1440p gaming builds, the GPU is the largest single cost and the biggest performance lever. It needs enough case clearance, a matching PCIe slot, and PSU connectors.

## RAM (memory)

RAM is short-term working memory. Games and browsers keep assets here while running. Too little RAM causes stuttering; more than you need rarely helps frame rates much. Match the motherboard’s supported type (DDR4 vs DDR5) and preferred speeds.

## Storage (SSD / HDD)

Storage holds your OS, games, and files. A fast NVMe SSD makes Windows and game loads feel snappy. Capacity matters more than peak benchmarks once you are on a modern SSD. Keep a boot drive and add more storage when libraries grow.

## Power supply (PSU)

The PSU converts wall power into clean DC rails for every component. Undersizing or cheap no-name units risk crashes and hardware damage. Aim for reputable brands, enough wattage with headroom, and a sensible efficiency rating.

## Case

The case mounts parts, manages airflow, and sets GPU/cooler size limits. Cable routes and front intake matter more than RGB. Measure GPU length, cooler height, and radiator support before you buy.

## Cooling

Coolers and fans move heat away from the CPU and GPU. Air coolers are simple and quiet enough for most builds; AIOs can help in tight or high-power setups. Good case airflow often beats a flashy cooler in a choked case.

## How they fit together

1. Choose CPU + motherboard (socket / chipset).
2. Pick RAM that the board supports.
3. Choose a GPU for your resolution and budget.
4. Size the PSU for GPU + CPU peak draw with headroom.
5. Confirm the case fits GPU, cooler, and storage plan.

When you are ready to shop, use [Discover Parts](/app/discover) and track candidates in [Build Lab](/app/builds).
`,
};


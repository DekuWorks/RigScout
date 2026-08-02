import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "choosing-cpu-gpu",
  title: "Choosing a CPU and GPU",
  summary: "How to balance processor and graphics spend for your resolution, games, and budget.",
  readingMinutes: 8,
  tags: ["cpu", "gpu", "budget"],
  order: 2,
  body: `# Choosing a CPU and GPU

For gaming PCs, the GPU usually does more for frame rates than a top-tier CPU. The goal is a **balanced pair**: neither part should leave a large pile of unused performance on the table.

## Start with how you play

- **1080p competitive**: Mid-range GPU + solid 6–8 core CPU is often enough.
- **1440p high settings**: GPU budget should dominate; CPU still needs decent cores for modern titles.
- **4K**: GPU-heavy. CPU upgrades matter less until the GPU is strong.
- **Streaming / content**: Spend more on CPU cores and cooler headroom.

## GPU buying checklist

1. Target resolution and refresh rate (for example 1440p / 144 Hz).
2. Check VRAM needs for the settings you care about.
3. Confirm case length, PSU connectors, and wattage.
4. Compare current street price vs recent highs using RigScout deal scores.
5. Avoid paying a large premium for a tiny tier jump if the next GPU down meets your fps goal.

## CPU buying checklist

1. Match the motherboard socket you want (or buy board + CPU together).
2. Prefer recent generations for efficiency and platform longevity.
3. Check whether you need integrated graphics (handy for troubleshooting without a GPU).
4. Pair with a cooler that can handle sustained load quietly.
5. Do not overspend on a flagship CPU if your GPU is mid-range.

## Avoiding bottlenecks (in plain terms)

A “bottleneck” just means one part limits the other. At 1080p, a weak CPU can hold back a strong GPU. At 4K, the GPU is busy enough that the same CPU is often fine. Use real game benchmarks at *your* resolution, not synthetic scores alone.

## A practical spend split

Many balanced gaming builds put roughly **45–55%** of the parts budget into the GPU, **15–25%** into the CPU + cooler, and the rest into board, RAM, storage, PSU, and case. Adjust if you edit video, run VMs, or need quiet operation.

Next: read [Understanding sockets and chipsets](/app/learn/sockets-chipsets) before locking a platform.
`,
};


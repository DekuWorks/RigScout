import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "storage-types",
  title: "Storage types",
  summary: "NVMe, SATA SSD, and HDD — what to use for Windows, games, and archives.",
  readingMinutes: 5,
  tags: ["storage", "ssd"],
  order: 6,
  body: `# Storage types

Fast storage changes how a PC *feels* every day. You do not need the most expensive drive — you need the right type and enough capacity.

## NVMe SSD (M.2)

The default choice for a boot drive and active game library. Installs in an M.2 slot, uses PCIe lanes, and offers strong sequential and much better everyday responsiveness than spinning disks.

Tips:

- Confirm your motherboard M.2 slot count and whether a heatsink is included
- Gen label (PCIe 3.0 / 4.0 / 5.0) matters less for many games than capacity and DRAM/cache behavior
- Leave some free space; SSDs like breathing room

## SATA SSD

Still fine for secondary storage or upgrades in older systems. Usually cheaper per GB than cutting-edge NVMe, but limited by the SATA interface.

## HDD (hard disk)

Best reserved for bulk cold storage: recordings, photo archives, rarely played games. Loud, slower seek times, and not ideal as a sole OS drive in 2026.

## Capacity planning

A simple layout:

1. **1 TB NVMe** for OS + active games (minimum comfort for many people)
2. Add another NVMe or large SATA SSD when libraries grow
3. Optional HDD for archives if you truly need multi-terabyte cheap space

## What not to overpay for

Marketing peak GB/s numbers rarely change frame rates. Spend on capacity and a reliable brand before chasing the fastest Gen 5 controller unless you have a proven workload that needs it.

When comparing listings in RigScout, watch for the same capacity and interface — a “deal” on a much smaller or slower drive is not a deal.
`,
};


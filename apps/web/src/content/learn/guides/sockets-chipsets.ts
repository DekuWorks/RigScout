import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "sockets-chipsets",
  title: "Understanding sockets and chipsets",
  summary: "Why CPU, motherboard, and RAM must match — and what chipset features actually matter.",
  readingMinutes: 7,
  tags: ["motherboard", "platform"],
  order: 3,
  body: `# Understanding sockets and chipsets

Platform choice is the foundation of a build. Get socket and memory type right first; RGB can wait.

## Socket

The **socket** is the physical and electrical interface between CPU and motherboard. Examples change over time (AMD AM5, Intel LGA generations). A CPU only fits boards with the matching socket *and* usually needs a BIOS that supports that CPU stepping.

Rule: buy CPU and motherboard as a compatible pair, or verify the board’s CPU support list before ordering.

## Chipset

The **chipset** is the motherboard’s feature set: USB ports, SATA/NVMe counts, PCIe lane layout, overclocking support, and networking options. Within one socket family you will see tiers (entry, mid, higher-end).

What matters for most builders:

- Enough M.2 slots for your storage plan
- Enough USB and rear I/O for your desk setup
- VRM quality adequate for your CPU (especially if boosting / overclocking)
- BIOS flashback if you might update without a compatible CPU on hand
- Features you will use (Wi-Fi, 2.5G LAN, extra PCIe slots) — skip the rest

## RAM generations

Motherboards support a memory generation such as **DDR4** or **DDR5**. You cannot mix them. Check:

- Supported speeds (and whether Expo/XMP profiles are listed)
- Maximum capacity per kit / per stick
- Dual-channel layouts (usually two or four matched sticks)

## Upgrade paths

Prefer platforms with a published multi-generation CPU roadmap when you want to upgrade later. Still treat “future proof” as a bonus, not a reason to overspend today — GPUs and storage usually give clearer gains per dollar.

## Quick compatibility path in RigScout

1. Pick a CPU in [Discover](/app/discover).
2. Filter motherboards for the same socket family.
3. Add both to a [Build Lab](/app/builds) list and check guidance for socket / RAM notes.
4. Only then choose case coolers and GPU length limits.

Related: [RAM types and capacity](/app/learn/ram-types-capacity).
`,
};


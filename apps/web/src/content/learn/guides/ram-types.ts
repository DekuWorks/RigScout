import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "ram-types-capacity",
  title: "RAM types and capacity",
  summary: "DDR4 vs DDR5, how much memory to buy, and when faster kits are worth it.",
  readingMinutes: 6,
  tags: ["ram", "memory"],
  order: 5,
  body: `# RAM types and capacity

RAM is one of the easier parts to get right — and one of the most annoying to get wrong because motherboards are picky.

## DDR4 vs DDR5

- **DDR4**: Still common on older platforms; often cheaper per GB.
- **DDR5**: Standard on newer sockets; higher bandwidth and different kit pricing.

Your motherboard decides. You cannot install DDR5 sticks in a DDR4 board.

## How much capacity?

Guidelines for gaming-focused desktops:

- **16 GB**: Minimum for many titles; can feel tight with Chrome + Discord + overlays.
- **32 GB**: Sweet spot for most 2026 gaming + multitasking builds.
- **64 GB+**: Creators, heavy multitasking, VMs, large sample libraries.

Buying one 16 GB stick instead of a matched dual-channel kit can leave performance on the table. Prefer a **2x16 GB** kit (or the dual-channel layout your board recommends).

## Speed and latency

Faster RAM can help, especially on platforms that scale well with memory bandwidth — but returns diminish quickly. A stable kit at a JEDEC / Expo / XMP profile your board lists is better than an extreme kit that will not train reliably.

## Practical shopping rules

1. Match generation (DDR4/DDR5) to the motherboard.
2. Buy a kit, not random mismatched sticks when possible.
3. Check height if you use a large air cooler.
4. Enable the memory profile in BIOS after install.
5. Upgrade capacity before chasing tiny speed bumps if you are swapping apps often.

See also: [Understanding sockets and chipsets](/app/learn/sockets-chipsets).
`,
};


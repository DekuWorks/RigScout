import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "cooling-options",
  title: "Cooling options",
  summary: "Air vs AIO liquid, case airflow basics, and how to keep a gaming PC quiet and cool.",
  readingMinutes: 6,
  tags: ["cooling", "thermals"],
  order: 7,
  body: `# Cooling options

Cooling is about sustained performance and noise — not just peak temperature screenshots.

## Air coolers

A quality tower air cooler handles most mainstream and many high-end CPUs. Pros: simple, reliable, no pump. Cons: can block tall RAM or wide motherboards; check cooler height vs case clearance.

## AIO liquid coolers

All-in-one coolers move heat to a radiator mounted in the case. They help in compact builds or with very hot CPUs, and can look clean. They add a pump (another failure point) and need radiator space (120 / 240 / 360 mm mounts).

## Case airflow

Even a great CPU cooler loses if the case is a hot box.

- Prefer a clear intake → exhaust path
- Do not block front intake with dense solid panels unless there is another intake plan
- Dust filters help — clean them
- More mediocre fans configured well often beat one aggressive fan screaming at 100%

## GPU thermals

Modern GPUs manage themselves, but they need space. Avoid sandwiching a thick card against glass with zero intake. Vertical mounts look cool; they need intentional airflow.

## How to choose

1. Check CPU TDP / expected boost behavior.
2. Measure case CPU cooler height or radiator support.
3. Decide noise targets (office quiet vs RGB showcase).
4. Spend first on case airflow + a competent air cooler; upgrade to AIO if temps or clearance demand it.

Build Lab compatibility notes flag cooler clearance when you assemble a list — use them before ordering.
`,
};


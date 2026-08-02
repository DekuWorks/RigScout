import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "balanced-gaming-pc",
  title: "Building a balanced gaming PC",
  summary: "A step-by-step framework to allocate budget, avoid weak links, and shop with RigScout.",
  readingMinutes: 8,
  tags: ["builds", "gaming", "checklist"],
  order: 9,
  body: `# Building a balanced gaming PC

A balanced PC hits your fps target without one flashy part starving the rest of the system.

## Step 1 — Write constraints

- Resolution and refresh rate
- Games or apps that matter most
- Budget ceiling (parts only vs full desk setup)
- Size / noise limits
- Whether you will upgrade in 1–2 years

## Step 2 — Pick the GPU first (usually)

Choose the cheapest GPU that reliably meets your settings target. That anchors the budget.

## Step 3 — Pair a sensible CPU

Match the GPU tier. Use recent-gen mid-range CPUs for most 1080p/1440p builds; spend up if you stream, encode, or run heavy background apps.

## Step 4 — Platform, RAM, storage

- Motherboard: compatible socket, enough M.2, decent VRM for your CPU
- RAM: 32 GB dual-channel is the common gaming sweet spot
- Storage: 1 TB+ NVMe boot drive

## Step 5 — PSU, case, cooling

These are easy to underspend on. A quality PSU, a case with real airflow, and a cooler with clearance beats another RGB strip.

## Step 6 — Sanity-check the whole list

In [Build Lab](/app/builds):

1. Add each part and preferred listing
2. Read compatibility guidance (socket, RAM, fit, PSU headroom)
3. Set a target total
4. Export or share when you are ready to buy
5. Use [Watchlist](/app/watchlist) alerts so you do not overpay on the GPU

## Example budget mindset (not a fixed shopping list)

For a mid-range 1440p gaming build, many people roughly allocate:

- GPU: largest share
- CPU + cooler: solid mid-range
- Board + RAM + SSD: reliable, not exotic
- PSU + case: quality over cosmetics

Exact dollars shift with the market — that is why price tracking matters.

## Final checklist

- [ ] Socket / RAM generation match
- [ ] GPU fits case; PSU has connectors + wattage
- [ ] Cooler height / radiator support confirmed
- [ ] Boot SSD capacity planned
- [ ] Prices checked against recent ranges
- [ ] Prebuilt alternative priced for comparison

You now have enough to shop smarter. Start with [What every PC component does](/app/learn/pc-components) if you want a refresher, or jump into Discover and Build Lab.
`,
};
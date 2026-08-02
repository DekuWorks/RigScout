import type { LearnGuide } from "../types";

export const guide: LearnGuide = {
  slug: "psu-wattage-efficiency",
  title: "PSU wattage and efficiency",
  summary: "How much power you need, what 80 PLUS means, and why cheap PSUs are a false saving.",
  readingMinutes: 6,
  tags: ["psu", "power"],
  order: 4,
  body: `# PSU wattage and efficiency

A good power supply is insurance. A bad one can take other parts with it.

## Wattage (how much capacity)

Wattage is the continuous power the PSU can deliver. Size for:

- GPU recommended / peak board power
- CPU package power under load
- Everything else (drives, fans, RGB) — usually smaller
- **Headroom** so the unit is not stuck at 100% forever

A common approach: estimate peak system draw, then choose a quality unit around **30–50% above** that number. Headroom improves acoustics, heat, and longevity. Going enormously oversized is unnecessary; quality matters more than a huge number on a no-name box.

## Efficiency ratings

**80 PLUS** (and similar) ratings describe how much wall power becomes useful DC power at certain loads. Higher efficiency means less waste heat and often better components — but the badge alone is not enough. Prefer known brands with solid reviews and protections (OCP, OVP, short-circuit, etc.).

## Cables and connectors

Confirm the PSU includes the GPU power connectors you need (or a trustworthy 12VHPWR / 12V-2x6 cable when required). Modular and semi-modular cables reduce clutter and help airflow.

## Practical tips

- Do not reuse a decade-old bargain PSU for a new high-power GPU.
- Match ATX form factor and depth to your case.
- If you upgrade GPUs often, buy a bit more headroom once rather than replacing the PSU every year.
- Use Build Lab totals and compatibility notes as a sanity check, then verify with manufacturer GPU power guidance.

Next up: [Cooling options](/app/learn/cooling-options) — because wattage becomes heat.
`,
};


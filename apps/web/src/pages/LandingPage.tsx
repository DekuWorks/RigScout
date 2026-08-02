import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  ChartLine,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BRAND } from "@rigscout/shared";
import pcHeroUrl from "@/assets/pc-hero.png";
import { Logo } from "@/components/brand/Logo";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 lg:px-6">
        <Logo to="/" />
        <nav className="hidden items-center gap-6 text-sm text-[var(--muted)] md:flex">
          <a href="#how" className="hover:text-[var(--fg)]">
            How it works
          </a>
          <a href="#pricing" className="hover:text-[var(--fg)]">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[var(--fg)]">
            FAQ
          </a>
          <Link to="/login" className="hover:text-[var(--fg)]">
            Log in
          </Link>
          <Link to="/signup" className="rs-btn-primary">
            Get started
          </Link>
        </nav>
        <Link to="/signup" className="rs-btn-primary md:hidden">
          Start
        </Link>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 pb-16 pt-8 lg:px-6 lg:pb-24 lg:pt-14">
        <div className="grid items-center gap-8 md:grid-cols-[1fr_1fr] lg:gap-6">
          <motion.div {...fadeUp} transition={{ duration: 0.45 }} className="relative z-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-rs-accent">
              {BRAND.tagline}
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Track prices. Compare smarter.{" "}
              <span className="rs-gradient-text">Build better.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-[var(--muted)] sm:text-lg">
              RigScout helps beginners and enthusiasts find PC parts across retailers, watch
              price history, and assemble complete builds without overpaying.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app/discover" className="rs-btn-primary">
                <Search className="h-4 w-4" aria-hidden />
                Search PC parts
              </Link>
              <Link to="/app" className="rs-btn-secondary">
                Open dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="relative isolate flex items-center justify-center md:min-h-[22rem]"
          >
            {/* Soft cyan light spill from the rig — not a frame */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,194,255,0.22),transparent_68%)] blur-3xl"
              aria-hidden
            />
            {/* Ground contact shadow */}
            <div
              className="pointer-events-none absolute bottom-[6%] left-1/2 h-8 w-[55%] -translate-x-1/2 rounded-[100%] bg-black/50 blur-2xl"
              aria-hidden
            />
            <img
              src={`${pcHeroUrl}?v=cutout2`}
              alt="Custom gaming PC with cyan LED lighting"
              className="relative z-10 w-full max-w-lg object-contain drop-shadow-[0_28px_50px_rgba(0,0,0,0.55)] md:max-w-none md:scale-110"
            />
          </motion.div>
        </div>
      </section>

      <section className="border-y border-[var(--card-border)] bg-[var(--card)]/30 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          {[
            { icon: ChartLine, title: "Price history", body: "See 30/90/365-day highs and lows." },
            { icon: Bell, title: "Deal alerts", body: "Target prices with in-app notifications." },
            { icon: Layers, title: "Build Lab", body: "Track full rigs and estimated wattage." },
            { icon: ShieldCheck, title: "Compatibility", body: "Guidance for sockets, RAM, and PSU." },
          ].map((item) => (
            <div key={item.title} className="rs-card p-5">
              <item.icon className="mb-3 h-5 w-5 text-rs-accent" aria-hidden />
              <h2 className="font-display font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <h2 className="font-display text-3xl font-bold">How RigScout works</h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Three simple steps — designed for first-time builders and power users alike.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Discover parts",
              body: "Search CPUs, GPUs, and more across retailers with deal scores.",
            },
            {
              step: "02",
              title: "Build your rig",
              body: "Save components in Build Lab and see totals, gaps, and guidance.",
            },
            {
              step: "03",
              title: "Watch the market",
              body: "Set alerts and get notified when prices drop to your target.",
            },
          ].map((item) => (
            <li key={item.step} className="rs-card p-6">
              <span className="font-display text-sm font-bold text-rs-accent">{item.step}</span>
              <h3 className="mt-2 font-display text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <div className="rs-card grid gap-6 p-6 md:grid-cols-2 md:p-10">
          <div>
            <h2 className="font-display text-2xl font-bold">Built for beginners</h2>
            <p className="mt-3 text-[var(--muted)]">
              Learn what each component does, avoid overpriced prebuilts, and get clear
              compatibility guidance — labeled as guidance, not a guarantee.
            </p>
            <Link to="/app/learn" className="rs-btn-secondary mt-6">
              <Sparkles className="h-4 w-4" aria-hidden />
              Explore Learn guides
            </Link>
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Retailer coverage</h2>
            <p className="mt-3 text-[var(--muted)]">
              Compare listings from major retailers and marketplaces. Demo data is clearly
              labeled until live retailer credentials are configured.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              {["Amazon", "Newegg", "Best Buy", "Micro Center", "B&H"].map((name) => (
                <span key={name} className="rounded-lg border border-[var(--card-border)] px-3 py-1.5">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <h2 className="font-display text-3xl font-bold">Pricing</h2>
        <p className="mt-2 text-[var(--muted)]">Billing is prepared but not activated yet.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rs-card p-6">
            <h3 className="font-display text-xl font-semibold">Free</h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Limited saved builds</li>
              <li>Limited tracked products</li>
              <li>Basic price history</li>
              <li>Basic alerts</li>
            </ul>
          </div>
          <div className="rs-card border-rs-primary/40 p-6">
            <h3 className="font-display text-xl font-semibold">
              Scout Pro <span className="rs-gradient-text">Coming soon</span>
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <li>Multiple builds & more tracked products</li>
              <li>Advanced history & analytics</li>
              <li>Faster alerts</li>
              <li>More marketplace tracking</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-6xl px-4 pb-20 lg:px-6">
        <h2 className="font-display text-3xl font-bold">FAQ</h2>
        <dl className="mt-6 space-y-4">
          {[
            {
              q: "Is RigScout free?",
              a: "Yes — Free tier covers core tracking. Scout Pro entitlements are coded but billing is not live.",
            },
            {
              q: "Are prices live?",
              a: "Phase 1 ships with mock/demo retailer data. Live sources activate when credentials are available.",
            },
            {
              q: "Does compatibility guarantee a working build?",
              a: "No. Compatibility checks are guidance based on available specs — always verify before purchase.",
            },
          ].map((item) => (
            <div key={item.q} className="rs-card p-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-2 text-sm text-[var(--muted)]">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="border-t border-[var(--card-border)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <Logo variant="wordmark" to="/" />
          <p>{BRAND.motto}</p>
          <p>
            © {new Date().getFullYear()}{" "}
            <a href={BRAND.siteUrl} className="hover:text-[var(--fg)]">
              {BRAND.domain}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

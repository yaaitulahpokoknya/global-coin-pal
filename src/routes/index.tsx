import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, Globe2, Shield, Sparkles, Wallet, Zap, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "NusaWallet — Borderless multi-currency wallet for SEA" },
      { name: "description", content: "Hold IDR, USD, SGD and MYR in one wallet. AI-powered FX recommendations and real-time fraud detection." },
    ],
  }),
});

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* decorative grid + glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-accent/25 blur-[120px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/auth">
            <Button variant="glass" size="sm">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero" size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-12 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent pulse-dot" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              <span className="text-muted-foreground">AI-powered cross-border payments — live</span>
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              One wallet.<br />
              <span className="text-gradient-bicolor">Every currency</span> in SEA.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Hold IDR, USD, SGD and MYR. Send across borders in seconds.
              Smart FX tells you when to convert. Real-time fraud protection
              keeps you safe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Open your wallet <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth" search={{ demo: true } as never}>
                <Button variant="glass" size="xl">View demo</Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat icon={<Globe2 className="h-4 w-4" />} value="4" label="Currencies" />
              <Stat icon={<Zap className="h-4 w-4" />} value="<1s" label="Settlement" />
              <Stat icon={<Shield className="h-4 w-4" />} value="Real-time" label="Fraud check" />
            </div>
          </div>

          {/* Preview card */}
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 bg-gradient-bicolor opacity-25 blur-3xl rounded-full" />
            <div className="relative glass shadow-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total balance</div>
                  <div className="font-display text-3xl font-semibold mt-1">$ 4,287.50</div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="h-3 w-3" /> +2.4% this week
                  </div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow-blue">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { c: "IDR", v: "Rp 2,500,000", flag: "🇮🇩", accent: "primary" },
                  { c: "USD", v: "$ 1,420.00", flag: "🇺🇸", accent: "accent" },
                  { c: "SGD", v: "S$ 320.00", flag: "🇸🇬", accent: "primary" },
                  { c: "MYR", v: "RM 180.00", flag: "🇲🇾", accent: "accent" },
                ].map((w) => (
                  <div key={w.c} className="rounded-2xl bg-gradient-card p-4 border border-border relative overflow-hidden">
                    <div aria-hidden className={`absolute -right-6 -top-6 h-16 w-16 rounded-full ${w.accent === "primary" ? "bg-primary/20" : "bg-accent/20"} blur-xl`} />
                    <div className="relative flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{w.flag}</span>{w.c}
                    </div>
                    <div className="relative mt-2 font-semibold">{w.v}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" /> Good time to buy USD
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Rate is 0.8% below the 7-day average.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature row */}
        <div className="mt-24 grid gap-4 md:grid-cols-3">
          <Feature
            color="primary"
            icon={<Globe2 className="h-5 w-5" />}
            title="Multi-currency wallet"
            desc="Hold and spend in IDR, USD, SGD, MYR with one balance view."
          />
          <Feature
            color="accent"
            icon={<Sparkles className="h-5 w-5" />}
            title="AI FX recommendations"
            desc="Moving-average analysis tells you when rates favor your conversion."
          />
          <Feature
            color="primary"
            icon={<Shield className="h-5 w-5" />}
            title="Real-time fraud guard"
            desc="Rule-based scoring on amount, velocity, geo, and recipient."
          />
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-primary">
        {icon}
        <span className="font-display text-xl font-semibold">{value}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function Feature({ color, icon, title, desc }: { color: "primary" | "accent"; icon: React.ReactNode; title: string; desc: string }) {
  const ring = color === "primary" ? "ring-glow-blue" : "ring-glow-red";
  const bg = color === "primary" ? "bg-gradient-primary" : "bg-gradient-accent";
  return (
    <div className="glass rounded-2xl p-6 shadow-card">
      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${ring} text-primary-foreground`}>
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

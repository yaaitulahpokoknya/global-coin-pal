import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe2, Shield, Sparkles, Wallet } from "lucide-react";

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
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-mint text-primary-foreground font-bold">N</div>
          <span className="font-display text-xl font-semibold">NusaWallet</span>
        </div>
        <Link to="/auth">
          <Button variant="glass" size="sm">Sign in</Button>
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-12 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              AI-powered cross-border payments
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              One wallet. <br />
              <span className="bg-gradient-mint bg-clip-text text-transparent">Every currency</span> in SEA.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Hold IDR, USD, SGD and MYR. Send money across borders in seconds.
              Smart FX tells you when to convert. Real-time fraud protection
              keeps you safe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button variant="hero" size="xl">
                  Open your wallet <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="glass" size="xl">View demo</Button>
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <Stat icon={<Globe2 className="h-4 w-4" />} value="4" label="Currencies" />
              <Stat icon={<Sparkles className="h-4 w-4" />} value="AI" label="FX engine" />
              <Stat icon={<Shield className="h-4 w-4" />} value="Real-time" label="Fraud check" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-10 bg-gradient-mint opacity-20 blur-3xl rounded-full" />
            <div className="relative glass shadow-card rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total balance</div>
                  <div className="font-display text-3xl font-semibold mt-1">$ 4,287.50</div>
                </div>
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { c: "IDR", v: "Rp 2,500,000", flag: "🇮🇩" },
                  { c: "USD", v: "$ 1,420.00", flag: "🇺🇸" },
                  { c: "SGD", v: "S$ 320.00", flag: "🇸🇬" },
                  { c: "MYR", v: "RM 180.00", flag: "🇲🇾" },
                ].map((w) => (
                  <div key={w.c} className="rounded-2xl bg-gradient-card p-4 border border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{w.flag}</span>{w.c}
                    </div>
                    <div className="mt-2 font-semibold">{w.v}</div>
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
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-primary">{icon}<span className="font-display text-xl font-semibold">{value}</span></div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

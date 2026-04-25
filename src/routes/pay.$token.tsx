import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CURRENCIES, CURRENCY_META, formatMoney, type Currency } from "@/lib/format";
import { CheckCircle2, Globe2, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pay/$token")({
  component: PayLink,
  head: ({ params }) => ({
    meta: [
      { title: `Pay request — NusaWallet` },
      { name: "description", content: `Send payment via NusaWallet link ${params.token}` },
    ],
  }),
});

function PayLink() {
  const { token } = Route.useParams();
  const [amount, setAmount] = useState("250");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [senderName, setSenderName] = useState("");
  const [paid, setPaid] = useState(false);

  // Decode mock recipient info from token (demo: deterministic per token)
  const recipient = useMemo(() => {
    const seed = token.slice(0, 6);
    const names = ["Sari Dewi", "Budi Santoso", "Tan Wei Ming", "Nor Aishah", "Rajesh K."];
    const countries = ["ID", "ID", "SG", "MY", "ID"];
    const idx = seed.charCodeAt(0) % names.length;
    return { name: names[idx], country: countries[idx], handle: `@${seed.toLowerCase()}` };
  }, [token]);

  const handlePay = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (!senderName.trim()) return toast.error("Enter your name");
    setPaid(true);
    toast.success(`Sent ${formatMoney(amt, currency)} to ${recipient.name}`);
  };

  if (paid) {
    return (
      <div className="min-h-screen relative">
        <div aria-hidden className="pointer-events-none fixed inset-0 grid-pattern opacity-30" />
        <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />
        <header className="relative mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
          <Logo />
          <Link to="/"><Button variant="glass" size="sm">Home</Button></Link>
        </header>
        <main className="relative mx-auto max-w-xl px-6 py-12">
          <div className="glass rounded-3xl p-8 text-center shadow-card">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Payment sent!</h1>
            <p className="mt-2 text-muted-foreground">
              {formatMoney(Number(amount), currency)} delivered to {recipient.name}
            </p>
            <div className="mt-6 rounded-2xl bg-secondary/40 p-4 text-left text-sm">
              <Row label="Reference" value={token.toUpperCase()} />
              <Row label="From" value={senderName} />
              <Row label="To" value={`${recipient.name} ${recipient.handle}`} />
              <Row label="Settlement" value="< 1 second" />
              <Row label="Recipient receives" value={formatMoney(Number(amount), currency)} highlight />
            </div>
            <Link to="/"><Button variant="hero" size="lg" className="mt-6">Back to NusaWallet</Button></Link>
          </div>
        </main>
        <Toaster theme="dark" richColors />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div aria-hidden className="pointer-events-none fixed inset-0 grid-pattern opacity-30" />
      <div aria-hidden className="pointer-events-none absolute -top-20 -left-20 h-[400px] w-[400px] rounded-full bg-primary/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute -top-10 right-0 h-[350px] w-[350px] rounded-full bg-accent/20 blur-[120px]" />

      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Logo />
        <Link to="/"><Button variant="glass" size="sm">Home</Button></Link>
      </header>

      <main className="relative mx-auto max-w-xl px-6 py-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs">
          <Globe2 className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Cross-border payment link · powered by NusaWallet</span>
        </div>

        <div className="glass rounded-3xl p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground font-display text-lg">
              {recipient.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold">{recipient.name}</h1>
              <div className="text-sm text-muted-foreground">
                {recipient.handle} · {CURRENCY_META[recipient.country === "SG" ? "SGD" : recipient.country === "MY" ? "MYR" : "IDR"].flag} {recipient.country}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm">
            <div className="flex items-center gap-2 text-primary font-medium">
              <ShieldCheck className="h-4 w-4" /> Verified merchant
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              KYC verified · joined NusaWallet 2026
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="amt">Amount</Label>
              <div className="mt-1.5 grid grid-cols-[1fr_140px] gap-2">
                <Input
                  id="amt"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="font-display text-lg"
                />
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>{CURRENCY_META[c].flag} {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2 flex gap-2">
                {["50", "100", "250", "500"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="rounded-lg border border-border bg-secondary/40 px-3 py-1 text-xs hover:bg-secondary"
                  >
                    {CURRENCY_META[currency].symbol}{v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="from">Your name</Label>
              <Input
                id="from"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="mt-1.5"
              />
            </div>

            <div className="rounded-2xl bg-secondary/40 p-4 text-sm space-y-1.5">
              <Row label="You pay" value={formatMoney(Number(amount) || 0, currency)} />
              <Row label="Network fee" value="$ 0.00" />
              <Row label="Recipient gets" value={formatMoney(Number(amount) || 0, currency)} highlight />
              <div className="pt-2 mt-2 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" /> Local-currency settlement — no USD spread
              </div>
            </div>
          </div>

          <Button variant="hero" size="lg" className="mt-6 w-full" onClick={handlePay}>
            Pay {formatMoney(Number(amount) || 0, currency)} <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            🛡 Screened by NusaWallet fraud engine in real time
          </p>
        </div>
      </main>
      <Toaster theme="dark" richColors />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-display text-base font-semibold" : ""}>{value}</span>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { CURRENCIES, CURRENCY_META, formatMoney, formatRelative, type Currency } from "@/lib/format";
import { convert, pairRate, recommend, type FxPoint } from "@/lib/fx";
import { evaluateFraud, type FraudResult } from "@/lib/fraud";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  LogOut,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Wallet — NusaWallet" },
      { name: "description", content: "Your multi-currency NusaWallet dashboard." },
    ],
  }),
});

type Wallet = { id: string; currency: Currency; balance: number };
type Tx = {
  id: string;
  type: "receive" | "send" | "convert" | "topup";
  status: "completed" | "pending" | "flagged" | "blocked";
  from_currency: string | null;
  to_currency: string | null;
  from_amount: number | null;
  to_amount: number | null;
  fx_rate: number | null;
  counterparty: string | null;
  country: string | null;
  note: string | null;
  fraud_reasons: string[] | null;
  created_at: string;
};

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [fxHistory, setFxHistory] = useState<Record<Currency, FxPoint[]>>({ IDR: [], USD: [], SGD: [], MYR: [] });
  const [loading, setLoading] = useState(true);

  // Send dialog state
  const [sendOpen, setSendOpen] = useState(false);
  const [sendFrom, setSendFrom] = useState<Currency>("USD");
  const [sendTo, setSendTo] = useState<Currency>("IDR");
  const [sendAmount, setSendAmount] = useState("");
  const [sendCountry, setSendCountry] = useState("ID");
  const [sendRecipient, setSendRecipient] = useState("");

  // Convert dialog
  const [convertOpen, setConvertOpen] = useState(false);
  const [convFrom, setConvFrom] = useState<Currency>("USD");
  const [convTo, setConvTo] = useState<Currency>("IDR");
  const [convAmount, setConvAmount] = useState("");

  // Fraud modal
  const [fraudResult, setFraudResult] = useState<(FraudResult & { pendingAction?: () => Promise<void> }) | null>(null);

  // Bootstrap
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(data.session.user.id);
    });
  }, [navigate]);

  const loadAll = useCallback(async (uid: string) => {
    const [{ data: profile }, { data: w }, { data: t }, { data: fx }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      supabase.from("wallets").select("id,currency,balance").eq("user_id", uid),
      supabase.from("transactions").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      supabase.from("fx_rates").select("quote,rate,recorded_at").order("recorded_at", { ascending: false }),
    ]);
    if (profile?.full_name) setFullName(profile.full_name);
    setWallets((w ?? []) as Wallet[]);
    setTxs((t ?? []) as Tx[]);

    const grouped: Record<Currency, FxPoint[]> = { IDR: [], USD: [{ recorded_at: new Date().toISOString(), rate: 1 }], SGD: [], MYR: [] };
    for (const row of fx ?? []) {
      const q = row.quote as Currency;
      if (q in grouped) grouped[q].push({ recorded_at: row.recorded_at, rate: Number(row.rate) });
    }
    setFxHistory(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) loadAll(userId);
  }, [userId, loadAll]);

  // Latest USD-based rates per currency (newest = first element)
  const ratesPerUsd = useMemo<Record<Currency, number>>(() => {
    return {
      USD: 1,
      IDR: fxHistory.IDR[0]?.rate ?? 15800,
      SGD: fxHistory.SGD[0]?.rate ?? 1.34,
      MYR: fxHistory.MYR[0]?.rate ?? 4.7,
    };
  }, [fxHistory]);

  const totalUsd = useMemo(() => {
    return wallets.reduce((sum, w) => sum + convert(Number(w.balance), w.currency, "USD", ratesPerUsd), 0);
  }, [wallets, ratesPerUsd]);

  const balanceOf = (c: Currency) => Number(wallets.find((w) => w.currency === c)?.balance ?? 0);

  const updateBalance = async (currency: Currency, delta: number) => {
    const w = wallets.find((x) => x.currency === currency);
    if (!w) return;
    const newBal = Number(w.balance) + delta;
    const { error } = await supabase.from("wallets").update({ balance: newBal }).eq("id", w.id);
    if (error) throw error;
  };

  // === Demo: Receive USD payment ===
  const handleReceiveDemo = async () => {
    if (!userId) return;
    const amount = 850;
    try {
      await updateBalance("USD", amount);
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "receive",
        status: "completed",
        to_currency: "USD",
        to_amount: amount,
        counterparty: "Acme Corp (San Francisco)",
        country: "US",
        note: "Invoice #INV-2041 payment",
      });
      if (error) throw error;
      toast.success(`Received ${formatMoney(amount, "USD")} from Acme Corp`);
      await loadAll(userId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  // === Convert ===
  const submitConvert = async () => {
    if (!userId) return;
    const amt = Number(convAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > balanceOf(convFrom)) return toast.error(`Insufficient ${convFrom} balance`);
    const rate = pairRate(convFrom, convTo, ratesPerUsd);
    const received = convert(amt, convFrom, convTo, ratesPerUsd);
    try {
      await updateBalance(convFrom, -amt);
      await updateBalance(convTo, received);
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "convert",
        status: "completed",
        from_currency: convFrom,
        to_currency: convTo,
        from_amount: amt,
        to_amount: received,
        fx_rate: rate,
        note: `Converted ${convFrom} → ${convTo}`,
      });
      if (error) throw error;
      toast.success(`Converted to ${formatMoney(received, convTo)}`);
      setConvertOpen(false);
      setConvAmount("");
      await loadAll(userId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  // === Send (with fraud check) ===
  const submitSend = async () => {
    if (!userId) return;
    const amt = Number(sendAmount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > balanceOf(sendFrom)) return toast.error(`Insufficient ${sendFrom} balance`);
    if (!sendRecipient.trim()) return toast.error("Enter recipient name");

    const result = evaluateFraud({
      amount: amt,
      currency: sendFrom,
      country: sendCountry,
      counterparty: sendRecipient,
      recentTx: txs.filter((t) => t.type === "send"),
      ratesPerUsd,
    });

    const execute = async () => {
      const rate = pairRate(sendFrom, sendTo, ratesPerUsd);
      const received = convert(amt, sendFrom, sendTo, ratesPerUsd);
      await updateBalance(sendFrom, -amt);
      const { error } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "send",
        status: result.shouldBlock ? "blocked" : result.level === "medium" ? "flagged" : "completed",
        from_currency: sendFrom,
        to_currency: sendTo,
        from_amount: amt,
        to_amount: received,
        fx_rate: rate,
        counterparty: sendRecipient,
        country: sendCountry,
        note: `Cross-border send to ${sendCountry}`,
        fraud_reasons: result.reasons.length ? result.reasons : null,
      });
      if (error) throw error;
    };

    if (result.level === "low") {
      try {
        await execute();
        toast.success(`Sent ${formatMoney(amt, sendFrom)} to ${sendRecipient}`);
        setSendOpen(false);
        setSendAmount("");
        setSendRecipient("");
        await loadAll(userId);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed");
      }
      return;
    }

    // Show fraud modal
    setFraudResult({
      ...result,
      pendingAction: result.shouldBlock
        ? undefined
        : async () => {
            try {
              await execute();
              toast.success(`Sent ${formatMoney(amt, sendFrom)} (flagged for review)`);
              setSendOpen(false);
              setSendAmount("");
              setSendRecipient("");
              await loadAll(userId);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          },
    });
  };

  // Demo trigger: prefill a fraudy send
  const triggerFraudDemo = () => {
    setSendFrom("USD");
    setSendTo("IDR");
    setSendAmount("6000");
    setSendCountry("NG");
    setSendRecipient("Unknown recipient");
    setSendOpen(true);
  };

  const recommendation = useMemo(() => {
    // Recommend USD by default (most relevant for IDR-based user)
    return recommend("USD", fxHistory.IDR.map((p) => ({ recorded_at: p.recorded_at, rate: 1 / p.rate })));
  }, [fxHistory]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading your wallet…</div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div aria-hidden className="pointer-events-none fixed inset-0 grid-pattern opacity-30" />
      <Toaster theme="dark" richColors />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">Hi, <span className="text-foreground font-medium">{fullName || "there"}</span></span>
          <Button variant="glass" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign out</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {/* Total + actions */}
        <section className="glass rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total balance · USD</div>
              <div className="font-display text-4xl md:text-5xl font-semibold mt-2 text-gradient-bicolor">
                {formatMoney(totalUsd, "USD")}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">Across {wallets.length} currencies</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" size="lg" onClick={handleReceiveDemo}>
                <ArrowDownLeft className="h-4 w-4" /> Receive
              </Button>
              <Button variant="glass" size="lg" onClick={() => setConvertOpen(true)}>
                <ArrowRightLeft className="h-4 w-4" /> Convert
              </Button>
              <Button variant="accent" size="lg" onClick={() => setSendOpen(true)}>
                <ArrowUpRight className="h-4 w-4" /> Send
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CURRENCIES.map((c) => {
              const meta = CURRENCY_META[c];
              const bal = balanceOf(c);
              return (
                <div key={c} className="rounded-2xl bg-gradient-card p-4 border border-border">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-2"><span className="text-base">{meta.flag}</span>{c}</span>
                    <span className="text-xs">{meta.name}</span>
                  </div>
                  <div className="mt-3 font-display text-xl font-semibold">{formatMoney(bal, c)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ≈ {formatMoney(convert(bal, c, "USD", ratesPerUsd), "USD")}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* FX Recommendation + Fraud */}
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="glass rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> AI FX Recommendation
              </h2>
              <span className={`text-xs rounded-full px-2 py-1 font-medium ${
                recommendation.signal === "buy" ? "bg-success/15 text-success" :
                recommendation.signal === "wait" ? "bg-warning/15 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                {recommendation.signal.toUpperCase()}
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-semibold">{recommendation.headline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.detail}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {(["USD", "SGD", "MYR"] as Currency[]).map((c) => {
                const points = c === "USD"
                  ? fxHistory.IDR.map((p) => ({ recorded_at: p.recorded_at, rate: 1 / p.rate }))
                  : fxHistory[c].map((p) => ({ recorded_at: p.recorded_at, rate: ratesPerUsd.IDR / p.rate }));
                const r = recommend(c, points);
                return (
                  <div key={c} className="rounded-xl bg-secondary/40 border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c}/IDR</span>
                      <span className={r.changePct < 0 ? "text-success" : r.changePct > 0 ? "text-warning" : "text-muted-foreground"}>
                        {r.changePct > 0 ? "+" : ""}{r.changePct.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-1 text-muted-foreground">vs 7d avg</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-3xl p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Fraud Protection
              </h2>
              <span className="text-xs text-success bg-success/15 rounded-full px-2 py-1 font-medium">ACTIVE</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Every transaction is screened in real time using rule-based detection
              (amount, velocity, destination risk, recipient pattern).
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Large amount detection</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> High-risk country block</div>
              <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success" /> Velocity throttling</div>
            </div>
            <Button variant="glass" size="sm" className="mt-5" onClick={triggerFraudDemo}>
              <ShieldAlert className="h-4 w-4" /> Trigger fraud demo
            </Button>
          </div>
        </section>

        {/* Transactions */}
        <section className="mt-6 glass rounded-3xl p-6 shadow-card">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <div className="mt-4 divide-y divide-border">
            {txs.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No transactions yet — try the Receive demo.</div>
            )}
            {txs.map((t) => <TxRow key={t.id} t={t} />)}
          </div>
        </section>
      </main>

      {/* Convert dialog */}
      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Convert currency</DialogTitle>
            <DialogDescription>Instant conversion at live mid-market rate.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <CurrencySelect value={convFrom} onChange={setConvFrom} />
              </div>
              <div>
                <Label>To</Label>
                <CurrencySelect value={convTo} onChange={setConvTo} />
              </div>
            </div>
            <div>
              <Label htmlFor="convAmt">Amount ({convFrom})</Label>
              <Input id="convAmt" type="number" value={convAmount} onChange={(e) => setConvAmount(e.target.value)} className="mt-1.5" placeholder="0.00" />
              <div className="mt-1 text-xs text-muted-foreground">Available: {formatMoney(balanceOf(convFrom), convFrom)}</div>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate</span>
                <span>1 {convFrom} = {pairRate(convFrom, convTo, ratesPerUsd).toFixed(4)} {convTo}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">You receive</span>
                <span className="font-semibold">{formatMoney(convert(Number(convAmount) || 0, convFrom, convTo, ratesPerUsd), convTo)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={submitConvert}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Send money abroad</DialogTitle>
            <DialogDescription>Cross-border transfer with live FX and fraud screening.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recipient name</Label>
              <Input value={sendRecipient} onChange={(e) => setSendRecipient(e.target.value)} placeholder="e.g. Lim Wei" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>From</Label>
                <CurrencySelect value={sendFrom} onChange={setSendFrom} />
              </div>
              <div>
                <Label>To</Label>
                <CurrencySelect value={sendTo} onChange={setSendTo} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sendAmt">Amount ({sendFrom})</Label>
                <Input id="sendAmt" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="mt-1.5" placeholder="0.00" />
              </div>
              <div>
                <Label>Destination country</Label>
                <Select value={sendCountry} onValueChange={setSendCountry}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ID">🇮🇩 Indonesia</SelectItem>
                    <SelectItem value="SG">🇸🇬 Singapore</SelectItem>
                    <SelectItem value="MY">🇲🇾 Malaysia</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                    <SelectItem value="NG">🇳🇬 Nigeria (high risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-xl bg-secondary/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient gets</span>
                <span className="font-semibold">{formatMoney(convert(Number(sendAmount) || 0, sendFrom, sendTo, ratesPerUsd), sendTo)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={submitSend}>Review &amp; send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fraud modal */}
      <Dialog open={!!fraudResult} onOpenChange={(o) => !o && setFraudResult(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${fraudResult?.shouldBlock ? "text-destructive" : "text-warning"}`} />
              {fraudResult?.shouldBlock ? "Transaction blocked" : "Suspicious activity detected"}
            </DialogTitle>
            <DialogDescription>
              Risk score: <span className="font-semibold text-foreground">{fraudResult?.riskScore}/100</span> ({fraudResult?.level})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {fraudResult?.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>{r}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            {fraudResult?.shouldBlock ? (
              <Button variant="hero" onClick={() => setFraudResult(null)}>Got it</Button>
            ) : (
              <>
                <Button variant="glass" onClick={() => setFraudResult(null)}>Cancel</Button>
                <Button variant="hero" onClick={async () => { await fraudResult?.pendingAction?.(); setFraudResult(null); }}>
                  Approve anyway
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CurrencySelect({ value, onChange }: { value: Currency; onChange: (c: Currency) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Currency)}>
      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c} value={c}>{CURRENCY_META[c].flag} {c} — {CURRENCY_META[c].name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TxRow({ t }: { t: Tx }) {
  const isOut = t.type === "send";
  const isIn = t.type === "receive";
  const isConv = t.type === "convert";
  const Icon = isOut ? ArrowUpRight : isIn ? ArrowDownLeft : ArrowRightLeft;
  const color = t.status === "blocked" ? "text-destructive" : t.status === "flagged" ? "text-warning" : isIn ? "text-success" : "text-foreground";

  const title =
    isIn ? `Received from ${t.counterparty ?? "—"}` :
    isOut ? `Sent to ${t.counterparty ?? "—"}${t.country ? ` (${t.country})` : ""}` :
    isConv ? `Converted ${t.from_currency} → ${t.to_currency}` :
    "Top up";

  const amountStr =
    isIn ? `+ ${formatMoney(Number(t.to_amount), t.to_currency as Currency)}` :
    isOut ? `- ${formatMoney(Number(t.from_amount), t.from_currency as Currency)}` :
    `${formatMoney(Number(t.from_amount), t.from_currency as Currency)} → ${formatMoney(Number(t.to_amount), t.to_currency as Currency)}`;

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" /> {formatRelative(t.created_at)}
            {t.status !== "completed" && (
              <span className={`ml-1 rounded-full px-1.5 py-0.5 ${
                t.status === "blocked" ? "bg-destructive/15 text-destructive" :
                t.status === "flagged" ? "bg-warning/15 text-warning" :
                "bg-muted text-muted-foreground"
              }`}>
                {t.status}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className={`font-semibold whitespace-nowrap ${color}`}>{amountStr}</div>
    </div>
  );
}

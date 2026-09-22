import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  CalendarDays, Users, TrendingUp, Wallet, AlertTriangle, Receipt,
  FileBarChart, PieChart as PieIcon, Receipt as ReceiptIcon, UserCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/invitation";
import { Button } from "@/components/ui/button";
import { formatMoney, paymentStatusClasses, paymentStatusLabel } from "@/lib/money";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import DateRangeFilter, { type DateRange, type RangePreset, rangeFromPreset } from "@/components/admin/DateRangeFilter";

type EventRow = {
  id: string; slug: string; title: string;
  event_date: string | null; venue: string | null; template: string;
  price_total: number; paid_amount: number;
  price_currency: string; payment_status: string;
  created_at: string;
};

type Payment = { id: string; event_id: string; amount: number; currency: string; paid_at: string };

type CurrencyTotals = { total: number; paid: number; outstanding: number; events: number };

export default function Dashboard() {
  const [allEvents, setAllEvents] = useState<EventRow[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Default to weekly report on the dashboard
  const [preset, setPreset] = useState<RangePreset>("this_week");
  const [customRange, setCustomRange] = useState<DateRange>(null);
  const range = useMemo(() => rangeFromPreset(preset, customRange), [preset, customRange]);

  useEffect(() => {
    (async () => {
      const [evRes, payRes, customersRes] = await Promise.all([
        supabase.from("events")
          .select("id, slug, title, event_date, venue, template, price_total, paid_amount, price_currency, payment_status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("event_payments").select("id, event_id, amount, currency, paid_at"),
        supabase.from("event_customers").select("user_id"),
      ]);
      setAllEvents((evRes.data ?? []) as EventRow[]);
      setAllPayments((payRes.data ?? []) as Payment[]);
      setCustomerCount(new Set((customersRes.data ?? []).map((c: any) => c.user_id)).size);
      setLoading(false);
    })();
  }, []);

  // Filter events by created_at and payments by paid_at within selected range.
  const events = useMemo(() => {
    if (!range) return allEvents;
    return allEvents.filter((e) => {
      const d = new Date(e.created_at);
      return d >= range.from && d <= range.to;
    });
  }, [allEvents, range]);

  const payments = useMemo(() => {
    if (!range) return allPayments;
    return allPayments.filter((p) => {
      const d = new Date(p.paid_at);
      return d >= range.from && d <= range.to;
    });
  }, [allPayments, range]);

  const totalsByCurrency = useMemo(() => {
    const acc: Record<string, CurrencyTotals> = {};
    for (const e of events) {
      const cur = e.price_currency || "USD";
      acc[cur] ??= { total: 0, paid: 0, outstanding: 0, events: 0 };
      acc[cur].total += Number(e.price_total) || 0;
      acc[cur].paid += Number(e.paid_amount) || 0;
      acc[cur].outstanding += Math.max((Number(e.price_total) || 0) - (Number(e.paid_amount) || 0), 0);
      acc[cur].events += 1;
    }
    return acc;
  }, [events]);

  const statusCounts = useMemo(() => {
    const c = { paid: 0, partial: 0, unpaid: 0 };
    for (const e of events) {
      const s = (e.payment_status || "unpaid") as keyof typeof c;
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [events]);

  // Payments collected within the selected range (by currency).
  const rangePaid = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of payments) {
      const cur = (p.currency || "USD").toUpperCase();
      acc[cur] = (acc[cur] ?? 0) + (Number(p.amount) || 0);
    }
    return acc;
  }, [payments]);

  const rangeLabel =
    preset === "today" ? "Today"
    : preset === "this_week" ? "This week"
    : preset === "this_month" ? "This month"
    : preset === "past_month" ? "Past month"
    : preset === "this_year" ? "This year"
    : preset === "custom" ? "Selected range"
    : "All time";

  // 12-month payments chart.
  const monthly = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; usd: number; khr: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        usd: 0, khr: 0,
      });
    }
    const idx = Object.fromEntries(months.map((m, i) => [m.key, i]));
    for (const p of payments) {
      const d = new Date(p.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const i = idx[key];
      if (i == null) continue;
      const cur = (p.currency || "USD").toUpperCase();
      if (cur === "KHR") months[i].khr += Number(p.amount) || 0;
      else months[i].usd += Number(p.amount) || 0;
    }
    return months;
  }, [payments]);

  const recent = events.slice(0, 5);

  // Top KPI cards — focused on sales metrics.
  const totalEvents = events.length;
  const totalOutstanding = Object.values(totalsByCurrency).reduce((s, t) => s + t.outstanding, 0);
  const paidRate = totalEvents === 0 ? 0 : Math.round((statusCounts.paid / totalEvents) * 100);

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Sales performance across all events</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <Link to="/admin/reports">
              <Button variant="outline"><FileBarChart className="h-4 w-4 mr-2" /> Sales report</Button>
            </Link>
            <Link to="/admin/events">
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">Manage events</Button>
            </Link>
          </div>
        </div>

        {/* Top KPIs (sales focused) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Events" value={loading ? "—" : String(totalEvents)} icon={CalendarDays} hint={rangeLabel} />
          <KpiCard label="Customers" value={loading ? "—" : String(customerCount)} icon={Users} hint="All time" />
          <KpiCard label="Paid events" value={loading ? "—" : `${paidRate}%`} icon={PieIcon} hint={`${statusCounts.paid} of ${totalEvents}`} />
          <KpiCard
            label={rangeLabel}
            value={loading ? "—" : (Object.entries(rangePaid).map(([c, v]) => formatMoney(v, c)).join(" · ") || formatMoney(0, "USD"))}
            icon={Wallet}
            hint="Payments collected"
          />
        </div>

        {/* Sales totals per currency */}
        <div>
          <h2 className="font-serif text-xl mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gold" /> Sales totals
          </h2>
          {Object.keys(totalsByCurrency).length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border bg-card text-sm text-muted-foreground">
              No billing data yet. Add invoice items to an event to start tracking sales.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(totalsByCurrency).map(([cur, t]) => (
                <div key={cur} className="p-5 rounded-xl border border-border bg-gradient-surface shadow-soft">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">{cur} · {t.events} events</span>
                    <TrendingUp className="h-4 w-4 text-gold" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SmallStat icon={TrendingUp} label="Billed" value={formatMoney(t.total, cur)} />
                    <SmallStat icon={Wallet} label="Paid" value={formatMoney(t.paid, cur)} />
                    <SmallStat icon={AlertTriangle} label="Outstanding" value={formatMoney(t.outstanding, cur)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatusCard label="Paid" count={statusCounts.paid} status="paid" />
          <StatusCard label="Partial" count={statusCounts.partial} status="partial" />
          <StatusCard label="Unpaid" count={statusCounts.unpaid} status="unpaid" />
        </div>

        {/* Monthly payments chart */}
        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-xl">Payments — last 12 months</h2>
          </header>
          <div className="p-5">
            <ChartContainer
              className="w-full h-64"
              config={{
                usd: { label: "USD", color: "hsl(var(--gold))" },
                khr: { label: "KHR", color: "hsl(var(--primary))" },
              }}
            >
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="usd" fill="var(--color-usd)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="khr" fill="var(--color-khr)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </section>

        {/* Recent events */}
        <div className="rounded-xl border border-border bg-card shadow-soft">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl">Recent events</h2>
            <Link to="/admin/events" className="text-xs text-gold uppercase tracking-widest">View all →</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : recent.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No events yet.</p>
              <Link to="/admin/events">
                <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90">Create your first event</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map(e => (
                <li key={e.id} className="flex items-center justify-between gap-3 p-5 hover:bg-secondary/40 transition-smooth">
                  <Link to={`/admin/events/${e.id}`} className="min-w-0 flex-1">
                    <div className="font-serif text-lg truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">/{e.slug} · {e.venue ?? "No venue"} · {formatDateTime(e.event_date)}</div>
                  </Link>
                  <div className="text-right shrink-0">
                    <div className="font-serif text-base text-gradient-gold tabular-nums">{formatMoney(e.price_total, e.price_currency)}</div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${paymentStatusClasses(e.payment_status)}`}>
                      {paymentStatusLabel(e.payment_status)}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
                    <Link to={`/admin/events/${e.id}?tab=billing`}>
                      <Button size="sm" variant="outline" title="Open Billing">
                        <ReceiptIcon className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden md:inline">Billing</span>
                      </Button>
                    </Link>
                    <Link to={`/admin/events/${e.id}?tab=guests`}>
                      <Button size="sm" variant="outline" title="Open Guests & RSVPs">
                        <UserCheck className="h-3.5 w-3.5 sm:mr-1.5" />
                        <span className="hidden md:inline">Guests</span>
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function KpiCard({ label, value, icon: Icon, hint }: { label: string; value: string; icon: any; hint?: string }) {
  return (
    <div className="p-5 rounded-xl border border-border bg-gradient-surface shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-gold" />
      </div>
      <div className="font-serif text-2xl text-gradient-gold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function SmallStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-serif text-lg text-gradient-gold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function StatusCard({ label, count, status }: { label: string; count: number; status: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-block ${paymentStatusClasses(status)}`}>{label}</span>
      <div className="font-serif text-2xl mt-2 tabular-nums">{count}</div>
      <div className="text-xs text-muted-foreground">events</div>
    </div>
  );
}

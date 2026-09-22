import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, Wallet, AlertTriangle, CalendarDays } from "lucide-react";
import { formatMoney, paymentStatusClasses, paymentStatusLabel } from "@/lib/money";
import { Link } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import ListToolbar from "@/components/admin/ListToolbar";
import DateRangeFilter, { rangeFromPreset, type DateRange, type RangePreset } from "@/components/admin/DateRangeFilter";

type EventRow = {
  id: string; slug: string; title: string;
  event_date: string | null;
  price_total: number; paid_amount: number;
  price_currency: string; payment_status: string;
};

type Payment = { id: string; event_id: string; amount: number; currency: string; paid_at: string };
type Customer = { event_id: string; user_id: string };
type Profile = { user_id: string; display_name: string | null; email: string | null };

export default function Reports() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");

  // Date-range filter for the payments dashboard (chart + per-currency totals).
  const [datePreset, setDatePreset] = useState<RangePreset>("this_month");
  const [customRange, setCustomRange] = useState<DateRange>(null);
  const range = useMemo(() => rangeFromPreset(datePreset, customRange), [datePreset, customRange]);

  // Payments filtered by the selected date range. `null` range = all time.
  const filteredPayments = useMemo(() => {
    if (!range) return payments;
    const from = +range.from;
    const to = +range.to;
    return payments.filter(p => {
      const t = +new Date(p.paid_at);
      return t >= from && t <= to;
    });
  }, [payments, range]);

  const rangeLabel = useMemo(() => {
    const map: Record<RangePreset, string> = {
      today: "Today",
      this_week: "This week",
      this_month: "This month",
      past_month: "Past month",
      this_year: "This year",
      all: "All time",
      custom: "Custom range",
    };
    return map[datePreset];
  }, [datePreset]);

  useEffect(() => {
    (async () => {
      const [evRes, payRes, ecRes] = await Promise.all([
        supabase.from("events").select("id, slug, title, event_date, price_total, paid_amount, price_currency, payment_status").order("event_date", { ascending: false, nullsFirst: false }),
        supabase.from("event_payments").select("id, event_id, amount, currency, paid_at"),
        supabase.from("event_customers").select("event_id, user_id"),
      ]);
      const evs = (evRes.data ?? []) as EventRow[];
      const pays = (payRes.data ?? []) as Payment[];
      const ecs = (ecRes.data ?? []) as Customer[];

      const userIds = Array.from(new Set(ecs.map(c => c.user_id)));
      const profilesRes = userIds.length
        ? await supabase.from("profiles").select("user_id, display_name, email").in("user_id", userIds)
        : { data: [] as Profile[] };
      const byUser = Object.fromEntries(((profilesRes.data ?? []) as Profile[]).map(p => [p.user_id, p.display_name || p.email || "—"]));
      const byEvent: Record<string, string> = {};
      for (const c of ecs) {
        const name = byUser[c.user_id];
        if (!name) continue;
        byEvent[c.event_id] = byEvent[c.event_id] ? `${byEvent[c.event_id]}, ${name}` : name;
      }
      setEvents(evs);
      setPayments(pays);
      setCustomerMap(byEvent);
      setLoading(false);
    })();
  }, []);

  // Aggregate totals by currency. Billed/outstanding always reflect lifetime
  // event totals, while "paid" is constrained to the selected date range so
  // the dashboard answers "how much did I collect this week/month/year?".
  const totalsByCurrency = useMemo(() => {
    const acc: Record<string, { total: number; paid: number; outstanding: number; events: number }> = {};
    for (const e of events) {
      const cur = e.price_currency || "USD";
      acc[cur] ??= { total: 0, paid: 0, outstanding: 0, events: 0 };
      acc[cur].total += Number(e.price_total) || 0;
      acc[cur].outstanding += Math.max((Number(e.price_total) || 0) - (Number(e.paid_amount) || 0), 0);
      acc[cur].events += 1;
    }
    for (const p of filteredPayments) {
      const cur = (p.currency || "USD").toUpperCase();
      acc[cur] ??= { total: 0, paid: 0, outstanding: 0, events: 0 };
      acc[cur].paid += Number(p.amount) || 0;
    }
    return acc;
  }, [events, filteredPayments]);

  // Time-series buckets for the chart. Bucket size adapts to the selected
  // range: day for ≤31 days, week for ≤120 days, month otherwise.
  const series = useMemo(() => {
    const now = new Date();
    let from: Date;
    let to: Date;
    if (range) {
      from = new Date(range.from);
      to = new Date(range.to);
    } else {
      // All-time → fall back to last 12 months.
      to = now;
      from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    }

    const days = Math.max(1, Math.ceil((+to - +from) / 86_400_000));
    const granularity: "day" | "week" | "month" =
      days <= 31 ? "day" : days <= 120 ? "week" : "month";

    const buckets: { key: string; label: string; usd: number; khr: number }[] = [];
    const idx: Record<string, number> = {};

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const startOfWeek = (d: Date) => {
      const x = startOfDay(d);
      x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
      return x;
    };
    const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

    let cursor = granularity === "day" ? startOfDay(from)
      : granularity === "week" ? startOfWeek(from)
      : startOfMonth(from);
    const end = to;
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const label =
        granularity === "month"
          ? cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
          : cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      idx[key] = buckets.length;
      buckets.push({ key, label, usd: 0, khr: 0 });
      const next = new Date(cursor);
      if (granularity === "day") next.setDate(cursor.getDate() + 1);
      else if (granularity === "week") next.setDate(cursor.getDate() + 7);
      else next.setMonth(cursor.getMonth() + 1);
      cursor = next;
    }

    for (const p of filteredPayments) {
      const d = new Date(p.paid_at);
      const bucketStart =
        granularity === "day" ? startOfDay(d)
        : granularity === "week" ? startOfWeek(d)
        : startOfMonth(d);
      const key = bucketStart.toISOString().slice(0, 10);
      const i = idx[key];
      if (i == null) continue;
      const cur = (p.currency || "USD").toUpperCase();
      if (cur === "KHR") buckets[i].khr += Number(p.amount) || 0;
      else buckets[i].usd += Number(p.amount) || 0;
    }
    return { buckets, granularity };
  }, [filteredPayments, range]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const arr = events.filter(e => {
      if (statusFilter !== "all" && (e.payment_status || "unpaid") !== statusFilter) return false;
      if (currencyFilter !== "all" && (e.price_currency || "USD") !== currencyFilter) return false;
      if (!q) return true;
      return [e.title, e.slug, customerMap[e.id] ?? ""].join(" ").toLowerCase().includes(q);
    });
    const cmp: Record<string, (a: EventRow, b: EventRow) => number> = {
      date_desc: (a, b) => (b.event_date ? +new Date(b.event_date) : 0) - (a.event_date ? +new Date(a.event_date) : 0),
      date_asc: (a, b) => (a.event_date ? +new Date(a.event_date) : Infinity) - (b.event_date ? +new Date(b.event_date) : Infinity),
      title_asc: (a, b) => a.title.localeCompare(b.title),
      title_desc: (a, b) => b.title.localeCompare(a.title),
      total_desc: (a, b) => Number(b.price_total) - Number(a.price_total),
      total_asc: (a, b) => Number(a.price_total) - Number(b.price_total),
      outstanding_desc: (a, b) =>
        Math.max(Number(b.price_total) - Number(b.paid_amount), 0) -
        Math.max(Number(a.price_total) - Number(a.paid_amount), 0),
      paid_desc: (a, b) => Number(b.paid_amount) - Number(a.paid_amount),
    };
    return [...arr].sort(cmp[sortBy] ?? cmp.date_desc);
  }, [events, customerMap, search, statusFilter, currencyFilter, sortBy]);

  const downloadCSV = () => {
    const headers = ["Title", "Slug", "Event date", "Customer(s)", "Currency", "Total", "Paid", "Outstanding", "Status"];
    const rows = filteredEvents.map(e => {
      const outstanding = Math.max((Number(e.price_total) || 0) - (Number(e.paid_amount) || 0), 0);
      return [
        csvCell(e.title),
        csvCell(e.slug),
        e.event_date ? new Date(e.event_date).toISOString().slice(0, 10) : "",
        csvCell(customerMap[e.id] || ""),
        e.price_currency,
        Number(e.price_total).toFixed(2),
        Number(e.paid_amount).toFixed(2),
        outstanding.toFixed(2),
        paymentStatusLabel(e.payment_status),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl">Sales report</h1>
            <p className="text-sm text-muted-foreground mt-1">Revenue, payments, and outstanding balances across all events.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              preset={datePreset}
              onPresetChange={setDatePreset}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            <Button onClick={downloadCSV} className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              <Download className="h-4 w-4 mr-2" /> Download CSV
            </Button>
          </div>
        </div>

        {/* Per-currency totals */}
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(totalsByCurrency).length === 0 ? (
            <div className="p-6 rounded-xl border border-border bg-card text-sm text-muted-foreground">No billing data yet.</div>
          ) : (
            Object.entries(totalsByCurrency).map(([cur, t]) => (
              <div key={cur} className="p-5 rounded-xl border border-border bg-gradient-surface shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{cur} totals · {t.events} events</span>
                  <TrendingUp className="h-4 w-4 text-gold" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <Stat icon={TrendingUp} label="Billed" value={formatMoney(t.total, cur)} />
                  <Stat icon={Wallet} label={`Paid · ${rangeLabel}`} value={formatMoney(t.paid, cur)} />
                  <Stat icon={AlertTriangle} label="Outstanding" value={formatMoney(t.outstanding, cur)} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payments chart */}
        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-xl">Payments — {rangeLabel.toLowerCase()}</h2>
          </header>
          <div className="p-5">
            <ChartContainer
              className="w-full h-64"
              config={{
                usd: { label: "USD", color: "hsl(var(--gold))" },
                khr: { label: "KHR", color: "hsl(var(--primary))" },
              }}
            >
              <BarChart data={series.buckets}>
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

        {/* Events table */}
        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <header className="p-5 border-b border-border">
            <h2 className="font-serif text-xl">All events</h2>
          </header>
          <div className="p-5 pb-0">
            <ListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search title, slug, customer…"
              filter={{
                value: statusFilter, onChange: setStatusFilter,
                label: "Payment",
                options: [
                  { value: "all", label: "All payments" },
                  { value: "paid", label: "Paid" },
                  { value: "partial", label: "Partial" },
                  { value: "unpaid", label: "Unpaid" },
                ],
              }}
              filter2={{
                value: currencyFilter, onChange: setCurrencyFilter,
                label: "Currency",
                options: [
                  { value: "all", label: "All currencies" },
                  { value: "USD", label: "USD" },
                  { value: "KHR", label: "KHR" },
                ],
              }}
              sort={{
                value: sortBy, onChange: setSortBy,
                options: [
                  { value: "date_desc", label: "Event date ↓" },
                  { value: "date_asc", label: "Event date ↑" },
                  { value: "title_asc", label: "Title A→Z" },
                  { value: "title_desc", label: "Title Z→A" },
                  { value: "total_desc", label: "Total ↓" },
                  { value: "total_asc", label: "Total ↑" },
                  { value: "paid_desc", label: "Paid ↓" },
                  { value: "outstanding_desc", label: "Outstanding ↓" },
                ],
              }}
              resultCount={filteredEvents.length}
              totalCount={events.length}
              resultLabel="events"
            />
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No events yet.</div>
          ) : filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No events match your filters.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(e => {
                  const outstanding = Math.max((Number(e.price_total) || 0) - (Number(e.paid_amount) || 0), 0);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link to={`/admin/events/${e.id}`} className="font-medium hover:text-gold transition-smooth">{e.title}</Link>
                        <div className="text-xs text-muted-foreground">/{e.slug}</div>
                      </TableCell>
                      <TableCell className="text-sm">{customerMap[e.id] || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-sm">{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(e.price_total, e.price_currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(e.paid_amount, e.price_currency)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatMoney(outstanding, e.price_currency)}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentStatusClasses(e.payment_status)}`}>
                          {paymentStatusLabel(e.payment_status)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-serif text-xl text-gradient-gold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function csvCell(value: string) {
  const v = value ?? "";
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, Trash2, Save, Receipt, Wallet, ChevronDown, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { formatMoney, paymentStatusClasses, paymentStatusLabel, SUPPORTED_CURRENCIES } from "@/lib/money";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type Preset = { id: string; label: string; description: string | null; default_quantity: number; default_unit_price: number; default_currency: string };
type Method = { id: string; label: string; details: string | null };

type LineItem = {
  id: string;
  event_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  position: number;
  /** Locally-created (not yet persisted) — these get inserted on save. */
  _new?: boolean;
};

type Payment = {
  id: string;
  event_id: string;
  amount: number;
  currency: string;
  paid_at: string;
  method: string | null;
  note: string | null;
  _new?: boolean;
};

type Props = {
  eventId: string;
  /** Currency stored on the event row. Used to seed new line items / payments. */
  currency: string;
  /** Cached totals straight from the event row — used as a fallback while
      we re-fetch fresh items. The component recalculates locally on edits
      so the user sees instant feedback before triggers run. */
  cachedTotal: number;
  cachedPaid: number;
  cachedStatus: string;
  /** Notify parent so it can refresh its own copy of the event row. */
  onChanged?: (next: { price_total: number; paid_amount: number; payment_status: string; price_currency: string }) => void;
};

// Generates a stable temp id for locally-created rows that don't exist in DB yet.
const tempId = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

export default function EventBillingTab({
  eventId,
  currency,
  cachedTotal,
  cachedPaid,
  cachedStatus,
  onChanged,
}: Props) {
  // Server snapshot — what the DB currently holds. Used to compute diffs on save.
  const [serverItems, setServerItems] = useState<LineItem[]>([]);
  const [serverPayments, setServerPayments] = useState<Payment[]>([]);
  const [serverCur, setServerCur] = useState<string>(currency || "USD");

  // Working copies — what the user is editing.
  const [items, setItems] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cur, setCur] = useState<string>(currency || "USD");

  // Track ids the user deleted locally so we know to delete them on save.
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [deletedPaymentIds, setDeletedPaymentIds] = useState<string[]>([]);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [li, pay, pre, meth] = await Promise.all([
      supabase.from("event_line_items").select("*").eq("event_id", eventId)
        .order("position", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("event_payments").select("*").eq("event_id", eventId)
        .order("paid_at", { ascending: false }),
      supabase.from("invoice_item_presets").select("id, label, description, default_quantity, default_unit_price, default_currency")
        .eq("is_active", true).order("position", { ascending: true }),
      supabase.from("payment_methods").select("id, label, details")
        .eq("is_active", true).order("position", { ascending: true }),
    ]);
    const itemsData = (li.data ?? []) as LineItem[];
    const paymentsData = (pay.data ?? []) as Payment[];
    setServerItems(itemsData);
    setServerPayments(paymentsData);
    setItems(itemsData.map(x => ({ ...x })));
    setPayments(paymentsData.map(x => ({ ...x })));
    setDeletedItemIds([]);
    setDeletedPaymentIds([]);
    setPresets((pre.data ?? []) as Preset[]);
    setMethods((meth.data ?? []) as Method[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [eventId]);
  useEffect(() => { setCur(currency || "USD"); setServerCur(currency || "USD"); }, [currency]);

  // Local-only totals for instant feedback on the summary cards.
  const totals = useMemo(() => {
    const total = items.reduce((s, it) => s + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
    let status = "unpaid";
    if (total === 0 && paid === 0) status = "unpaid";
    else if (paid >= total && total > 0) status = "paid";
    else if (paid > 0) status = "partial";
    return { total, paid, status, outstanding: Math.max(total - paid, 0) };
  }, [items, payments]);

  // Dirty when there's any pending diff to persist.
  const dirty = useMemo(() => {
    if (loading) return false;
    if (cur !== serverCur) return true;
    if (deletedItemIds.length > 0 || deletedPaymentIds.length > 0) return true;
    if (items.some(i => i._new)) return true;
    if (payments.some(p => p._new)) return true;
    // Compare each existing item by serialized fields.
    const itemMap = new Map(serverItems.map(i => [i.id, i]));
    for (const it of items) {
      if (it._new) continue;
      const orig = itemMap.get(it.id);
      if (!orig) return true;
      if (orig.description !== it.description) return true;
      if (Number(orig.quantity) !== Number(it.quantity)) return true;
      if (Number(orig.unit_price) !== Number(it.unit_price)) return true;
    }
    const payMap = new Map(serverPayments.map(p => [p.id, p]));
    for (const p of payments) {
      if (p._new) continue;
      const orig = payMap.get(p.id);
      if (!orig) return true;
      if (Number(orig.amount) !== Number(p.amount)) return true;
      if (orig.currency !== p.currency) return true;
      if (orig.paid_at !== p.paid_at) return true;
      if ((orig.method ?? "") !== (p.method ?? "")) return true;
      if ((orig.note ?? "") !== (p.note ?? "")) return true;
    }
    return false;
  }, [loading, cur, serverCur, items, serverItems, payments, serverPayments, deletedItemIds, deletedPaymentIds]);

  useUnsavedChanges(dirty);

  // ─────────────────────────────────── Line items (local mutations only)
  const addItem = (preset?: Preset) => {
    const newItem: LineItem = preset
      ? {
          id: tempId(),
          event_id: eventId,
          description: preset.description ? `${preset.label} — ${preset.description}` : preset.label,
          quantity: Number(preset.default_quantity) || 1,
          unit_price: Number(preset.default_unit_price) || 0,
          position: items.length,
          _new: true,
        }
      : { id: tempId(), event_id: eventId, description: "New item", quantity: 1, unit_price: 0, position: items.length, _new: true };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    // Only remember the deletion if the row exists on the server.
    if (!id.startsWith("tmp_")) setDeletedItemIds(prev => [...prev, id]);
  };

  // ─────────────────────────────────── Payments (local mutations only)
  const addPayment = () => {
    const newPayment: Payment = {
      id: tempId(),
      event_id: eventId,
      amount: 0,
      currency: cur,
      paid_at: new Date().toISOString(),
      method: methods[0]?.label ?? "Cash",
      note: null,
      _new: true,
    };
    setPayments([newPayment, ...payments]);
  };

  const updatePayment = (id: string, patch: Partial<Payment>) =>
    setPayments(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    if (!id.startsWith("tmp_")) setDeletedPaymentIds(prev => [...prev, id]);
  };

  // ─────────────────────────────────── Save (single button → diffs to DB)
  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      // 1) Currency on the event row.
      if (cur !== serverCur) {
        const { error } = await supabase.from("events").update({ price_currency: cur }).eq("id", eventId);
        if (error) throw error;
      }

      // 2) Deletions first (so unique/position constraints don't clash later).
      if (deletedItemIds.length > 0) {
        const { error } = await supabase.from("event_line_items").delete().in("id", deletedItemIds);
        if (error) throw error;
      }
      if (deletedPaymentIds.length > 0) {
        const { error } = await supabase.from("event_payments").delete().in("id", deletedPaymentIds);
        if (error) throw error;
      }

      // 3) Updates to existing rows (only those that actually changed).
      const itemMap = new Map(serverItems.map(i => [i.id, i]));
      for (const it of items) {
        if (it._new) continue;
        const orig = itemMap.get(it.id);
        if (!orig) continue;
        const changed =
          orig.description !== it.description ||
          Number(orig.quantity) !== Number(it.quantity) ||
          Number(orig.unit_price) !== Number(it.unit_price);
        if (!changed) continue;
        const { error } = await supabase
          .from("event_line_items")
          .update({
            description: it.description,
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
          })
          .eq("id", it.id);
        if (error) throw error;
      }

      const payMap = new Map(serverPayments.map(p => [p.id, p]));
      for (const p of payments) {
        if (p._new) continue;
        const orig = payMap.get(p.id);
        if (!orig) continue;
        const changed =
          Number(orig.amount) !== Number(p.amount) ||
          orig.currency !== p.currency ||
          orig.paid_at !== p.paid_at ||
          (orig.method ?? "") !== (p.method ?? "") ||
          (orig.note ?? "") !== (p.note ?? "");
        if (!changed) continue;
        const { error } = await supabase
          .from("event_payments")
          .update({
            amount: Number(p.amount) || 0,
            currency: p.currency,
            paid_at: p.paid_at,
            method: p.method,
            note: p.note,
          })
          .eq("id", p.id);
        if (error) throw error;
      }

      // 4) Inserts for newly-added rows.
      const newItems = items.filter(i => i._new);
      if (newItems.length > 0) {
        const { error } = await supabase.from("event_line_items").insert(
          newItems.map(it => ({
            event_id: eventId,
            description: it.description,
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            position: it.position,
          }))
        );
        if (error) throw error;
      }
      const newPayments = payments.filter(p => p._new);
      if (newPayments.length > 0) {
        const { error } = await supabase.from("event_payments").insert(
          newPayments.map(p => ({
            event_id: eventId,
            amount: Number(p.amount) || 0,
            currency: p.currency,
            paid_at: p.paid_at,
            method: p.method,
            note: p.note,
          }))
        );
        if (error) throw error;
      }

      toast.success("Billing saved");
      onChanged?.({
        price_total: totals.total,
        paid_amount: totals.paid,
        payment_status: totals.status,
        price_currency: cur,
      });
      // Re-fetch to pick up trigger-recomputed totals + the real ids of inserted rows.
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save billing");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!dirty) return;
    if (!window.confirm("Discard all unsaved billing changes?")) return;
    setItems(serverItems.map(x => ({ ...x })));
    setPayments(serverPayments.map(x => ({ ...x })));
    setCur(serverCur);
    setDeletedItemIds([]);
    setDeletedPaymentIds([]);
  };

  // Use freshly-computed totals when items are loaded; fall back to cached
  // event row values during the initial load so we don't flash zeros.
  const showTotal = loading ? cachedTotal : totals.total;
  const showPaid = loading ? cachedPaid : totals.paid;
  const showStatus = loading ? cachedStatus : totals.status;
  const showOutstanding = Math.max(showTotal - showPaid, 0);

  return (
    <div className="space-y-8 pb-24">
      {/* Summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Total" value={formatMoney(showTotal, cur)} />
        <SummaryCard label="Paid" value={formatMoney(showPaid, cur)} />
        <SummaryCard label="Outstanding" value={formatMoney(showOutstanding, cur)} />
        <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Status</span>
          <span className={`mt-2 text-sm font-medium px-2.5 py-1 rounded-full inline-block w-fit ${paymentStatusClasses(showStatus)}`}>
            {paymentStatusLabel(showStatus)}
          </span>
        </div>
      </section>

      {/* Currency picker */}
      <section className="rounded-xl border border-border bg-card p-5">
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Currency</Label>
        <div className="mt-2 flex items-center gap-3">
          <Select value={cur} onValueChange={setCur}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Applied to new line items, payments, and the report.</p>
        </div>
      </section>

      {/* Line items */}
      <section className="rounded-xl border border-border bg-card">
        <header className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-xl">Invoice items</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1.5" /> Add item <ChevronDown className="h-3 w-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => addItem()}>
                <Plus className="h-4 w-4 mr-2" /> Blank item
              </DropdownMenuItem>
              {presets.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">From presets</DropdownMenuLabel>
                  {presets.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => addItem(p)}>
                      <div className="flex flex-col">
                        <span>{p.label}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {formatMoney(Number(p.default_quantity) * Number(p.default_unit_price), p.default_currency)}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/billing">Manage presets…</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className="p-5 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet. Add the template fee or add-ons here.</p>
          ) : (
            items.map(it => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 md:col-span-6 space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={it.description}
                    onChange={e => updateItem(it.id, { description: e.target.value })}
                  />
                </div>
                <div className="col-span-4 md:col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.quantity}
                    onChange={e => updateItem(it.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-5 md:col-span-2 space-y-1">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.unit_price}
                    onChange={e => updateItem(it.id, { unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-2 md:col-span-1 text-sm text-right tabular-nums">
                  {formatMoney(Number(it.quantity || 0) * Number(it.unit_price || 0), cur)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => deleteItem(it.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payments */}
      <section className="rounded-xl border border-border bg-card">
        <header className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gold" />
            <h2 className="font-serif text-xl">Payments</h2>
          </div>
          <Button size="sm" variant="outline" onClick={addPayment}>
            <Plus className="h-4 w-4 mr-1.5" /> Record payment
          </Button>
        </header>
        <div className="p-5 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            payments.map(p => (
              <div key={p.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 md:col-span-3 space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input
                    type="datetime-local"
                    value={p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 16) : ""}
                    onChange={e => updatePayment(p.id, { paid_at: e.target.value ? new Date(e.target.value).toISOString() : new Date().toISOString() })}
                  />
                </div>
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={e => updatePayment(p.id, { amount: Number(e.target.value) })}
                  />
                </div>
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Currency</Label>
                  <Select
                    value={p.currency}
                    onValueChange={v => updatePayment(p.id, { currency: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6 md:col-span-2 space-y-1">
                  <Label className="text-xs">Method</Label>
                  {methods.length > 0 ? (
                    <Select
                      value={methods.some(m => m.label === p.method) ? (p.method ?? "") : "__custom__"}
                      onValueChange={v => {
                        if (v === "__custom__") return;
                        updatePayment(p.id, { method: v });
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                      <SelectContent>
                        {methods.map(m => <SelectItem key={m.id} value={m.label}>{m.label}</SelectItem>)}
                        <SelectItem value="__custom__">Custom…</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={p.method ?? ""}
                      onChange={e => updatePayment(p.id, { method: e.target.value })}
                      placeholder="Cash / Bank / ABA…"
                    />
                  )}
                </div>
                <div className="col-span-11 md:col-span-2 space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Input
                    value={p.note ?? ""}
                    onChange={e => updatePayment(p.id, { note: e.target.value })}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => deletePayment(p.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Sticky save bar — visible whenever there are unsaved billing changes. */}
      <div className="sticky bottom-4 z-30 flex justify-end">
        <div
          className={`flex items-center gap-3 rounded-full border bg-card/95 backdrop-blur px-4 py-2 shadow-lg transition-all ${
            dirty ? "border-gold/50" : "border-border opacity-80"
          }`}
        >
          {dirty && (
            <span className="flex items-center gap-1.5 text-xs text-gold">
              <AlertCircle className="h-3.5 w-3.5" /> Unsaved changes
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!dirty || saving}>
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="bg-gradient-gold text-primary-foreground hover:opacity-90"
          >
            <Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving…" : "Save billing"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="mt-2 font-serif text-2xl text-gradient-gold tabular-nums">{value}</div>
    </div>
  );
}

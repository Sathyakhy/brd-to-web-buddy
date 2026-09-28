import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Receipt, Wallet, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SUPPORTED_CURRENCIES, formatMoney } from "@/lib/money";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

type Preset = {
  id: string;
  label: string;
  description: string | null;
  default_quantity: number;
  default_unit_price: number;
  default_currency: string;
  position: number;
  is_active: boolean;
  _new?: boolean;
};

type Method = {
  id: string;
  label: string;
  details: string | null;
  position: number;
  is_active: boolean;
  _new?: boolean;
};

const tempId = () => `tmp_${Math.random().toString(36).slice(2, 10)}`;

export default function Billing() {
  // Server snapshot vs. working draft.
  const [serverPresets, setServerPresets] = useState<Preset[]>([]);
  const [serverMethods, setServerMethods] = useState<Method[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [methods, setMethods] = useState<Method[]>([]);
  const [deletedPresetIds, setDeletedPresetIds] = useState<string[]>([]);
  const [deletedMethodIds, setDeletedMethodIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [pRes, mRes] = await Promise.all([
      supabase.from("invoice_item_presets").select("*").order("position", { ascending: true }),
      supabase.from("payment_methods").select("*").order("position", { ascending: true }),
    ]);
    const p = (pRes.data ?? []) as Preset[];
    const m = (mRes.data ?? []) as Method[];
    setServerPresets(p);
    setServerMethods(m);
    setPresets(p.map(x => ({ ...x })));
    setMethods(m.map(x => ({ ...x })));
    setDeletedPresetIds([]);
    setDeletedMethodIds([]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ─────── Presets (local mutations) ───────
  const addPreset = () => {
    setPresets(prev => [
      ...prev,
      {
        id: tempId(),
        label: "New item",
        description: null,
        default_quantity: 1,
        default_unit_price: 0,
        default_currency: "USD",
        position: prev.length,
        is_active: true,
        _new: true,
      },
    ]);
  };
  const patchPreset = (id: string, patch: Partial<Preset>) =>
    setPresets(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
    if (!id.startsWith("tmp_")) setDeletedPresetIds(prev => [...prev, id]);
  };

  // ─────── Methods (local mutations) ───────
  const addMethod = () => {
    setMethods(prev => [
      ...prev,
      { id: tempId(), label: "New method", details: null, position: prev.length, is_active: true, _new: true },
    ]);
  };
  const patchMethod = (id: string, patch: Partial<Method>) =>
    setMethods(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
  const deleteMethod = (id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
    if (!id.startsWith("tmp_")) setDeletedMethodIds(prev => [...prev, id]);
  };

  // ─────── Dirty detection (drives save bar + nav warning) ───────
  const dirty = useMemo(() => {
    if (loading) return false;
    if (deletedPresetIds.length || deletedMethodIds.length) return true;
    if (presets.some(p => p._new) || methods.some(m => m._new)) return true;
    const pMap = new Map(serverPresets.map(p => [p.id, p]));
    for (const p of presets) {
      if (p._new) continue;
      const orig = pMap.get(p.id);
      if (!orig) return true;
      if (
        orig.label !== p.label ||
        (orig.description ?? "") !== (p.description ?? "") ||
        Number(orig.default_quantity) !== Number(p.default_quantity) ||
        Number(orig.default_unit_price) !== Number(p.default_unit_price) ||
        orig.default_currency !== p.default_currency ||
        orig.is_active !== p.is_active
      ) return true;
    }
    const mMap = new Map(serverMethods.map(m => [m.id, m]));
    for (const m of methods) {
      if (m._new) continue;
      const orig = mMap.get(m.id);
      if (!orig) return true;
      if (
        orig.label !== m.label ||
        (orig.details ?? "") !== (m.details ?? "") ||
        orig.is_active !== m.is_active
      ) return true;
    }
    return false;
  }, [loading, presets, methods, serverPresets, serverMethods, deletedPresetIds, deletedMethodIds]);

  useUnsavedChanges(dirty);

  // ─────── Save (single button) ───────
  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      if (deletedPresetIds.length) {
        const { error } = await supabase.from("invoice_item_presets").delete().in("id", deletedPresetIds);
        if (error) throw error;
      }
      if (deletedMethodIds.length) {
        const { error } = await supabase.from("payment_methods").delete().in("id", deletedMethodIds);
        if (error) throw error;
      }

      const pMap = new Map(serverPresets.map(p => [p.id, p]));
      for (const p of presets) {
        if (p._new) continue;
        const orig = pMap.get(p.id);
        if (!orig) continue;
        const changed =
          orig.label !== p.label ||
          (orig.description ?? "") !== (p.description ?? "") ||
          Number(orig.default_quantity) !== Number(p.default_quantity) ||
          Number(orig.default_unit_price) !== Number(p.default_unit_price) ||
          orig.default_currency !== p.default_currency ||
          orig.is_active !== p.is_active;
        if (!changed) continue;
        const { error } = await supabase.from("invoice_item_presets").update({
          label: p.label,
          description: p.description,
          default_quantity: Number(p.default_quantity) || 0,
          default_unit_price: Number(p.default_unit_price) || 0,
          default_currency: p.default_currency,
          is_active: p.is_active,
        }).eq("id", p.id);
        if (error) throw error;
      }

      const mMap = new Map(serverMethods.map(m => [m.id, m]));
      for (const m of methods) {
        if (m._new) continue;
        const orig = mMap.get(m.id);
        if (!orig) continue;
        const changed =
          orig.label !== m.label ||
          (orig.details ?? "") !== (m.details ?? "") ||
          orig.is_active !== m.is_active;
        if (!changed) continue;
        const { error } = await supabase.from("payment_methods").update({
          label: m.label,
          details: m.details,
          is_active: m.is_active,
        }).eq("id", m.id);
        if (error) throw error;
      }

      const newPresets = presets.filter(p => p._new);
      if (newPresets.length) {
        const { error } = await supabase.from("invoice_item_presets").insert(
          newPresets.map(p => ({
            label: p.label,
            description: p.description,
            default_quantity: Number(p.default_quantity) || 0,
            default_unit_price: Number(p.default_unit_price) || 0,
            default_currency: p.default_currency,
            position: p.position,
            is_active: p.is_active,
          }))
        );
        if (error) throw error;
      }
      const newMethods = methods.filter(m => m._new);
      if (newMethods.length) {
        const { error } = await supabase.from("payment_methods").insert(
          newMethods.map(m => ({
            label: m.label,
            details: m.details,
            position: m.position,
            is_active: m.is_active,
          }))
        );
        if (error) throw error;
      }

      toast.success("Billing settings saved");
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!dirty) return;
    if (!window.confirm("Discard all unsaved changes?")) return;
    setPresets(serverPresets.map(x => ({ ...x })));
    setMethods(serverMethods.map(x => ({ ...x })));
    setDeletedPresetIds([]);
    setDeletedMethodIds([]);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-up pb-24">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage invoice item presets and payment methods used across all events.
          </p>
        </div>

        {/* Invoice item presets */}
        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-xl">Invoice item presets</h2>
            </div>
            <Button size="sm" variant="outline" onClick={addPreset}>
              <Plus className="h-4 w-4 mr-1.5" /> Add preset
            </Button>
          </header>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : presets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No presets yet. Add reusable invoice items so you don't retype them on every event.</p>
            ) : (
              presets.map(p => (
                <div key={p.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="col-span-12 md:col-span-3 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={p.label} onChange={e => patchPreset(p.id, { label: e.target.value })} />
                  </div>
                  <div className="col-span-12 md:col-span-3 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input value={p.description ?? ""} onChange={e => patchPreset(p.id, { description: e.target.value })} />
                  </div>
                  <div className="col-span-4 md:col-span-1 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" step="0.01" value={p.default_quantity}
                      onChange={e => patchPreset(p.id, { default_quantity: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-4 md:col-span-2 space-y-1">
                    <Label className="text-xs">Unit price</Label>
                    <Input type="number" step="0.01" value={p.default_unit_price}
                      onChange={e => patchPreset(p.id, { default_unit_price: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-4 md:col-span-1 space-y-1">
                    <Label className="text-xs">Cur</Label>
                    <Select value={p.default_currency} onValueChange={v => patchPreset(p.id, { default_currency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-8 md:col-span-1 flex items-center gap-2 pt-5">
                    <Switch checked={p.is_active} onCheckedChange={v => patchPreset(p.id, { is_active: v })} />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <div className="col-span-4 md:col-span-1 flex justify-end items-center pt-5">
                    <span className="text-xs text-muted-foreground tabular-nums mr-2">
                      {formatMoney(Number(p.default_quantity) * Number(p.default_unit_price), p.default_currency)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => deletePreset(p.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Payment methods */}
        <section className="rounded-xl border border-border bg-card">
          <header className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-xl">Payment methods</h2>
            </div>
            <Button size="sm" variant="outline" onClick={addMethod}>
              <Plus className="h-4 w-4 mr-1.5" /> Add method
            </Button>
          </header>
          <div className="p-5 space-y-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : methods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No methods yet.</p>
            ) : (
              methods.map(m => (
                <div key={m.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-secondary/30 border border-border">
                  <div className="col-span-12 md:col-span-3 space-y-1">
                    <Label className="text-xs">Label</Label>
                    <Input value={m.label} onChange={e => patchMethod(m.id, { label: e.target.value })} />
                  </div>
                  <div className="col-span-12 md:col-span-7 space-y-1">
                    <Label className="text-xs">Details (account number, notes…)</Label>
                    <Input value={m.details ?? ""} onChange={e => patchMethod(m.id, { details: e.target.value })} />
                  </div>
                  <div className="col-span-8 md:col-span-1 flex items-center gap-2 pt-5">
                    <Switch checked={m.is_active} onCheckedChange={v => patchMethod(m.id, { is_active: v })} />
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                  <div className="col-span-4 md:col-span-1 flex justify-end pt-5">
                    <Button variant="ghost" size="icon" onClick={() => deleteMethod(m.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sticky save bar */}
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
              <Save className="h-4 w-4 mr-1.5" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Trash2, GripVertical, LayoutList, LayoutGrid, Library, Save, Upload, Pencil, X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AgendaDay, AgendaItem, AgendaViewStyle, AGENDA_ICON_KEYS, getAgendaIcon, uid,
} from "@/lib/agenda";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Preset = {
  id: string;
  label: string;
  description: string | null;
  icon: string;
  icon_image_url: string | null;
};

type Props = {
  days: AgendaDay[];
  viewStyle: AgendaViewStyle;
  onChange: (days: AgendaDay[]) => void;
  onChangeViewStyle: (v: AgendaViewStyle) => void;
};

export default function AgendaEditor({ days, viewStyle, onChange, onChangeViewStyle }: Props) {
  const [openDay, setOpenDay] = useState<string | null>(days[0]?.id ?? null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsOpen, setPresetsOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchPresets = async () => {
    const { data, error } = await supabase
      .from("agenda_presets")
      .select("id,label,description,icon,icon_image_url")
      .order("label", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setPresets((data ?? []) as Preset[]);
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  const updateDay = (id: string, patch: Partial<AgendaDay>) => {
    onChange(days.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  };
  const removeDay = (id: string) => {
    if (!confirm("Remove this day and all its items?")) return;
    onChange(days.filter((d) => d.id !== id));
  };
  const addDay = () => {
    const next: AgendaDay = {
      id: uid(),
      title: `Day ${days.length + 1}`,
      date: null,
      items: [],
    };
    onChange([...days, next]);
    setOpenDay(next.id);
  };

  const updateItem = (dayId: string, itemId: string, patch: Partial<AgendaItem>) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, {
      items: day.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    });
  };
  const addItem = (dayId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, {
      items: [...day.items, { id: uid(), time: "", icon: "Sparkle", iconImageUrl: null, label: "", description: "" }],
    });
  };
  const removeItem = (dayId: string, itemId: string) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    updateDay(dayId, { items: day.items.filter((it) => it.id !== itemId) });
  };

  const onDragEndDays = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = days.findIndex((d) => d.id === active.id);
    const to = days.findIndex((d) => d.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(days, from, to));
  };

  const onDragEndItems = (dayId: string) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const from = day.items.findIndex((it) => it.id === active.id);
    const to = day.items.findIndex((it) => it.id === over.id);
    if (from < 0 || to < 0) return;
    updateDay(dayId, { items: arrayMove(day.items, from, to) });
  };

  const saveItemAsPreset = async (item: AgendaItem) => {
    if (!item.label.trim()) {
      toast.error("Add a title before saving as a preset");
      return;
    }
    const { error } = await supabase.from("agenda_presets").insert({
      label: item.label.trim(),
      description: item.description?.trim() || null,
      icon: item.icon || "Sparkle",
      icon_image_url: item.iconImageUrl ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved to library");
    fetchPresets();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl">Agenda</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Drag <GripVertical className="inline h-3 w-3 align-[-2px]" /> to reorder. Use the library to reuse saved items, or save your own.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Dialog open={presetsOpen} onOpenChange={setPresetsOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Library className="h-4 w-4 mr-2" /> Manage library
              </Button>
            </DialogTrigger>
            <PresetManagerDialog presets={presets} onChanged={fetchPresets} />
          </Dialog>
          <span className="text-xs text-muted-foreground">View style:</span>
          <div className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5">
            <button
              type="button"
              onClick={() => onChangeViewStyle("list")}
              className={`px-2.5 py-1 rounded inline-flex items-center gap-1 text-xs transition-colors ${
                viewStyle === "list" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" /> List
            </button>
            <button
              type="button"
              onClick={() => onChangeViewStyle("card")}
              className={`px-2.5 py-1 rounded inline-flex items-center gap-1 text-xs transition-colors ${
                viewStyle === "card" ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cards
            </button>
          </div>
        </div>
      </div>

      {days.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No agenda days yet — add your first one to get started.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndDays}>
        <SortableContext items={days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {days.map((day, di) => (
              <SortableDay
                key={day.id}
                day={day}
                index={di}
                isOpen={openDay === day.id}
                onToggle={() => setOpenDay(openDay === day.id ? null : day.id)}
                onRemove={() => removeDay(day.id)}
                onUpdate={(patch) => updateDay(day.id, patch)}
                sensors={sensors}
                onDragEndItems={onDragEndItems(day.id)}
                onUpdateItem={(itemId, patch) => updateItem(day.id, itemId, patch)}
                onAddItem={() => addItem(day.id)}
                onRemoveItem={(itemId) => removeItem(day.id, itemId)}
                presets={presets}
                onSaveAsPreset={saveItemAsPreset}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" onClick={addDay}>
        <Plus className="h-4 w-4 mr-2" /> Add day
      </Button>
    </div>
  );
}

/* ───────────────── Sortable day card ───────────────── */
function SortableDay({
  day, index, isOpen, onToggle, onRemove, onUpdate,
  sensors, onDragEndItems, onUpdateItem, onAddItem, onRemoveItem,
  presets, onSaveAsPreset,
}: {
  day: AgendaDay;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<AgendaDay>) => void;
  sensors: ReturnType<typeof useSensors>;
  onDragEndItems: (e: DragEndEvent) => void;
  onUpdateItem: (itemId: string, patch: Partial<AgendaItem>) => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  presets: Preset[];
  onSaveAsPreset: (item: AgendaItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border bg-secondary/20 ${isDragging ? "border-gold shadow-lg" : "border-border"}`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-gold p-1 rounded"
          aria-label={`Reorder day ${index + 1}`}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggle} className="flex-1 text-left">
          <div className="font-medium text-sm">{day.title || `Day ${index + 1}`}</div>
          <div className="text-xs text-muted-foreground">
            {day.items.length} item{day.items.length === 1 ? "" : "s"}
            {day.date ? ` · ${day.date}` : ""}
          </div>
        </button>
        <Button variant="ghost" size="icon" onClick={onRemove} title="Remove day">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {isOpen && (
        <div className="p-4 border-t border-border space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Day header</Label>
              <Input
                value={day.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="កម្មវិធីពេលព្រឹក"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date (optional)</Label>
              <Input
                type="date"
                value={day.date ?? ""}
                onChange={(e) => onUpdate({ date: e.target.value || null })}
              />
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEndItems}>
            <SortableContext items={day.items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {day.items.map((it) => (
                  <SortableItem
                    key={it.id}
                    item={it}
                    onUpdate={(patch) => onUpdateItem(it.id, patch)}
                    onRemove={() => onRemoveItem(it.id)}
                    presets={presets}
                    onSaveAsPreset={() => onSaveAsPreset(it)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-2" /> Add item
          </Button>
        </div>
      )}
    </div>
  );
}

/* ───────────────── Sortable agenda item ───────────────── */
function SortableItem({
  item, onUpdate, onRemove, presets, onSaveAsPreset,
}: {
  item: AgendaItem;
  onUpdate: (patch: Partial<AgendaItem>) => void;
  onRemove: () => void;
  presets: Preset[];
  onSaveAsPreset: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : "auto",
  };
  const Icon = getAgendaIcon(item.icon);
  const [presetOpen, setPresetOpen] = useState(false);
  const [iconOpen, setIconOpen] = useState(false);

  const applyPreset = (p: Preset) => {
    onUpdate({
      label: p.label,
      description: p.description ?? "",
      icon: p.icon || "Sparkle",
      iconImageUrl: p.icon_image_url ?? null,
    });
    setPresetOpen(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border bg-card p-3 ${isDragging ? "border-gold shadow-lg" : "border-border"}`}
    >
      <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-1 flex sm:justify-center items-end pb-1.5">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-gold p-1 rounded"
            aria-label="Reorder item"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground h-4 block">Time</Label>
          <Input
            type="time"
            step={300}
            value={item.time}
            onChange={(e) => onUpdate({ time: e.target.value })}
            placeholder="06:15"
            list={`time-suggest-${item.id}`}
            className="h-9"
          />
          <datalist id={`time-suggest-${item.id}`}>
            {Array.from({ length: 24 * 12 }, (_, i) => {
              const h = String(Math.floor(i / 12)).padStart(2, "0");
              const m = String((i % 12) * 5).padStart(2, "0");
              return <option key={`${h}:${m}`} value={`${h}:${m}`} />;
            })}
          </datalist>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground h-4 block">Icon</Label>
          <Popover open={iconOpen} onOpenChange={setIconOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm flex items-center gap-2 hover:bg-secondary/40"
              >
                {item.iconImageUrl ? (
                  <img src={item.iconImageUrl} alt="" className="h-5 w-5 object-contain shrink-0" />
                ) : (
                  <Icon className="h-4 w-4 text-gold shrink-0" />
                )}
                <span className="truncate text-xs text-muted-foreground">
                  {item.iconImageUrl ? "Custom" : item.icon}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search icons…" />
                <CommandList className="max-h-72">
                  <CommandEmpty>No icons found.</CommandEmpty>
                  <CommandGroup heading="Built-in">
                    <div className="grid grid-cols-6 gap-1 p-2">
                      {AGENDA_ICON_KEYS.map((k) => {
                        const Ico = getAgendaIcon(k);
                        const active = item.icon === k && !item.iconImageUrl;
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => {
                              const matching = presets.find(
                                (p) => !p.icon_image_url && p.icon === k,
                              );
                              const patch: Partial<AgendaItem> = { icon: k, iconImageUrl: null };
                              if (matching) {
                                patch.label = matching.label;
                                patch.description = matching.description ?? "";
                              }
                              onUpdate(patch);
                              setIconOpen(false);
                            }}
                            title={k}
                            className={`h-9 rounded-md flex items-center justify-center border transition-colors ${
                              active ? "border-gold bg-gold/10 text-gold" : "border-border hover:bg-secondary/60"
                            }`}
                          >
                            <Ico className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </CommandGroup>
                  {presets.some((p) => p.icon_image_url) && (
                    <CommandGroup heading="Custom uploaded">
                      <div className="grid grid-cols-6 gap-1 p-2">
                        {presets
                          .filter((p) => p.icon_image_url)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const patch: Partial<AgendaItem> = {
                                  iconImageUrl: p.icon_image_url,
                                  icon: p.icon || "Sparkle",
                                  label: p.label,
                                  description: p.description ?? "",
                                };
                                onUpdate(patch);
                                setIconOpen(false);
                              }}
                              title={p.label}
                              className="h-9 rounded-md flex items-center justify-center border border-border hover:bg-secondary/60 p-1"
                            >
                              <img src={p.icon_image_url!} alt={p.label} className="h-6 w-6 object-contain" />
                            </button>
                          ))}
                      </div>
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <div className="sm:col-span-5 space-y-1 min-w-0">
          <div className="flex items-center justify-between h-4">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Title</Label>
            <Popover open={presetOpen} onOpenChange={setPresetOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-[10px] inline-flex items-center gap-1 text-gold hover:underline"
                >
                  <Library className="h-3 w-3" /> From library
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search saved items…" />
                  <CommandList className="max-h-72">
                    <CommandEmpty>No saved items yet.</CommandEmpty>
                    <CommandGroup>
                      {presets.map((p) => {
                        const Ico = getAgendaIcon(p.icon);
                        return (
                          <CommandItem
                            key={p.id}
                            value={`${p.label} ${p.description ?? ""}`}
                            onSelect={() => applyPreset(p)}
                            className="flex items-start gap-2"
                          >
                            {p.icon_image_url ? (
                              <img src={p.icon_image_url} alt="" className="h-5 w-5 object-contain shrink-0 mt-0.5" />
                            ) : (
                              <Ico className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm truncate">{p.label}</div>
                              {p.description && (
                                <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Input
            value={item.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="h-9"
          />
        </div>
        <div className="sm:col-span-1 flex sm:justify-center items-end pb-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSaveAsPreset}
            title="Save this item to the library"
            className="h-9 w-9"
          >
            <Save className="h-4 w-4 text-gold" />
          </Button>
        </div>
        <div className="sm:col-span-12 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Sub-day header (optional)
          </Label>
          <Input
            value={item.subHeader ?? ""}
            onChange={(e) => onUpdate({ subHeader: e.target.value || null })}
            placeholder="e.g. ពេលព្រឹក / Morning, ពេលល្ងាច / Evening — shown above this item"
          />
        </div>
        <div className="sm:col-span-12 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description (optional)</Label>
          <Textarea
            rows={2}
            value={item.description ?? ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Short note shown under the item"
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Preset library manager ───────────────── */
function PresetManagerDialog({ presets, onChanged }: { presets: Preset[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partial<Preset> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [presets, search]);

  const startNew = () => setEditing({ label: "", description: "", icon: "Sparkle", icon_image_url: null });
  const startEdit = (p: Preset) => setEditing({ ...p });

  const cancel = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    if (!editing.label?.trim()) {
      toast.error("Label is required");
      return;
    }
    const payload = {
      label: editing.label.trim(),
      description: editing.description?.trim() || null,
      icon: editing.icon || "Sparkle",
      icon_image_url: editing.icon_image_url ?? null,
    };
    if (editing.id) {
      const { error } = await supabase
        .from("agenda_presets")
        .update(payload)
        .eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Preset updated");
    } else {
      const { error } = await supabase.from("agenda_presets").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Preset added");
    }
    setEditing(null);
    onChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this preset?")) return;
    const { error } = await supabase.from("agenda_presets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Preset deleted");
    onChanged();
  };

  const uploadIcon = async (file: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `agenda-icons/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-media")
        .upload(path, file, { upsert: false, contentType: file.type, cacheControl: "31536000" });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-media").getPublicUrl(path);
      setEditing((prev) => ({ ...(prev ?? {}), icon_image_url: data.publicUrl }));
      toast.success("Icon uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Agenda library</DialogTitle>
      </DialogHeader>

      {!editing ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search presets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="button" onClick={startNew}>
              <Plus className="h-4 w-4 mr-2" /> New preset
            </Button>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-md">
                No presets yet. Click "New preset" to add one.
              </div>
            )}
            {filtered.map((p) => {
              const Ico = getAgendaIcon(p.icon);
              return (
                <div key={p.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
                  <div className="h-10 w-10 rounded-md border border-border flex items-center justify-center shrink-0">
                    {p.icon_image_url ? (
                      <img src={p.icon_image_url} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <Ico className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.label}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">{p.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(p)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(p.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Label</Label>
            <Input
              value={editing.label ?? ""}
              onChange={(e) => setEditing({ ...editing, label: e.target.value })}
              placeholder="e.g. ពិធីក្រុងពលី"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              rows={2}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="Short note"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Built-in icon</Label>
              <div className="grid grid-cols-6 gap-1 p-2 border border-border rounded-md max-h-40 overflow-y-auto">
                {AGENDA_ICON_KEYS.map((k) => {
                  const Ico = getAgendaIcon(k);
                  const active = editing.icon === k && !editing.icon_image_url;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setEditing({ ...editing, icon: k, icon_image_url: null })}
                      title={k}
                      className={`h-9 rounded-md flex items-center justify-center border transition-colors ${
                        active ? "border-gold bg-gold/10 text-gold" : "border-border hover:bg-secondary/60"
                      }`}
                    >
                      <Ico className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Or upload custom icon</Label>
              <div className="border border-dashed border-border rounded-md p-3 flex flex-col items-center gap-2">
                {editing.icon_image_url ? (
                  <div className="flex items-center gap-2">
                    <img src={editing.icon_image_url} alt="" className="h-12 w-12 object-contain" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing({ ...editing, icon_image_url: null })}
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">PNG/SVG recommended, square</div>
                )}
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-secondary/50">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading…" : "Upload icon"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadIcon(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button type="button" onClick={save}>
              {editing.id ? "Save changes" : "Add to library"}
            </Button>
          </DialogFooter>
        </div>
      )}
    </DialogContent>
  );
}

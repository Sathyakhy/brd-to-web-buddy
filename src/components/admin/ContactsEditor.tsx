import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ContactItem, ContactType, CONTACT_TYPES, getContactIcon, getContactColor, uidContact,
} from "@/lib/contacts";

type Props = {
  contacts: ContactItem[];
  isDual?: boolean;
  onChange: (contacts: ContactItem[]) => void;
};

export default function ContactsEditor({ contacts, isDual = false, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Telegram uses @username (not a +855 phone), so it's intentionally excluded.
  const PHONE_TYPES: ContactType[] = ["phone", "whatsapp"];
  const ensureKhPrefix = (val: string) => {
    const t = (val ?? "").trim();
    if (!t) return "+855 ";
    if (t.startsWith("+855")) return t;
    return `+855 ${t.replace(/^\+?855\s*/, "")}`;
  };
  const ensureAtPrefix = (val: string) => {
    const t = (val ?? "").trim();
    if (!t) return "@";
    if (t.startsWith("http")) return t; // allow t.me links
    // strip any leftover +855 / spaces and force a leading @
    const cleaned = t.replace(/^\+?855\s*/, "").replace(/^@+/, "");
    return `@${cleaned}`;
  };

  const update = (id: string, patch: Partial<ContactItem>) => {
    onChange(contacts.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, ...patch };
      // When switching to a phone-like type, auto-prefix +855 if value is empty / missing.
      if (patch.type && PHONE_TYPES.includes(patch.type) && !next.value?.startsWith("+855")) {
        next.value = ensureKhPrefix(next.value);
      }
      // When switching TO telegram, strip +855 and use @ instead.
      if (patch.type === "telegram") {
        next.value = ensureAtPrefix(next.value);
      }
      // When editing the value of a phone-like type, keep prefix in place.
      if (patch.value !== undefined && PHONE_TYPES.includes(next.type)) {
        next.value = ensureKhPrefix(patch.value);
      }
      // When editing a telegram value, keep the @ prefix.
      if (patch.value !== undefined && next.type === "telegram") {
        next.value = ensureAtPrefix(patch.value);
      }
      return next;
    }));
  };
  const remove = (id: string) => onChange(contacts.filter((c) => c.id !== id));
  const add = () =>
    onChange([
      ...contacts,
      { id: uidContact(), label: "", type: "phone", value: "+855 " },
    ]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = contacts.findIndex((c) => c.id === active.id);
    const to = contacts.findIndex((c) => c.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(contacts, from, to));
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-serif text-xl">Contacts</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Add multiple contact entries (phone, Telegram, WhatsApp, Messenger, email, link). Drag the <GripVertical className="inline h-3 w-3 align-[-2px]" /> handle to reorder.
        </p>
      </div>

      {contacts.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No contacts yet — add one to show on the invitation page.
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {contacts.map((c) => (
              <SortableContact key={c.id} contact={c} isDual={isDual} onUpdate={(p) => update(c.id, p)} onRemove={() => remove(c.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="h-4 w-4 mr-2" /> Add contact
      </Button>
    </div>
  );
}

function SortableContact({
  contact, isDual, onUpdate, onRemove,
}: {
  contact: ContactItem;
  isDual?: boolean;
  onUpdate: (patch: Partial<ContactItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: contact.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : "auto",
  };
  const Icon = getContactIcon(contact.type);
  const placeholder = CONTACT_TYPES.find((t) => t.value === contact.type)?.placeholder ?? "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border bg-card p-3 ${isDragging ? "border-gold shadow-lg" : "border-border"}`}
    >
      <div className="grid gap-2 sm:grid-cols-12 sm:items-start">
        <div className="sm:col-span-1 flex sm:flex-col items-center sm:items-start gap-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-gold p-1 rounded"
            aria-label="Reorder contact"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
        <div className="sm:col-span-3 space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</Label>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4" style={{ color: getContactColor(contact.type) }} />
            </div>
            <select
              value={contact.type}
              onChange={(e) => onUpdate({ type: e.target.value as ContactType })}
              className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              {CONTACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        {isDual ? (
          <div className="sm:col-span-4 space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label (Bilingual)</Label>
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                value={contact.label}
                onChange={(e) => onUpdate({ label: e.target.value, label_km: e.target.value })}
                placeholder="🇰🇭 ឈ្មោះស្លាក"
                className="h-9 text-xs font-khmer-siemreap"
              />
              <Input
                value={contact.label_en ?? ""}
                onChange={(e) => onUpdate({ label_en: e.target.value })}
                placeholder="🇬🇧 English label"
                className="h-9 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="sm:col-span-3 space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
            <Input
              value={contact.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Smart / Bride's father"
            />
          </div>
        )}
        <div className={isDual ? "sm:col-span-3 space-y-1" : "sm:col-span-4 space-y-1"}>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Value</Label>
          <Input
            value={contact.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder={placeholder}
          />
        </div>
        <div className="sm:col-span-1 flex sm:justify-end items-start pt-1 sm:pt-5">
          <Button variant="ghost" size="icon" onClick={onRemove} title="Remove">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );
}

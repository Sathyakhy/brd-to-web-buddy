import {
  Crown, Gift, Sparkle, Sparkles, Scissors, BookOpen, Wine, Utensils,
  Users, Heart, Music, Camera, Cake, Flower2, Bell, Sun, Moon, Star,
  MapPin, Clock,
} from "lucide-react";

export type AgendaItem = {
  id: string;
  time: string;
  icon: string;        // key into ICONS
  iconImageUrl?: string | null; // optional custom uploaded icon overrides `icon`
  label: string;
  label_km?: string;
  label_en?: string;
  description?: string | null;
  description_km?: string | null;
  description_en?: string | null;
  /** Optional sub-day section header rendered ABOVE this item
      (e.g. "ពេលព្រឹក" / "Morning", "ពេលល្ងាច" / "Evening"). */
  subHeader?: string | null;
  subHeader_km?: string | null;
  subHeader_en?: string | null;
};

export type AgendaDay = {
  id: string;
  title: string;       // header e.g. "កម្មវិធីពេលព្រឹក" or "Day 1 — Ceremony"
  title_km?: string;
  title_en?: string;
  date?: string | null; // optional ISO date (YYYY-MM-DD)
  items: AgendaItem[];
};

export type AgendaViewStyle = "list" | "card";

export const AGENDA_ICONS = {
  Sparkle, Sparkles, Crown, Gift, Scissors, BookOpen, Wine, Utensils,
  Users, Heart, Music, Camera, Cake, Flower2, Bell, Sun, Moon, Star,
  MapPin, Clock,
} as const;

export type AgendaIconKey = keyof typeof AGENDA_ICONS;

export const AGENDA_ICON_KEYS = Object.keys(AGENDA_ICONS) as AgendaIconKey[];

export function getAgendaIcon(key: string) {
  return (AGENDA_ICONS as Record<string, typeof Sparkle>)[key] ?? Sparkle;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Migrate legacy ceremony_time / reception_time into a default 1-day agenda */
export function buildLegacyAgenda(opts: {
  ceremony_time?: string | null;
  reception_time?: string | null;
}): AgendaDay[] {
  const items: AgendaItem[] = [];
  if (opts.ceremony_time) {
    items.push({ id: uid(), time: opts.ceremony_time, icon: "Users", label: "ពិធីហែជំនូន", description: null });
  }
  if (opts.reception_time) {
    items.push({ id: uid(), time: opts.reception_time, icon: "Wine", label: "ពិធីពិសាភោជនាអាហារ", description: null });
  }
  if (!items.length) return [];
  return [{ id: uid(), title: "កម្មវិធី", date: null, items }];
}

export function normalizeAgenda(raw: unknown): AgendaDay[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d: any) => {
      if (!d || typeof d !== "object") return null;
      const items = Array.isArray(d.items)
        ? d.items.map((it: any) => ({
            id: String(it?.id ?? uid()),
            time: String(it?.time ?? ""),
            time_en: it?.time_en ? String(it.time_en) : undefined,
            time_km: it?.time_km ? String(it.time_km) : undefined,
            icon: String(it?.icon ?? "Sparkle"),
            iconImageUrl: it?.iconImageUrl ?? null,
            label: String(it?.label ?? ""),
            label_km: it?.label_km ? String(it.label_km) : (it?.label ? String(it.label) : undefined),
            label_en: it?.label_en ? String(it.label_en) : undefined,
            description: it?.description ?? null,
            description_km: it?.description_km ?? it?.description ?? null,
            description_en: it?.description_en ?? null,
            subHeader: it?.subHeader ?? null,
            subHeader_km: it?.subHeader_km ?? it?.subHeader ?? null,
            subHeader_en: it?.subHeader_en ?? null,
          }))
        : [];
      return {
        id: String(d.id ?? uid()),
        title: String(d.title ?? ""),
        title_km: d.title_km ? String(d.title_km) : (d.title ? String(d.title) : undefined),
        title_en: d.title_en ? String(d.title_en) : undefined,
        date: d.date ?? null,
        items,
      } as AgendaDay;
    })
    .filter(Boolean) as AgendaDay[];
}

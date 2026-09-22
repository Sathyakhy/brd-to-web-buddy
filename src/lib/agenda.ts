import {
  Crown, Gift, Sparkle, Sparkles, Scissors, BookOpen, Wine, Utensils,
  Users, Heart, Music, Camera, Cake, Flower2, Bell, Sun, Moon, Star,
  MapPin, Clock, Gem, HeartHandshake, PartyPopper, Flame, Coffee, Award,
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
  MapPin, Clock, Gem, HeartHandshake, PartyPopper, Flame, Coffee, Award,
} as const;

export type AgendaIconKey = keyof typeof AGENDA_ICONS;

export const AGENDA_ICON_KEYS = Object.keys(AGENDA_ICONS) as AgendaIconKey[];

export function getAgendaIcon(key: string, label?: string) {
  if (key && (AGENDA_ICONS as Record<string, typeof Sparkle>)[key]) {
    if (key !== "Sparkle") {
      return (AGENDA_ICONS as Record<string, typeof Sparkle>)[key];
    }
  }
  if (label) {
    const l = label.toLowerCase();
    if (l.includes("សូត្រមន្ត") || l.includes("ព្រះសង្ឃ") || l.includes("blessing") || l.includes("monk")) return Flame;
    if (l.includes("អាហារ") || l.includes("ភោជន") || l.includes("ញ៉ាំ") || l.includes("dinner") || l.includes("lunch") || l.includes("feast")) return Utensils;
    if (l.includes("កាត់សក់") || l.includes("hair")) return Scissors;
    if (l.includes("ជំនូន") || l.includes("ផ្លែឈើ") || l.includes("gift")) return Gift;
    if (l.includes("ផ្ទឹម") || l.includes("ចងដៃ") || l.includes("ring") || l.includes("wedding") || l.includes("ceremony")) return Gem;
    if (l.includes("ស្រា") || l.includes("ជប់លៀង") || l.includes("party") || l.includes("wine") || l.includes("cheers")) return Wine;
    if (l.includes("តន្ត្រី") || l.includes("រាំ") || l.includes("music") || l.includes("dance")) return Music;
    if (l.includes("ថតរូប") || l.includes("photo")) return Camera;
    if (l.includes("នំ") || l.includes("cake")) return Cake;
    if (l.includes("ផ្កា") || l.includes("flower")) return Flower2;
    if (l.includes("ក្រុងពាលី") || l.includes("ពលា")) return Crown;
    if (l.includes("កាហ្វេ") || l.includes("coffee") || l.includes("tea")) return Coffee;
  }
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
            icon: String(it?.icon ?? "Sparkle"),
            iconImageUrl: it?.iconImageUrl ?? null,
            label: String(it?.label ?? ""),
            description: it?.description ?? null,
            subHeader: it?.subHeader ?? null,
          }))
        : [];
      return {
        id: String(d.id ?? uid()),
        title: String(d.title ?? ""),
        date: d.date ?? null,
        items,
      } as AgendaDay;
    })
    .filter(Boolean) as AgendaDay[];
}

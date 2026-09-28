/**
 * Envelope Unboxing configuration & presets for Cambodia e-Invitation.
 * Supports realistic Cambodian silk textures, wax seals, ribbons, and Web Audio synthesis.
 */

export type SilkColorTheme =
  | "burgundy"
  | "royal_gold"
  | "emerald"
  | "lotus_pink"
  | "midnight_navy"
  | "champagne";

export type WaxSealType =
  | "khmer_monogram"
  | "royal_lotus"
  | "golden_crest"
  | "chhang_knot";

export type RibbonStyle =
  | "silk_gold"
  | "crimson_brocade"
  | "emerald_satin"
  | "none";

export interface EnvelopeConfig {
  enabled: boolean;
  silk_theme: SilkColorTheme;
  custom_silk_color?: string | null;
  wax_seal_type: WaxSealType;
  wax_seal_color?: string | null; // e.g. "gold", "ruby", "emerald", "navy", "bronze"
  ribbon_style: RibbonStyle;
  show_guest_name: boolean;
  unboxing_sound: boolean;
  interaction_mode: "tap" | "slide_ribbon";
  monogram_initials?: string | null;
  seal_label_km?: string | null;
  seal_label_en?: string | null;
}

export const SILK_THEMES: {
  id: SilkColorTheme;
  nameKm: string;
  nameEn: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  patternOpacity: number;
}[] = [
  {
    id: "burgundy",
    nameKm: "ក្រហមទុំរាជវាំង (Royal Burgundy)",
    nameEn: "Royal Burgundy Silk",
    primaryColor: "#5c0e1b",
    secondaryColor: "#3a060f",
    accentColor: "#f7cf72",
    patternOpacity: 0.18,
  },
  {
    id: "royal_gold",
    nameKm: "សូត្រមាសអង្គរ (Angkor Silk Gold)",
    nameEn: "Angkor Silk Gold",
    primaryColor: "#855e16",
    secondaryColor: "#4f3408",
    accentColor: "#ffe599",
    patternOpacity: 0.22,
  },
  {
    id: "emerald",
    nameKm: "ត្បូងមរកត (Emerald Jewel)",
    nameEn: "Emerald Jewel Silk",
    primaryColor: "#0f3d2a",
    secondaryColor: "#062015",
    accentColor: "#e6c367",
    patternOpacity: 0.18,
  },
  {
    id: "lotus_pink",
    nameKm: "ផ្កាឈូកទិព្វ (Lotus Romance)",
    nameEn: "Lotus Romance Silk",
    primaryColor: "#6c1f36",
    secondaryColor: "#420e1d",
    accentColor: "#fcd1b2",
    patternOpacity: 0.16,
  },
  {
    id: "midnight_navy",
    nameKm: "ខៀវរាជិនី (Midnight Indigo)",
    nameEn: "Midnight Indigo Silk",
    primaryColor: "#10233f",
    secondaryColor: "#07101f",
    accentColor: "#f4d06f",
    patternOpacity: 0.2,
  },
  {
    id: "champagne",
    nameKm: "ភ្លុកមាសបុរាណ (Champagne Ivory)",
    nameEn: "Champagne Ivory Silk",
    primaryColor: "#d8c7a7",
    secondaryColor: "#a38e67",
    accentColor: "#744f12",
    patternOpacity: 0.14,
  },
];

export const WAX_SEAL_TYPES: {
  id: WaxSealType;
  nameKm: string;
  nameEn: string;
  iconSymbol: string;
}[] = [
  { id: "khmer_monogram", nameKm: "អក្សរកាត់មង្គល (Monogram)", nameEn: "Couple Monogram", iconSymbol: "ស · រ" },
  { id: "royal_lotus",    nameKm: "ផ្កាឈូកមង្គល (Lotus)",       nameEn: "Sacred Lotus",    iconSymbol: "🪷" },
  { id: "golden_crest",   nameKm: "ក្បាច់រាជានុភាព (Crest)",    nameEn: "Royal Crest",     iconSymbol: "⚜️" },
  { id: "chhang_knot",    nameKm: "ចំណងមហាសម្ព័ន្ធ (Knot)",     nameEn: "Infinity Knot",   iconSymbol: "♾️" },
];

export const RIBBON_STYLES: {
  id: RibbonStyle;
  nameKm: string;
  nameEn: string;
  color: string;
}[] = [
  { id: "silk_gold",       nameKm: "ខ្សែបូសូត្រមាស (Gold Silk)",       nameEn: "Gold Silk Ribbon",       color: "#e5b94c" },
  { id: "crimson_brocade", nameKm: "ខ្សែបូក្រហមទាក (Crimson Brocade)", nameEn: "Crimson Brocade Ribbon", color: "#9b1b30" },
  { id: "emerald_satin",   nameKm: "ខ្សែបូត្បូងមរកត (Emerald Satin)",   nameEn: "Emerald Satin Ribbon",   color: "#18583b" },
  { id: "none",            nameKm: "គ្មានខ្សែបូ (No Ribbon)",          nameEn: "No Ribbon (Seal Only)",  color: "transparent" },
];

export const DEFAULT_ENVELOPE_CONFIG: EnvelopeConfig = {
  enabled: true,
  silk_theme: "burgundy",
  custom_silk_color: null,
  wax_seal_type: "khmer_monogram",
  wax_seal_color: "gold",
  ribbon_style: "silk_gold",
  show_guest_name: true,
  unboxing_sound: true,
  interaction_mode: "tap",
  monogram_initials: "ស · រ",
  seal_label_km: "បើកធៀប",
  seal_label_en: "Open",
};

export function normalizeEnvelopeConfig(raw: unknown): EnvelopeConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_ENVELOPE_CONFIG };
  }
  const r = raw as Partial<EnvelopeConfig>;
  return {
    enabled: r.enabled ?? true,
    silk_theme: (r.silk_theme && SILK_THEMES.some((t) => t.id === r.silk_theme)) ? r.silk_theme : "burgundy",
    custom_silk_color: typeof r.custom_silk_color === "string" ? r.custom_silk_color : null,
    wax_seal_type: (r.wax_seal_type && WAX_SEAL_TYPES.some((w) => w.id === r.wax_seal_type)) ? r.wax_seal_type : "khmer_monogram",
    wax_seal_color: typeof r.wax_seal_color === "string" ? r.wax_seal_color : "gold",
    ribbon_style: (r.ribbon_style && RIBBON_STYLES.some((s) => s.id === r.ribbon_style)) ? r.ribbon_style : "silk_gold",
    show_guest_name: r.show_guest_name ?? true,
    unboxing_sound: r.unboxing_sound ?? true,
    interaction_mode: r.interaction_mode === "slide_ribbon" ? "slide_ribbon" : "tap",
    monogram_initials: typeof r.monogram_initials === "string" ? r.monogram_initials : "ស · រ",
    seal_label_km: typeof r.seal_label_km === "string" ? r.seal_label_km : "បើកធៀប",
    seal_label_en: typeof r.seal_label_en === "string" ? r.seal_label_en : "Open",
  };
}

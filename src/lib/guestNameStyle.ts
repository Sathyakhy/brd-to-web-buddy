import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

export type GuestNameFontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

export type GuestNameStyle = {
  // Khmer styling
  font_km?: string | null;
  font_size_km?: GuestNameFontSize | string | null;
  color_km?: string | null;
  is_bold_km?: boolean | null;
  is_italic_km?: boolean | null;

  // English styling
  font_en?: string | null;
  font_size_en?: GuestNameFontSize | string | null;
  color_en?: string | null;
  is_bold_en?: boolean | null;
  is_italic_en?: boolean | null;

  // Legacy / fallback fields
  color?: string | null;
  font_size?: GuestNameFontSize | string | null;
  is_bold?: boolean | null;
  is_italic?: boolean | null;
};

export const DEFAULT_GUEST_NAME_STYLE: GuestNameStyle = {
  font_km: null,
  font_size_km: "base",
  color_km: "#f7a60f",
  is_bold_km: null,
  is_italic_km: null,

  font_en: null,
  font_size_en: "base",
  color_en: "#f7a60f",
  is_bold_en: true,
  is_italic_en: null,

  color: null,
  font_size: "base",
  is_bold: null,
  is_italic: null,
};

export const GUEST_NAME_FONT_SIZE_OPTIONS: {
  value: GuestNameFontSize;
  label: string;
  kmDesc: string;
  enDesc: string;
}[] = [
  { value: "xs", label: "Extra Small (XS)", kmDesc: "1.25rem", enDesc: "1.1rem" },
  { value: "sm", label: "Small (SM)", kmDesc: "1.5rem", enDesc: "1.3rem" },
  { value: "base", label: "Standard / Medium (Default)", kmDesc: "1.85rem", enDesc: "1.55rem" },
  { value: "lg", label: "Large (LG)", kmDesc: "2.15rem", enDesc: "1.85rem" },
  { value: "xl", label: "Extra Large (XL)", kmDesc: "2.5rem", enDesc: "2.15rem" },
  { value: "2xl", label: "2X Large (2XL)", kmDesc: "2.9rem", enDesc: "2.5rem" },
  { value: "3xl", label: "3X Large (3XL)", kmDesc: "3.4rem", enDesc: "2.9rem" },
];

export function getGuestNameFontSizeStyle(
  size: GuestNameFontSize | string | null | undefined,
  isEn: boolean
): { fontSize?: string; className?: string } {
  const s = size || "base";

  switch (s) {
    case "xs":
      return {
        fontSize: isEn ? "clamp(0.95rem, 3.2vw, 1.15rem)" : "clamp(1.1rem, 3.5vw, 1.35rem)",
      };
    case "sm":
      return {
        fontSize: isEn ? "clamp(1.15rem, 3.7vw, 1.35rem)" : "clamp(1.3rem, 4vw, 1.6rem)",
      };
    case "base":
      return {
        fontSize: isEn ? "clamp(1.35rem, 4.3vw, 1.65rem)" : "clamp(1.5rem, 4.5vw, 1.875rem)",
      };
    case "lg":
      return {
        fontSize: isEn ? "clamp(1.55rem, 4.8vw, 1.95rem)" : "clamp(1.8rem, 5.2vw, 2.25rem)",
      };
    case "xl":
      return {
        fontSize: isEn ? "clamp(1.8rem, 5.4vw, 2.3rem)" : "clamp(2.1rem, 5.8vw, 2.65rem)",
      };
    case "2xl":
      return {
        fontSize: isEn ? "clamp(2.1rem, 6vw, 2.7rem)" : "clamp(2.45rem, 6.5vw, 3.1rem)",
      };
    case "3xl":
      return {
        fontSize: isEn ? "clamp(2.45rem, 6.8vw, 3.15rem)" : "clamp(2.85rem, 7.2vw, 3.6rem)",
      };
    default:
      if (typeof s === "string" && (s.includes("px") || s.includes("rem") || s.includes("em") || s.includes("clamp"))) {
        return { fontSize: s };
      }
      return {
        fontSize: isEn ? "clamp(1.35rem, 4.3vw, 1.65rem)" : "clamp(1.5rem, 4.5vw, 1.875rem)",
      };
  }
}

export function resolveGuestNameFont(
  fontName: string | null | undefined,
  isEn: boolean
): string {
  if (!fontName || !fontName.trim()) {
    return isEn
      ? "'Bitter', 'Playfair Display', 'Cinzel', serif"
      : "'Khmer OS Moul Light', 'Khmer OS Moul', 'Moul', 'Battambang', serif";
  }

  const custom = fontName.trim();
  // Check header font map and body font map first
  const h = resolveHeaderFont(custom, isEn);
  if (h) return h;
  const b = resolveBodyFont(custom, isEn);
  if (b) return b;

  return `"${custom}", ${
    isEn
      ? "'Bitter', 'Playfair Display', serif"
      : "'Khmer OS Moul Light', 'Khmer OS Moul', 'Moul', serif"
  }`;
}

export function normalizeGuestNameStyle(raw: unknown): GuestNameStyle {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_GUEST_NAME_STYLE };
  const r = raw as Record<string, any>;

  return {
    font_km: typeof r.font_km === "string" && r.font_km.trim() ? r.font_km.trim() : null,
    font_size_km: r.font_size_km ?? r.font_size ?? "base",
    color_km:
      typeof r.color_km === "string" && r.color_km.trim()
        ? r.color_km.trim()
        : (typeof r.color === "string" && r.color.trim() ? r.color.trim() : "#f7a60f"),
    is_bold_km: typeof r.is_bold_km === "boolean" ? r.is_bold_km : (typeof r.is_bold === "boolean" ? r.is_bold : null),
    is_italic_km: typeof r.is_italic_km === "boolean" ? r.is_italic_km : (typeof r.is_italic === "boolean" ? r.is_italic : null),

    font_en: typeof r.font_en === "string" && r.font_en.trim() ? r.font_en.trim() : null,
    font_size_en: r.font_size_en ?? r.font_size ?? "base",
    color_en:
      typeof r.color_en === "string" && r.color_en.trim()
        ? r.color_en.trim()
        : (typeof r.color === "string" && r.color.trim() ? r.color.trim() : "#f7a60f"),
    is_bold_en: typeof r.is_bold_en === "boolean" ? r.is_bold_en : (typeof r.is_bold === "boolean" ? r.is_bold : true),
    is_italic_en: typeof r.is_italic_en === "boolean" ? r.is_italic_en : (typeof r.is_italic === "boolean" ? r.is_italic : null),

    color: typeof r.color === "string" && r.color.trim() ? r.color.trim() : null,
    font_size: r.font_size ?? "base",
    is_bold: typeof r.is_bold === "boolean" ? r.is_bold : null,
    is_italic: typeof r.is_italic === "boolean" ? r.is_italic : null,
  };
}

export type ResolvedGuestNameStyle = {
  font: string;
  fontSize: { fontSize?: string; className?: string };
  color: string;
  isBold: boolean;
  isItalic: boolean;
};

export function getResolvedGuestNameStyle(
  style: GuestNameStyle | null | undefined,
  isEn: boolean,
  defaultAccent: string = "#f7a60f"
): ResolvedGuestNameStyle {
  const norm = normalizeGuestNameStyle(style);

  if (isEn) {
    const font = resolveGuestNameFont(norm.font_en, true);
    const fontSize = getGuestNameFontSizeStyle(norm.font_size_en, true);
    const color = norm.color_en || norm.color || defaultAccent || "#f7a60f";
    const isBold = norm.is_bold_en !== false;
    const isItalic = Boolean(norm.is_italic_en);

    return { font, fontSize, color, isBold, isItalic };
  }

  const font = resolveGuestNameFont(norm.font_km, false);
  const fontSize = getGuestNameFontSizeStyle(norm.font_size_km, false);
  const color = norm.color_km || norm.color || defaultAccent || "#f7a60f";
  const isBold = Boolean(norm.is_bold_km);
  const isItalic = Boolean(norm.is_italic_km);

  return { font, fontSize, color, isBold, isItalic };
}

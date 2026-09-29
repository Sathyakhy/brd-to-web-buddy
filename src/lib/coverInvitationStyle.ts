import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

export type CoverInvitationFontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

export type CoverInvitationStyle = {
  // Khmer styling
  text_km?: string | null;
  color_km?: string | null;
  font_km?: string | null;
  font_size_km?: CoverInvitationFontSize | string | null;
  is_bold_km?: boolean | null;
  is_italic_km?: boolean | null;
  show_underline_km?: boolean | null;

  // English styling
  text_en?: string | null;
  color_en?: string | null;
  font_en?: string | null;
  font_size_en?: CoverInvitationFontSize | string | null;
  is_bold_en?: boolean | null;
  is_italic_en?: boolean | null;
  show_underline_en?: boolean | null;

  // Legacy fallback fields
  color?: string | null;
  font_size?: CoverInvitationFontSize | string | null;
  is_bold?: boolean | null;
  is_italic?: boolean | null;
  show_underline?: boolean | null;
};

export const DEFAULT_COVER_INVITATION_STYLE: CoverInvitationStyle = {
  text_km: null,
  color_km: null,
  font_km: null,
  font_size_km: "base",
  is_bold_km: null,
  is_italic_km: null,
  show_underline_km: true,

  text_en: null,
  color_en: null,
  font_en: null,
  font_size_en: "base",
  is_bold_en: null,
  is_italic_en: null,
  show_underline_en: true,
};

/**
 * Maps semantic font size to CSS size styles.
 */
export function getCoverInvitationFontSizeStyle(
  size: CoverInvitationFontSize | string | null | undefined,
  isEn: boolean
): { fontSize?: string; className?: string } {
  const s = size || "base";

  switch (s) {
    case "xs":
      return {
        fontSize: isEn ? "0.75rem" : "0.9rem",
      };
    case "sm":
      return {
        fontSize: isEn ? "0.875rem" : "1.05rem",
      };
    case "base":
      return {
        fontSize: isEn ? "1rem" : "1.25rem",
      };
    case "lg":
      return {
        fontSize: isEn ? "1.15rem" : "1.45rem",
      };
    case "xl":
      return {
        fontSize: isEn ? "1.35rem" : "1.7rem",
      };
    case "2xl":
      return {
        fontSize: isEn ? "1.6rem" : "2rem",
      };
    case "3xl":
      return {
        fontSize: isEn ? "1.9rem" : "2.4rem",
      };
    default:
      if (typeof s === "string" && (s.includes("px") || s.includes("rem") || s.includes("em") || s.includes("clamp"))) {
        return { fontSize: s };
      }
      return { fontSize: isEn ? "1rem" : "1.25rem" };
  }
}

/**
 * Resolves font family for the cover invitation title.
 */
export function resolveCoverInvitationFont(
  fontName: string | null | undefined,
  isEn: boolean
): string | undefined {
  if (!fontName) return undefined;
  // Check header font first, then body font
  const h = resolveHeaderFont(fontName, isEn);
  if (h) return h;
  const b = resolveBodyFont(fontName, isEn);
  if (b) return b;
  return fontName;
}

/**
 * Normalizes an unknown object or config into a clean CoverInvitationStyle.
 */
export function normalizeCoverInvitationStyle(raw: unknown): CoverInvitationStyle {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_COVER_INVITATION_STYLE };
  const r = raw as Record<string, any>;

  return {
    text_km: typeof r.text_km === "string" ? r.text_km : (typeof r.cover_invitation_text_km === "string" ? r.cover_invitation_text_km : null),
    color_km: typeof r.color_km === "string" && r.color_km.trim() ? r.color_km.trim() : (typeof r.color === "string" ? r.color : null),
    font_km: typeof r.font_km === "string" && r.font_km.trim() ? r.font_km.trim() : null,
    font_size_km: r.font_size_km ?? r.font_size ?? "base",
    is_bold_km: typeof r.is_bold_km === "boolean" ? r.is_bold_km : (typeof r.is_bold === "boolean" ? r.is_bold : null),
    is_italic_km: typeof r.is_italic_km === "boolean" ? r.is_italic_km : (typeof r.is_italic === "boolean" ? r.is_italic : null),
    show_underline_km: typeof r.show_underline_km === "boolean" ? r.show_underline_km : (typeof r.show_underline === "boolean" ? r.show_underline : true),

    text_en: typeof r.text_en === "string" ? r.text_en : (typeof r.cover_invitation_text_en === "string" ? r.cover_invitation_text_en : null),
    color_en: typeof r.color_en === "string" && r.color_en.trim() ? r.color_en.trim() : (typeof r.color === "string" ? r.color : null),
    font_en: typeof r.font_en === "string" && r.font_en.trim() ? r.font_en.trim() : null,
    font_size_en: r.font_size_en ?? r.font_size ?? "base",
    is_bold_en: typeof r.is_bold_en === "boolean" ? r.is_bold_en : (typeof r.is_bold === "boolean" ? r.is_bold : null),
    is_italic_en: typeof r.is_italic_en === "boolean" ? r.is_italic_en : (typeof r.is_italic === "boolean" ? r.is_italic : null),
    show_underline_en: typeof r.show_underline_en === "boolean" ? r.show_underline_en : (typeof r.show_underline === "boolean" ? r.show_underline : true),

    // legacy
    color: typeof r.color === "string" && r.color.trim() ? r.color.trim() : null,
    font_size: r.font_size ?? "base",
    is_bold: typeof r.is_bold === "boolean" ? r.is_bold : null,
    is_italic: typeof r.is_italic === "boolean" ? r.is_italic : null,
    show_underline: typeof r.show_underline === "boolean" ? r.show_underline : true,
  };
}

/**
 * Computes the resolved visual styling for a given language.
 */
export function getResolvedCoverTitleStyle(
  style: CoverInvitationStyle | null | undefined,
  isEn: boolean,
  defaultAccentColor: string = "#1a1a1a"
) {
  if (isEn) {
    const text = style?.text_en?.trim() || "INVITATION";
    const color = style?.color_en || style?.color || defaultAccentColor;
    const font = resolveCoverInvitationFont(style?.font_en, true);
    const fontSize = getCoverInvitationFontSizeStyle(style?.font_size_en ?? style?.font_size, true);
    const isBold = style?.is_bold_en ?? style?.is_bold ?? true;
    const isItalic = style?.is_italic_en ?? style?.is_italic ?? false;
    const showUnderline = style?.show_underline_en ?? style?.show_underline ?? true;

    return {
      text,
      color,
      font,
      fontSize,
      isBold,
      isItalic,
      showUnderline,
    };
  }

  const text = style?.text_km?.trim() || "សូមគោរពអញ្ជើញ";
  const color = style?.color_km || style?.color || defaultAccentColor;
  const font = resolveCoverInvitationFont(style?.font_km, false);
  const fontSize = getCoverInvitationFontSizeStyle(style?.font_size_km ?? style?.font_size, false);
  const isBold = style?.is_bold_km ?? style?.is_bold ?? false;
  const isItalic = style?.is_italic_km ?? style?.is_italic ?? false;
  const showUnderline = style?.show_underline_km ?? style?.show_underline ?? true;

  return {
    text,
    color,
    font,
    fontSize,
    isBold,
    isItalic,
    showUnderline,
  };
}

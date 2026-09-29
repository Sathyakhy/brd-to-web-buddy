import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

export type CoverInvitationFontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

export type CoverInvitationStyle = {
  text_km?: string | null;
  text_en?: string | null;
  color?: string | null;
  font_km?: string | null;
  font_en?: string | null;
  font_size?: CoverInvitationFontSize | string | null;
  is_bold?: boolean | null;
  is_italic?: boolean | null;
  show_underline?: boolean | null;
};

export const DEFAULT_COVER_INVITATION_STYLE: CoverInvitationStyle = {
  text_km: null,
  text_en: null,
  color: null,
  font_km: null,
  font_en: null,
  font_size: "base",
  is_bold: null,
  is_italic: null,
  show_underline: true,
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
    text_en: typeof r.text_en === "string" ? r.text_en : (typeof r.cover_invitation_text_en === "string" ? r.cover_invitation_text_en : null),
    color: typeof r.color === "string" && r.color.trim() ? r.color.trim() : (typeof r.cover_invitation_color === "string" ? r.cover_invitation_color : null),
    font_km: typeof r.font_km === "string" && r.font_km.trim() ? r.font_km.trim() : (typeof r.cover_invitation_font_km === "string" ? r.cover_invitation_font_km : null),
    font_en: typeof r.font_en === "string" && r.font_en.trim() ? r.font_en.trim() : (typeof r.cover_invitation_font_en === "string" ? r.cover_invitation_font_en : null),
    font_size: r.font_size ?? r.cover_invitation_font_size ?? "base",
    is_bold: typeof r.is_bold === "boolean" ? r.is_bold : (typeof r.cover_invitation_bold === "boolean" ? r.cover_invitation_bold : null),
    is_italic: typeof r.is_italic === "boolean" ? r.is_italic : (typeof r.cover_invitation_italic === "boolean" ? r.cover_invitation_italic : null),
    show_underline: typeof r.show_underline === "boolean" ? r.show_underline : (typeof r.cover_invitation_underline === "boolean" ? r.cover_invitation_underline : true),
  };
}

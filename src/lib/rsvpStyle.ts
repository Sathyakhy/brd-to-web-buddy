/**
 * RSVP Card styling configuration and calculation utilities.
 * Provides custom background, card shadow/glow, header text shadow/glow effects,
 * and font selection overrides for the RSVP section card.
 */

import { hexWithOpacity } from "@/components/admin/ElementStyleEditor";
import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

export type RsvpCardShadowType =
  | "default"
  | "accent_glow"
  | "soft_ambient"
  | "elegant_drop"
  | "rich_gold"
  | "dramatic"
  | "none"
  | "custom";

export type RsvpHeaderEffectType =
  | "default"
  | "gold_glow"
  | "soft_white"
  | "dark_shadow"
  | "outline"
  | "none"
  | "custom";

export type RsvpStyleConfig = {
  bg_color?: string | null;
  bg_opacity?: number | null;
  header_font?: string | null;
  header_font_en?: string | null;
  body_font?: string | null;
  body_font_en?: string | null;
  header_effect?: RsvpHeaderEffectType | string | null;
  header_effect_color?: string | null;
  header_effect_blur?: number | null;
  header_effect_x?: number | null;
  header_effect_y?: number | null;
  header_effect_opacity?: number | null;
  card_shadow_type?: RsvpCardShadowType | string | null;
  card_shadow_color?: string | null;
  card_shadow_blur?: number | null;
  card_shadow_spread?: number | null;
  card_shadow_x?: number | null;
  card_shadow_y?: number | null;
  card_shadow_opacity?: number | null;
};

export const RSVP_CARD_SHADOW_PRESETS: {
  id: RsvpCardShadowType;
  label: string;
  description: string;
}[] = [
  {
    id: "default",
    label: "Accent Gold Glow (Default)",
    description: "Subtle matching halo glow using the template accent color.",
  },
  {
    id: "soft_ambient",
    label: "Soft Ambient Shadow",
    description: "Smooth, modern drop shadow creating a gentle floating paper effect.",
  },
  {
    id: "elegant_drop",
    label: "Elegant Depth",
    description: "Deep, refined elevation with pronounced depth.",
  },
  {
    id: "rich_gold",
    label: "Rich Gold Halo",
    description: "Warm luminous golden radiance that accentuates festive wedding cards.",
  },
  {
    id: "dramatic",
    label: "Dramatic 3D Elevation",
    description: "High-contrast layered 3D shadow for maximum card prominence.",
  },
  {
    id: "none",
    label: "None (Flat Card)",
    description: "Clean bordered frame with no outer glow or drop shadow.",
  },
  {
    id: "custom",
    label: "Custom Shadow & Glow",
    description: "Manual control of shadow color, blur radius, spread, offsets, and opacity.",
  },
];

export const RSVP_HEADER_EFFECT_PRESETS: {
  id: RsvpHeaderEffectType;
  label: string;
  description: string;
}[] = [
  {
    id: "default",
    label: "Soft White Rim & Glow (Default)",
    description: "Subtle dual-layer white edge and soft halo for clear readability.",
  },
  {
    id: "gold_glow",
    label: "Warm Golden Shimmer",
    description: "Gleaming golden aura that matches ceremonial royal wedding accents.",
  },
  {
    id: "soft_white",
    label: "Soft White Halo",
    description: "Gentle radial white aura lifting text over textured or dark backgrounds.",
  },
  {
    id: "dark_shadow",
    label: "Crisp Dark Drop Shadow",
    description: "Sharp downward shadow for high legibility on light backgrounds.",
  },
  {
    id: "outline",
    label: "Subtle White Outline",
    description: "Surrounding 1px crisp outline around letterforms.",
  },
  {
    id: "none",
    label: "None (Flat Text)",
    description: "Clean typography without text shadow or glow effects.",
  },
  {
    id: "custom",
    label: "Custom Text Shadow",
    description: "Fine-tune color, blur radius, horizontal/vertical offsets, and opacity.",
  },
];

export function computeRsvpCardShadow(
  config?: Partial<RsvpStyleConfig> | null,
  accentColor: string = "#db9b0f"
): string {
  if (!config) return `0 0 12px ${hexWithOpacity(accentColor, 25)}`;

  const type = config.card_shadow_type || "default";
  const customColor = config.card_shadow_color || accentColor;
  const customOpacity = typeof config.card_shadow_opacity === "number" ? config.card_shadow_opacity : 30;
  const blur = typeof config.card_shadow_blur === "number" ? config.card_shadow_blur : 12;
  const spread = typeof config.card_shadow_spread === "number" ? config.card_shadow_spread : 0;
  const x = typeof config.card_shadow_x === "number" ? config.card_shadow_x : 0;
  const y = typeof config.card_shadow_y === "number" ? config.card_shadow_y : 0;

  switch (type) {
    case "none":
      return "none";
    case "soft_ambient":
      return "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)";
    case "elegant_drop":
      return "0 12px 32px rgba(0, 0, 0, 0.16), 0 4px 10px rgba(0, 0, 0, 0.08)";
    case "rich_gold": {
      const goldRgba = hexWithOpacity(accentColor, 45);
      return `0 0 22px ${goldRgba}, 0 4px 12px rgba(0, 0, 0, 0.1)`;
    }
    case "dramatic": {
      const goldTint = hexWithOpacity(accentColor, 25);
      return `0 18px 40px -10px rgba(0, 0, 0, 0.3), 0 0 16px ${goldTint}`;
    }
    case "custom": {
      const col = hexWithOpacity(customColor, customOpacity);
      return `${x}px ${y}px ${blur}px ${spread}px ${col}`;
    }
    case "accent_glow":
    case "default":
    default:
      return `0 0 12px ${hexWithOpacity(accentColor, 25)}`;
  }
}

export function computeRsvpHeaderShadow(
  config?: Partial<RsvpStyleConfig> | null,
  accentColor: string = "#db9b0f"
): string {
  if (!config) {
    return "1px 1px 0 rgba(255,255,255,0.6), 0 0 6px rgba(255,255,255,0.4)";
  }

  const type = config.header_effect || "default";
  const customColor = config.header_effect_color || "#ffffff";
  const customOpacity = typeof config.header_effect_opacity === "number" ? config.header_effect_opacity : 85;
  const blur = typeof config.header_effect_blur === "number" ? config.header_effect_blur : 6;
  const x = typeof config.header_effect_x === "number" ? config.header_effect_x : 0;
  const y = typeof config.header_effect_y === "number" ? config.header_effect_y : 0;

  switch (type) {
    case "none":
      return "none";
    case "gold_glow": {
      const goldRgba = hexWithOpacity(accentColor, 75);
      return `0 0 8px ${goldRgba}, 0 1px 2px rgba(0, 0, 0, 0.3)`;
    }
    case "soft_white":
      return "0 0 6px rgba(255, 255, 255, 0.95), 0 0 12px rgba(255, 255, 255, 0.5)";
    case "dark_shadow":
      return "0 2px 4px rgba(0, 0, 0, 0.45)";
    case "outline":
      return "-1px -1px 0 rgba(255,255,255,0.9), 1px -1px 0 rgba(255,255,255,0.9), -1px 1px 0 rgba(255,255,255,0.9), 1px 1px 0 rgba(255,255,255,0.9)";
    case "custom": {
      const col = hexWithOpacity(customColor, customOpacity);
      return `${x}px ${y}px ${blur}px ${col}`;
    }
    case "default":
    default:
      return "1px 1px 0 rgba(255,255,255,0.6), 0 0 6px rgba(255,255,255,0.4)";
  }
}

export function computeRsvpFonts(
  config: Partial<RsvpStyleConfig> | null | undefined,
  fallbackHeaderFont?: string | null,
  fallbackBodyFont?: string | null,
  isEn: boolean = false
): { headerFont?: string; bodyFont?: string } {
  const chosenHeader = isEn
    ? (config?.header_font_en || config?.header_font || fallbackHeaderFont)
    : (config?.header_font || config?.header_font_en || fallbackHeaderFont);

  const chosenBody = isEn
    ? (config?.body_font_en || config?.body_font || fallbackBodyFont)
    : (config?.body_font || config?.body_font_en || fallbackBodyFont);

  return {
    headerFont: chosenHeader ? resolveHeaderFont(chosenHeader, isEn) : undefined,
    bodyFont: chosenBody ? resolveBodyFont(chosenBody, isEn) : undefined,
  };
}

/**
 * Text shadow and visual effects configuration for invitation templates.
 * Supports distinct configurations for Headings/Titles vs Body/Details,
 * preset styles, and fine-tuning of shadow color, blur radius, offsets, and opacity.
 */

export type TextEffectType =
  | "none"
  | "soft_glow"
  | "dark_shadow"
  | "gold_glow"
  | "outline"
  | "custom";

export type TextEffectTarget = "all" | "headings_only" | "body_only";

export type TextShadowSettings = {
  enabled: boolean;
  type: TextEffectType;
  color: string;
  blur: number;
  offset_x: number;
  offset_y: number;
  opacity: number;
};

export type TextEffectConfig = {
  enabled: boolean;
  /** When true, Header and Body have independent shadow & effect parameters */
  separate_header_body: boolean;
  header: TextShadowSettings;
  body: TextShadowSettings;

  // Legacy fallback fields for backward compatibility
  type?: TextEffectType;
  color?: string;
  blur?: number;
  offset_x?: number;
  offset_y?: number;
  opacity?: number;
  apply_to?: TextEffectTarget;
};

export const DEFAULT_HEADER_SETTINGS: TextShadowSettings = {
  enabled: true,
  type: "gold_glow",
  color: "#db9b0f",
  blur: 6,
  offset_x: 0,
  offset_y: 1,
  opacity: 85,
};

export const DEFAULT_BODY_SETTINGS: TextShadowSettings = {
  enabled: true,
  type: "soft_glow",
  color: "#ffffff",
  blur: 3,
  offset_x: 0,
  offset_y: 0,
  opacity: 80,
};

export const DEFAULT_TEXT_EFFECT_CONFIG: TextEffectConfig = {
  enabled: true,
  separate_header_body: true,
  header: { ...DEFAULT_HEADER_SETTINGS },
  body: { ...DEFAULT_BODY_SETTINGS },
  type: "soft_glow",
  color: "#ffffff",
  blur: 4,
  offset_x: 0,
  offset_y: 0,
  opacity: 90,
  apply_to: "all",
};

export const TEXT_EFFECT_PRESETS: {
  id: TextEffectType;
  label: string;
  description: string;
  defaults: Partial<TextShadowSettings>;
}[] = [
  {
    id: "soft_glow",
    label: "Soft White Glow",
    description: "Gentle radial halo that makes text pop against textured backgrounds.",
    defaults: { color: "#ffffff", blur: 4, offset_x: 0, offset_y: 0, opacity: 90 },
  },
  {
    id: "gold_glow",
    label: "Golden Glow",
    description: "Warm regal shimmer matching wedding gold accents.",
    defaults: { color: "#db9b0f", blur: 6, offset_x: 0, offset_y: 1, opacity: 80 },
  },
  {
    id: "dark_shadow",
    label: "Dark Drop Shadow",
    description: "Classic drop shadow for crisp readability on bright surfaces.",
    defaults: { color: "#000000", blur: 4, offset_x: 0, offset_y: 2, opacity: 45 },
  },
  {
    id: "outline",
    label: "Subtle Outline",
    description: "Fine 1px border stroke around glyphs.",
    defaults: { color: "#ffffff", blur: 0, offset_x: 0, offset_y: 0, opacity: 95 },
  },
  {
    id: "custom",
    label: "Custom Shadow",
    description: "Full manual control over color, blur, X/Y offsets, and opacity.",
    defaults: { color: "#000000", blur: 6, offset_x: 1, offset_y: 3, opacity: 50 },
  },
];

export function hexToRgba(hex: string, opacityPercent: number = 100): string {
  const clean = (hex || "").trim().replace("#", "");
  const alpha = Math.max(0, Math.min(1, (opacityPercent ?? 100) / 100));
  if (!clean) return `rgba(0, 0, 0, ${alpha})`;
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function normalizeShadowSettings(raw: any, fallback: TextShadowSettings): TextShadowSettings {
  if (!raw || typeof raw !== "object") {
    return { ...fallback };
  }
  const enabled = raw.enabled !== undefined ? Boolean(raw.enabled) : fallback.enabled;
  const type = (["none", "soft_glow", "dark_shadow", "gold_glow", "outline", "custom"].includes(raw.type))
    ? raw.type as TextEffectType
    : fallback.type;
  const color = typeof raw.color === "string" && raw.color.trim() ? raw.color.trim() : fallback.color;
  const blur = typeof raw.blur === "number" ? Math.max(0, raw.blur) : fallback.blur;
  const offset_x = typeof raw.offset_x === "number" ? raw.offset_x : fallback.offset_x;
  const offset_y = typeof raw.offset_y === "number" ? raw.offset_y : fallback.offset_y;
  const opacity = typeof raw.opacity === "number" ? Math.max(0, Math.min(100, raw.opacity)) : fallback.opacity;

  return { enabled, type, color, blur, offset_x, offset_y, opacity };
}

/**
 * Normalizes raw input from event/template JSON into a valid TextEffectConfig.
 */
export function normalizeTextEffectConfig(raw: unknown): TextEffectConfig {
  if (!raw || typeof raw !== "object") {
    return {
      ...DEFAULT_TEXT_EFFECT_CONFIG,
      header: { ...DEFAULT_HEADER_SETTINGS },
      body: { ...DEFAULT_BODY_SETTINGS },
    };
  }

  const r = raw as Record<string, any>;
  const nested = (r.text_effect_config && typeof r.text_effect_config === "object")
    ? r.text_effect_config
    : (r.text_effects && typeof r.text_effects === "object")
    ? r.text_effects
    : r;

  const enabled = nested.enabled !== undefined
    ? Boolean(nested.enabled)
    : r.text_shadow_enabled !== undefined
    ? Boolean(r.text_shadow_enabled)
    : DEFAULT_TEXT_EFFECT_CONFIG.enabled;

  const separate_header_body = nested.separate_header_body !== undefined
    ? Boolean(nested.separate_header_body)
    : (nested.header !== undefined || nested.body !== undefined)
    ? true
    : false;

  // Derive legacy single-config values if present
  const legacyType = (["none", "soft_glow", "dark_shadow", "gold_glow", "outline", "custom"].includes(nested.type || r.text_effect_type))
    ? (nested.type || r.text_effect_type) as TextEffectType
    : "soft_glow";
  const legacyColor = typeof (nested.color || r.text_shadow_color) === "string" && (nested.color || r.text_shadow_color).trim()
    ? (nested.color || r.text_shadow_color).trim()
    : "#ffffff";
  const legacyBlur = typeof (nested.blur ?? r.text_shadow_blur) === "number"
    ? Number(nested.blur ?? r.text_shadow_blur)
    : 4;
  const legacyOffsetX = typeof (nested.offset_x ?? r.text_shadow_offset_x) === "number"
    ? Number(nested.offset_x ?? r.text_shadow_offset_x)
    : 0;
  const legacyOffsetY = typeof (nested.offset_y ?? r.text_shadow_offset_y) === "number"
    ? Number(nested.offset_y ?? r.text_shadow_offset_y)
    : 0;
  const legacyOpacity = typeof (nested.opacity ?? r.text_shadow_opacity) === "number"
    ? Math.max(0, Math.min(100, Number(nested.opacity ?? r.text_shadow_opacity)))
    : 90;
  const legacyApplyTo = (["all", "headings_only", "body_only"].includes(nested.apply_to || r.text_shadow_apply_to))
    ? (nested.apply_to || r.text_shadow_apply_to) as TextEffectTarget
    : "all";

  const legacySettings: TextShadowSettings = {
    enabled: true,
    type: legacyType,
    color: legacyColor,
    blur: legacyBlur,
    offset_x: legacyOffsetX,
    offset_y: legacyOffsetY,
    opacity: legacyOpacity,
  };

  const headerFallback: TextShadowSettings = nested.header
    ? DEFAULT_HEADER_SETTINGS
    : {
        ...legacySettings,
        enabled: legacyApplyTo !== "body_only",
      };

  const bodyFallback: TextShadowSettings = nested.body
    ? DEFAULT_BODY_SETTINGS
    : {
        ...legacySettings,
        enabled: legacyApplyTo !== "headings_only",
      };

  const header = normalizeShadowSettings(nested.header, headerFallback);
  const body = normalizeShadowSettings(nested.body, bodyFallback);

  return {
    enabled,
    separate_header_body,
    header,
    body,
    type: legacyType,
    color: legacyColor,
    blur: legacyBlur,
    offset_x: legacyOffsetX,
    offset_y: legacyOffsetY,
    opacity: legacyOpacity,
    apply_to: legacyApplyTo,
  };
}

function formatShadowString(s: TextShadowSettings): string {
  const rgba = hexToRgba(s.color || "#ffffff", s.opacity ?? 90);
  const blur = typeof s.blur === "number" ? Math.max(0, s.blur) : 4;
  const ox = typeof s.offset_x === "number" ? s.offset_x : 0;
  const oy = typeof s.offset_y === "number" ? s.offset_y : 0;

  switch (s.type) {
    case "soft_glow":
      return `0 0 ${blur}px ${rgba}`;
    case "dark_shadow":
      return `${ox}px ${oy || 2}px ${blur}px ${rgba}`;
    case "gold_glow": {
      const goldRgba = hexToRgba(s.color || "#db9b0f", s.opacity ?? 80);
      return `0 0 ${blur}px ${goldRgba}, ${ox}px ${oy || 1}px 3px rgba(0,0,0,0.35)`;
    }
    case "outline": {
      const c = rgba;
      return `-1px -1px 0 ${c}, 1px -1px 0 ${c}, -1px 1px 0 ${c}, 1px 1px 0 ${c}`;
    }
    case "custom":
    default:
      return `${ox}px ${oy}px ${blur}px ${rgba}`;
  }
}

/**
 * Computes the CSS `text-shadow` property value based on the configuration.
 * Returns undefined when text effects are disabled or not applicable to the target element.
 */
export function computeTextShadow(
  config: TextEffectConfig | null | undefined,
  isHeading: boolean = false
): string | undefined {
  if (!config || !config.enabled) {
    return undefined;
  }
  const norm = normalizeTextEffectConfig(config);
  if (!norm.enabled) return undefined;

  if (norm.separate_header_body) {
    const s = isHeading ? norm.header : norm.body;
    if (!s || !s.enabled || s.type === "none") {
      return undefined;
    }
    return formatShadowString(s);
  }

  // Unified mode
  if (norm.apply_to === "headings_only" && !isHeading) {
    return undefined;
  }
  if (norm.apply_to === "body_only" && isHeading) {
    return undefined;
  }

  const unified: TextShadowSettings = {
    enabled: norm.enabled,
    type: norm.type || "soft_glow",
    color: norm.color || "#ffffff",
    blur: norm.blur ?? 4,
    offset_x: norm.offset_x ?? 0,
    offset_y: norm.offset_y ?? 0,
    opacity: norm.opacity ?? 90,
  };

  if (unified.type === "none") {
    return undefined;
  }

  return formatShadowString(unified);
}

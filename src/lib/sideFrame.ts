/**
 * Side Ornamental Frame Configuration
 *
 * Exclusively displays decorative ornamental frames uploaded and managed in the
 * Asset Library (PNG/SVG images or MP4/WebM videos).
 */

export type SideFrameStyle = "custom";

export type SideFramePlacement = "both" | "left" | "right";

export type SideFrameDisplayMode = "screen-edge" | "content-flank";

export type SideFrameResponsiveScale = "auto" | "compact" | "fixed";

export type SideFrameConfig = {
  enabled: boolean;
  style?: SideFrameStyle | string;
  placement?: SideFramePlacement;
  customUrl?: string | null;      // Direct URL to the frame image or video
  mediaType?: "image" | "video";  // Image or video frame overlay
  frameAssetId?: string | null;   // Reference ID in ornamental_frames table
  color?: string | null;          // Custom hex tint, defaults to event accent color / gold
  opacity?: number;               // 0 to 100, default 85
  width?: number;                 // Base width in px (default 52px)
  showOnMobile?: boolean;         // Default true (auto-scaled on small screens)
  mode?: SideFrameDisplayMode;    // "screen-edge" (viewport sides) or "content-flank" (beside invitation card)
  responsiveScale?: SideFrameResponsiveScale; // "auto" (fluid clamp), "compact", "fixed"
};

export const DEFAULT_SIDE_FRAME_CONFIG: SideFrameConfig = {
  enabled: false,
  style: "custom",
  placement: "both",
  customUrl: null,
  mediaType: "image",
  frameAssetId: null,
  color: null,
  opacity: 85,
  width: 52,
  showOnMobile: true,
  mode: "screen-edge",
  responsiveScale: "auto",
};

/**
 * Normalizes unknown jsonb config into a valid `SideFrameConfig`.
 */
export function normalizeSideFrameConfig(raw: unknown): SideFrameConfig {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SIDE_FRAME_CONFIG };
  }
  const r = raw as any;

  const validPlacements: SideFramePlacement[] = ["both", "left", "right"];
  const placement: SideFramePlacement = validPlacements.includes(r.placement) ? r.placement : "both";

  const validModes: SideFrameDisplayMode[] = ["screen-edge", "content-flank"];
  const mode: SideFrameDisplayMode = r.mode === "flank" || r.mode === "content-flank" ? "content-flank" : "screen-edge";

  const validScales: SideFrameResponsiveScale[] = ["auto", "compact", "fixed"];
  const responsiveScale: SideFrameResponsiveScale = validScales.includes(r.responsiveScale) ? r.responsiveScale : "auto";

  const opacity = typeof r.opacity === "number" && !isNaN(r.opacity)
    ? Math.max(0, Math.min(100, Math.round(r.opacity)))
    : 85;

  const width = typeof r.width === "number" && !isNaN(r.width)
    ? Math.max(16, Math.min(160, Math.round(r.width)))
    : 52;

  const enabled = Boolean(
    r.enabled ?? r.side_frame_enabled ?? (raw as any).side_frame
  );

  const customUrl = typeof r.customUrl === "string" ? r.customUrl : typeof r.custom_url === "string" ? r.custom_url : null;
  const mediaType: "image" | "video" = r.mediaType === "video" || r.media_type === "video" ? "video" : "image";
  const frameAssetId = typeof r.frameAssetId === "string" ? r.frameAssetId : typeof r.frame_asset_id === "string" ? r.frame_asset_id : null;

  return {
    enabled,
    style: "custom",
    placement,
    customUrl,
    mediaType,
    frameAssetId,
    color: typeof r.color === "string" && r.color.trim() ? r.color.trim() : null,
    opacity,
    width,
    showOnMobile: r.showOnMobile !== false && r.show_on_mobile !== false,
    mode,
    responsiveScale,
  };
}

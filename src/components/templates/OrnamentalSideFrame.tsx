import React from "react";
import { SideFrameConfig, normalizeSideFrameConfig } from "@/lib/sideFrame";
import AgendaIconImage from "./AgendaIconImage";

type Props = {
  config?: unknown;
  accentColor?: string | null;
  /** Positioning mode: "fixed" covers the viewport; "absolute" stays inside parent (e.g. PreviewPanel). */
  positionMode?: "fixed" | "absolute";
  /** Optional container class */
  className?: string;
};

/**
 * OrnamentalSideFrame — renders decorative ornamental borders / vines / pillars
 * on the sides of the screen (or flanking the invitation canvas).
 * Fully responsive across Mobile, Tablet, Desktop, and Ultrawide viewports.
 */
export default function OrnamentalSideFrame({
  config,
  accentColor,
  positionMode = "fixed",
  className = "",
}: Props) {
  const cfg: SideFrameConfig = normalizeSideFrameConfig(config);

  if (!cfg.enabled) {
    return null;
  }

  // Resolved tint color: custom color -> event accent color -> fallback royal gold
  const tintColor = cfg.color && cfg.color.trim()
    ? cfg.color.trim()
    : accentColor && accentColor.trim()
      ? accentColor.trim()
      : "#db9b0f";

  const opacityDecimal = (cfg.opacity ?? 85) / 100;
  const baseWidth = cfg.width ?? 52;
  const scaleMode = cfg.responsiveScale ?? "auto";
  const showLeft = cfg.placement === "both" || cfg.placement === "left";
  const showRight = cfg.placement === "both" || cfg.placement === "right";
  const isContentFlank = cfg.mode === "content-flank";

  const mobileClass = cfg.showOnMobile ? "block" : "hidden md:block";

  // Unique SVG IDs for gradients/filters
  const gradId = `side-frame-grad-${tintColor.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Compute CSS clamp expression based on scaleMode
  let widthCss = `${baseWidth}px`;
  if (scaleMode === "auto") {
    // Dynamically scales: ~20px on small phones -> 36px on tablet -> baseWidth on desktop
    widthCss = `clamp(20px, 4.5vw, ${baseWidth}px)`;
  } else if (scaleMode === "compact") {
    const maxCompact = Math.max(18, Math.min(baseWidth * 0.65, 34));
    widthCss = `clamp(16px, 3.5vw, ${maxCompact}px)`;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none z-30 ${mobileClass} ${className}`}
      style={{
        position: positionMode,
        inset: 0,
        width: "100%",
        height: positionMode === "fixed" ? "100vh" : "100%",
        maxHeight: positionMode === "fixed" ? "100vh" : "100%",
        overflow: "hidden",
        opacity: opacityDecimal,
        // Responsive CSS custom properties
        ["--side-frame-w" as any]: widthCss,
      }}
    >
      {/* SVG Definitions for metallic gold shading */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tintColor} stopOpacity="0.95" />
            <stop offset="35%" stopColor="#fff8e7" stopOpacity="0.8" />
            <stop offset="70%" stopColor={tintColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#8a5a0d" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id={`${gradId}-vert`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={tintColor} stopOpacity="0.9" />
            <stop offset="15%" stopColor="#fff8e7" stopOpacity="0.95" />
            <stop offset="50%" stopColor={tintColor} stopOpacity="1" />
            <stop offset="85%" stopColor="#fff8e7" stopOpacity="0.95" />
            <stop offset="100%" stopColor={tintColor} stopOpacity="0.9" />
          </linearGradient>
          <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>

      {/* Left side border */}
      {showLeft && (
        <div
          className="absolute top-0 bottom-0 flex flex-col items-start transition-all duration-300 pointer-events-none"
          style={{
            width: "var(--side-frame-w)",
            maxWidth: "18vw",
            // If content-flank on desktop, flank the 42rem (672px) central invitation column
            left: isContentFlank
              ? "max(env(safe-area-inset-left, 0px), calc(50% - 336px - var(--side-frame-w) - 6px))"
              : "env(safe-area-inset-left, 0px)",
          }}
        >
          <SideOrnamentRender
            style={cfg.style}
            side="left"
            tintColor={tintColor}
            gradId={gradId}
            customUrl={cfg.customUrl}
            mediaType={cfg.mediaType}
          />
        </div>
      )}

      {/* Right side border */}
      {showRight && (
        <div
          className="absolute top-0 bottom-0 flex flex-col items-end transition-all duration-300 pointer-events-none"
          style={{
            width: "var(--side-frame-w)",
            maxWidth: "18vw",
            // If content-flank on desktop, flank the 42rem (672px) central invitation column
            right: isContentFlank
              ? "max(env(safe-area-inset-right, 0px), calc(50% - 336px - var(--side-frame-w) - 6px))"
              : "env(safe-area-inset-right, 0px)",
            transform: "scaleX(-1)", // Mirror left art for perfect symmetry
          }}
        >
          <SideOrnamentRender
            style={cfg.style}
            side="right"
            tintColor={tintColor}
            gradId={gradId}
            customUrl={cfg.customUrl}
            mediaType={cfg.mediaType}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Side ornament renderer for custom uploaded frames from Asset Library
 */
function SideOrnamentRender({
  tintColor,
  customUrl,
  mediaType = "image",
}: {
  style?: string;
  side: "left" | "right";
  tintColor: string;
  gradId?: string;
  customUrl?: string | null;
  mediaType?: "image" | "video";
}) {
  if (!customUrl) {
    return null;
  }

  const isVideo =
    mediaType === "video" ||
    (typeof customUrl === "string" &&
      (customUrl.endsWith(".mp4") || customUrl.endsWith(".webm") || customUrl.includes("video")));

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden">
      {isVideo ? (
        <video
          src={customUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover object-left"
          style={{
            filter: `drop-shadow(0 2px 6px ${tintColor}44)`,
          }}
        />
      ) : (
        <img
          src={customUrl}
          alt="Ornamental side frame"
          className="w-full h-full object-cover object-left"
          style={{
            filter: `drop-shadow(0 2px 6px ${tintColor}44)`,
          }}
        />
      )}
    </div>
  );
}

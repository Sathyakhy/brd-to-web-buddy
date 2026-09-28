import React, { useEffect, useState } from "react";
import {
  EnvelopeUnboxingConfig,
  COLOR_THEMES,
  SEAL_PATTERNS,
  envelopeAudio,
  getUnboxingTiming,
} from "@/lib/envelopeUnboxing";

type Props = {
  config: EnvelopeUnboxingConfig;
  guestName: string;
  title: string;
  accentColor?: string | null;
  language?: "km" | "en";
  /** Triggered when the 3D reveal animation finishes transitioning */
  onComplete: () => void;
  /** Front-page background image used for the 3D effect */
  coverBackgroundUrl?: string | null;
  /** Monogram or decorative header graphic */
  monogramGraphicUrl?: string | null;
  /** Embedded within preview panel (keeps absolute bounds) */
  isEmbedded?: boolean;
};

export default function Interactive3DEnvelopeUnboxing({
  config,
  guestName,
  title,
  accentColor,
  language = "km",
  onComplete,
  coverBackgroundUrl,
  monogramGraphicUrl,
  isEmbedded = false,
}: Props) {
  const isEn = language === "en";
  // Started in closed state (isOpen = false), flips to true after mounting tick to guarantee CSS 3D transition fires
  const [isOpen, setIsOpen] = useState(false);
  const [fadedOut, setFadedOut] = useState(false);

  // Speed and timing calculations
  const { tOpen, tFade } = getUnboxingTiming(config);

  // Front background resolution (uses cover background if available)
  const frontBg = coverBackgroundUrl || "/templates/khmer-traditional/background.webp";

  useEffect(() => {
    // Play tactile sound effect immediately upon unboxing
    if (config.sound_effects) {
      envelopeAudio.playUnboxSound(config.style);
    }

    // A small 40ms timeout ensures the browser renders the closed (0deg) state first,
    // guaranteeing the CSS transition animation executes smoothly on all browsers & mobile devices.
    const timerOpen = setTimeout(() => {
      setIsOpen(true);
    }, 40);

    // When the 3D opening completes its majestic motion, smoothly fade out overlay into the live invitation
    const timerFade = setTimeout(() => {
      setFadedOut(true);

      const timerDone = setTimeout(() => {
        onComplete();
      }, tFade);

      return () => clearTimeout(timerDone);
    }, tOpen + 60);

    return () => {
      clearTimeout(timerOpen);
      clearTimeout(timerFade);
    };
  }, [config.sound_effects, config.style, onComplete, tOpen, tFade]);

  const theme =
    COLOR_THEMES.find((c) => c.id === config.color_theme) || COLOR_THEMES[0];
  const effectiveAccent = accentColor || config.seal_color || theme.accent;
  const sealColor = config.seal_color || theme.sealDefault;
  const sealPatternObj =
    SEAL_PATTERNS.find((p) => p.id === config.seal_pattern) || SEAL_PATTERNS[0];
  const sealIcon =
    config.seal_pattern === "monogram"
      ? (config.seal_text ? config.seal_text.slice(0, 4) : "✨")
      : sealPatternObj.icon;

  return (
    <div
      className={`w-full h-full min-h-screen overflow-hidden select-none pointer-events-none ${
        isEmbedded ? "absolute inset-0 z-40" : "fixed inset-0 z-50"
      }`}
      style={{
        perspective: "1600px",
        perspectiveOrigin: "50% 50%",
        opacity: fadedOut ? 0 : 1,
        transition: `opacity ${tFade}ms ease-out`,
        willChange: "transform, opacity",
      }}
    >
      {/* ========================================================================= */}
      {/* STYLE 1: ROYAL PALACE GATEFOLD / DOUBLE DOORS                             */}
      {/* ========================================================================= */}
      {config.style === "royal-gatefold" && (
        <div
          className="absolute inset-0 w-full h-full flex overflow-hidden"
          style={{
            perspective: "1600px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Left Door Half */}
          <div
            className="relative w-1/2 h-full z-20 overflow-hidden shadow-2xl flex items-center justify-end"
            style={{
              transformOrigin: "left center",
              transform: isOpen ? "rotateY(-118deg)" : "rotateY(0deg)",
              transition: `transform ${tOpen}ms cubic-bezier(0.25, 1, 0.4, 1)`,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Front Background Slice (Left 50%) */}
            <div
              className="absolute inset-0 w-[200%] h-full pointer-events-none"
              style={{
                backgroundImage: `url(${frontBg})`,
                backgroundSize: "cover",
                backgroundPosition: "left center",
                backgroundRepeat: "no-repeat",
              }}
            />
            {/* 3D Inner Door Shading & Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: "inset -20px 0 50px rgba(0,0,0,0.65)",
                background: "linear-gradient(90deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.25) 100%)",
              }}
            />

            {/* Left Ornate Royal Handle & Crest */}
            <div
              className="relative z-30 mr-2 sm:mr-4 w-11 h-28 sm:w-14 sm:h-36 rounded-full flex flex-col items-center justify-center p-1 shadow-2xl"
              style={{
                background: "linear-gradient(180deg, #fce09b 0%, #c69214 50%, #684a04 100%)",
                boxShadow: "0 10px 28px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.8)",
              }}
            >
              <span className="text-amber-950 text-sm sm:text-base font-bold drop-shadow">⚜</span>
              <div className="w-1.5 h-10 sm:h-12 bg-amber-950/40 rounded-full my-1" />
              <span className="text-amber-950 text-[10px] sm:text-xs">✦</span>
            </div>
          </div>

          {/* Right Door Half */}
          <div
            className="relative w-1/2 h-full z-20 overflow-hidden shadow-2xl flex items-center justify-start"
            style={{
              transformOrigin: "right center",
              transform: isOpen ? "rotateY(118deg)" : "rotateY(0deg)",
              transition: `transform ${tOpen}ms cubic-bezier(0.25, 1, 0.4, 1)`,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {/* Front Background Slice (Right 50%) */}
            <div
              className="absolute inset-0 w-[200%] h-full pointer-events-none"
              style={{
                left: "-100%",
                backgroundImage: `url(${frontBg})`,
                backgroundSize: "cover",
                backgroundPosition: "right center",
                backgroundRepeat: "no-repeat",
              }}
            />
            {/* 3D Inner Door Shading */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: "inset 20px 0 50px rgba(0,0,0,0.65)",
                background: "linear-gradient(270deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.25) 100%)",
              }}
            />

            {/* Right Ornate Royal Handle & Crest */}
            <div
              className="relative z-30 ml-2 sm:ml-4 w-11 h-28 sm:w-14 sm:h-36 rounded-full flex flex-col items-center justify-center p-1 shadow-2xl"
              style={{
                background: "linear-gradient(180deg, #fce09b 0%, #c69214 50%, #684a04 100%)",
                boxShadow: "0 10px 28px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.8)",
              }}
            >
              <span className="text-amber-950 text-sm sm:text-base font-bold drop-shadow">⚜</span>
              <div className="w-1.5 h-10 sm:h-12 bg-amber-950/40 rounded-full my-1" />
              <span className="text-amber-950 text-[10px] sm:text-xs">✦</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLE 2: CLASSIC 3D WAX SEAL ENVELOPE                                     */}
      {/* ========================================================================= */}
      {config.style === "classic-envelope" && (
        <div
          className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `url(${frontBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transformStyle: "preserve-3d",
            transform: isOpen ? "scale(1.15) translateY(-40px)" : "scale(1) translateY(0)",
            transition: `transform ${tOpen}ms cubic-bezier(0.25, 1, 0.4, 1)`,
          }}
        >
          {/* Top 3D Envelope Flap flipping 180 degrees upward */}
          <div
            className="absolute top-0 left-0 right-0 h-[52%] z-30"
            style={{
              backgroundImage: `url(${frontBg})`,
              backgroundSize: "cover",
              backgroundPosition: "top center",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "top center",
              transform: isOpen ? "rotateX(-175deg)" : "rotateX(0deg)",
              transition: `transform ${tOpen * 0.9}ms cubic-bezier(0.35, 0, 0.2, 1)`,
              boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: `repeating-linear-gradient(45deg, ${effectiveAccent}15, ${effectiveAccent}15 10px, transparent 10px, transparent 20px)`,
              }}
            />
          </div>

          {/* Wax Seal Stamp cracking / popping off */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40"
            style={{
              transform: isOpen
                ? "translate(-50%, -50%) scale(0.2) rotate(45deg) translateY(-90px)"
                : "translate(-50%, -50%) scale(1) rotate(0deg)",
              opacity: isOpen ? 0 : 1,
              transition: `transform ${tOpen * 0.7}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${tOpen * 0.45}ms ease-in`,
            }}
          >
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center p-1 shadow-2xl"
              style={{
                background: `radial-gradient(circle at 35% 35%, color-mix(in srgb, ${sealColor} 60%, #ffffff) 0%, ${sealColor} 60%, color-mix(in srgb, ${sealColor} 70%, #000000) 100%)`,
                boxShadow: "0 12px 30px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.6)",
              }}
            >
              <span className="text-2xl sm:text-3xl font-serif font-bold text-amber-100 drop-shadow">
                {sealIcon}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLE 3: GRAND VELVET THEATRE CURTAINS                                    */}
      {/* ========================================================================= */}
      {config.style === "curtain-reveal" && (
        <div
          className="absolute inset-0 w-full h-full flex overflow-hidden"
          style={{
            perspective: "1600px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Left Curtain */}
          <div
            className="relative w-1/2 h-full z-20 shadow-2xl"
            style={{
              backgroundImage: `url(${frontBg})`,
              backgroundSize: "200% 100%",
              backgroundPosition: "left center",
              transformOrigin: "left center",
              transform: isOpen ? "translateX(-95%) scaleX(0.2)" : "translateX(0%) scaleX(1)",
              transition: `transform ${tOpen}ms cubic-bezier(0.35, 0, 0.2, 1)`,
              boxShadow: "-10px 0 40px rgba(0,0,0,0.8)",
            }}
          />

          {/* Right Curtain */}
          <div
            className="relative w-1/2 h-full z-20 shadow-2xl"
            style={{
              backgroundImage: `url(${frontBg})`,
              backgroundSize: "200% 100%",
              backgroundPosition: "right center",
              transformOrigin: "right center",
              transform: isOpen ? "translateX(95%) scaleX(0.2)" : "translateX(0%) scaleX(1)",
              transition: `transform ${tOpen}ms cubic-bezier(0.35, 0, 0.2, 1)`,
              boxShadow: "10px 0 40px rgba(0,0,0,0.8)",
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLE 4: VINTAGE LACE TRIFOLD POCKET                                      */}
      {/* ========================================================================= */}
      {config.style === "vintage-pocket" && (
        <div
          className="absolute inset-0 w-full h-full flex overflow-hidden"
          style={{
            perspective: "1600px",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Left Wing */}
          <div
            className="relative w-1/2 h-full z-20 shadow-2xl"
            style={{
              backgroundImage: `url(${frontBg})`,
              backgroundSize: "200% 100%",
              backgroundPosition: "left center",
              transformOrigin: "left center",
              transform: isOpen ? "rotateY(-120deg)" : "rotateY(0deg)",
              transition: `transform ${tOpen}ms cubic-bezier(0.35, 0, 0.2, 1)`,
              boxShadow: "inset -15px 0 30px rgba(0,0,0,0.5)",
            }}
          />
          {/* Right Wing */}
          <div
            className="relative w-1/2 h-full z-20 shadow-2xl"
            style={{
              backgroundImage: `url(${frontBg})`,
              backgroundSize: "200% 100%",
              backgroundPosition: "right center",
              transformOrigin: "right center",
              transform: isOpen ? "rotateY(120deg)" : "rotateY(0deg)",
              transition: `transform ${tOpen}ms cubic-bezier(0.35, 0, 0.2, 1)`,
              boxShadow: "inset 15px 0 30px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* STYLE 5: SILK RIBBON GIFT BOX UNBOXING                                    */}
      {/* ========================================================================= */}
      {config.style === "ribbon-unfold" && (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
          style={{
            backgroundImage: `url(${frontBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transformOrigin: "top center",
            transform: isOpen
              ? "rotateX(-115deg) translateY(-90px) scale(1.1)"
              : "rotateX(0deg) translateY(0) scale(1)",
            opacity: isOpen ? 0 : 1,
            transition: `transform ${tOpen}ms cubic-bezier(0.3, 1, 0.4, 1), opacity ${tOpen}ms ease`,
            boxShadow: "0 25px 60px rgba(0,0,0,0.8)",
          }}
        >
          {/* Vertical Ribbon */}
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 shadow-2xl"
            style={{
              background: `linear-gradient(90deg, #8a5a04 0%, ${sealColor} 50%, #fde08b 100%)`,
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            }}
          />
          {/* Horizontal Ribbon */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 sm:h-16 shadow-2xl"
            style={{
              background: `linear-gradient(180deg, #8a5a04 0%, ${sealColor} 50%, #fde08b 100%)`,
              boxShadow: "0 0 20px rgba(0,0,0,0.4)",
            }}
          />
          {/* Center Bow / Crest */}
          <div
            className="relative z-30 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl"
            style={{
              background: `radial-gradient(circle, #fce09b 0%, ${sealColor} 60%, #684a04 100%)`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.7)",
            }}
          >
            <span className="text-2xl sm:text-3xl font-serif text-amber-950 font-bold">🎁</span>
          </div>
        </div>
      )}
    </div>
  );
}

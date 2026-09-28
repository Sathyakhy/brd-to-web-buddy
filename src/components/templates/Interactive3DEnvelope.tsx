import { useEffect, useRef, useState } from "react";
import { Sparkles, Volume2, VolumeX, RotateCcw, ChevronRight } from "lucide-react";
import {
  EnvelopeConfig,
  SILK_THEMES,
  normalizeEnvelopeConfig,
} from "@/lib/envelopeConfig";
import { LanguageCode } from "@/lib/dualLanguage";

// Web Audio API organic sound synthesizer for zero-dependency unboxing audio cues
function playUnboxSounds(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // 1. Wax seal crack sound (crisp burst with noise filter)
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3.0, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Silk ribbon slide whoosh (soft filtered sweep)
    const osc1 = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(320, now + 0.08);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.35);
    oscGain.gain.setValueAtTime(0.0, now);
    oscGain.gain.linearRampToValueAtTime(0.18, now + 0.12);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc1.start(now + 0.08);
    osc1.stop(now + 0.45);

    // 3. Golden bell / celebratory shimmer chime
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = "triangle";
      chimeOsc.frequency.setValueAtTime(freq, now + 0.25 + idx * 0.06);
      chimeGain.gain.setValueAtTime(0.0, now);
      chimeGain.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.25 + idx * 0.06);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9 + idx * 0.1);
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 0.25 + idx * 0.06);
      chimeOsc.stop(now + 1.1 + idx * 0.1);
    });
  } catch (e) {
    // Audio context may be restricted before user gesture; gracefully fallback
  }
}

type Props = {
  guestName: string;
  title: string;
  eventDate?: string | null;
  venue?: string | null;
  config?: Partial<EnvelopeConfig> | null;
  language?: LanguageCode;
  onOpen: () => void;
  positionMode?: "fixed" | "absolute";
  /** Allows preview resetting */
  allowReplay?: boolean;
};

export default function Interactive3DEnvelope({
  guestName,
  title,
  eventDate,
  venue,
  config,
  language = "km",
  onOpen,
  positionMode = "fixed",
  allowReplay = false,
}: Props) {
  const isEn = language === "en";
  const cfg = normalizeEnvelopeConfig(config);
  const theme = SILK_THEMES.find((t) => t.id === cfg.silk_theme) || SILK_THEMES[0];

  // Unboxing ritual states:
  // "sealed" -> "breaking" (seal cracked, ribbon peeling) -> "opening_flap" -> "card_rising" -> "completed"
  const [stage, setStage] = useState<"sealed" | "breaking" | "opening_flap" | "card_rising" | "completed">("sealed");
  const [soundEnabled, setSoundEnabled] = useState(cfg.unboxing_sound);
  const [isHovered, setIsHovered] = useState(false);
  const [isPullingRibbon, setIsPullingRibbon] = useState(false);
  const [ribbonPullProgress, setRibbonPullProgress] = useState(0); // 0 to 100

  // Derive colors
  const silkPrimary = cfg.custom_silk_color || theme.primaryColor;
  const silkSecondary = theme.secondaryColor;
  const goldAccent = theme.accentColor;

  const triggerUnboxing = () => {
    if (stage !== "sealed") return;
    playUnboxSounds(soundEnabled);
    setStage("breaking");

    // Sequence the 3D animation stages
    setTimeout(() => {
      setStage("opening_flap");
    }, 450);

    setTimeout(() => {
      setStage("card_rising");
    }, 950);

    setTimeout(() => {
      setStage("completed");
      onOpen();
    }, 1800);
  };

  const handleReplay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStage("sealed");
    setRibbonPullProgress(0);
  };

  return (
    <div
      lang="km"
      className={`${
        positionMode === "fixed" ? "fixed inset-0 z-50" : "absolute inset-0 z-30"
      } flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-700`}
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #20130b 0%, #0c0704 100%)`,
      }}
      onClick={triggerUnboxing}
    >
      {/* Ambient Silk Atmosphere Glow & Floating Dust Particles */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${silkPrimary} 25%, transparent) 0%, transparent 70%)`,
        }}
      />

      {/* Top Bar Controls (Sound & Language hint) */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSoundEnabled(!soundEnabled);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-black/60 transition-colors text-xs font-sans"
          title={soundEnabled ? "Sound enabled" : "Sound muted"}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-amber-300" /> : <VolumeX className="h-3.5 w-3.5 text-white/50" />}
          <span className="hidden sm:inline text-[11px]">{soundEnabled ? (isEn ? "Sound On" : "សំឡេង") : (isEn ? "Muted" : "បិទសំឡេង")}</span>
        </button>

        {allowReplay && stage !== "sealed" && (
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md border border-amber-400/40 text-amber-200 hover:bg-amber-500/30 transition-colors text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="text-[11px]">{isEn ? "Replay Unboxing" : "បើកសារឡើងវិញ"}</span>
          </button>
        )}
      </div>

      {/* Main 3D Perspective Stage */}
      <div
        className="relative w-full max-w-[420px] px-4 sm:px-6 flex flex-col items-center justify-center"
        style={{ perspective: "1200px" }}
      >
        {/* The 3D Silk Envelope Container */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative w-full aspect-[1.38/1] rounded-2xl shadow-2xl transition-transform duration-500 cursor-pointer ${
            isHovered && stage === "sealed" ? "scale-[1.02] -translate-y-1" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.7), 0 0 40px color-mix(in srgb, ${goldAccent} 20%, transparent)`,
          }}
        >
          {/* Silk Fabric Base Texture & Slub Weave Overlay */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${silkPrimary} 0%, ${silkSecondary} 100%)`,
              border: `1.5px solid color-mix(in srgb, ${goldAccent} 60%, transparent)`,
            }}
          >
            {/* Cambodian Woven Silk Slub Texture Overlay */}
            <div
              aria-hidden
              className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `radial-gradient(${goldAccent} 0.75px, transparent 0.75px), radial-gradient(${goldAccent} 0.75px, transparent 0.75px)`,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 4px 4px",
              }}
            />

            {/* Silk Sheen diagonal light beam */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.12) 45%, rgba(255,235,160,0.18) 50%, transparent 60%)",
              }}
            />

            {/* Traditional Gold Foil Kbach Filigree Corner Ornaments */}
            <div className="absolute top-2 left-2 w-7 h-7 border-t-2 border-l-2 border-amber-300/80 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-2 right-2 w-7 h-7 border-t-2 border-r-2 border-amber-300/80 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-7 h-7 border-b-2 border-l-2 border-amber-300/80 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-7 h-7 border-b-2 border-r-2 border-amber-300/80 rounded-br-sm pointer-events-none" />
          </div>

          {/* Internal Envelope Lining (Gold Kbach Pattern seen when flap opens) */}
          <div
            aria-hidden
            className="absolute inset-2 rounded-xl overflow-hidden opacity-90 pointer-events-none"
            style={{
              background: `linear-gradient(180deg, #8a6523 0%, #463009 100%)`,
              border: "1px solid #d4af37",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(#ffd700 1px, transparent 1px)`,
                backgroundSize: "12px 12px",
              }}
            />
          </div>

          {/* 3D Invitation Letter Card (Slides up from inside the envelope pocket) */}
          <div
            className={`absolute inset-x-4 top-4 bottom-4 rounded-xl shadow-xl transition-all duration-1000 ease-out flex flex-col items-center justify-center p-4 text-center ${
              stage === "card_rising" || stage === "completed"
                ? "-translate-y-[68%] scale-[1.04] z-30 opacity-100"
                : "translate-y-0 scale-95 z-10 opacity-0 pointer-events-none"
            }`}
            style={{
              background: "linear-gradient(180deg, #fffdfa 0%, #f7f1e1 100%)",
              border: "1.5px solid #d4af37",
              boxShadow: "0 15px 35px rgba(0,0,0,0.45)",
            }}
          >
            {/* Ornate Gold Header Border on Letter */}
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-1" />
            
            <p className="text-[11px] sm:text-xs font-serif text-amber-900/80 tracking-wider uppercase font-semibold">
              {isEn ? "Wedding Invitation" : "សិរីសួស្តី អាពាហ៍ពិពាហ៍"}
            </p>

            <h3 className="text-base sm:text-lg font-khmer-moul text-amber-950 mt-1 mb-0.5 line-clamp-1">
              {title}
            </h3>

            {cfg.show_guest_name && (
              <div className="my-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80">
                <span className="text-xs sm:text-sm font-semibold text-amber-900 font-khmer-siemreap">
                  {guestName || (isEn ? "Honored Guest" : "ភ្ញៀវកិត្តិយស")}
                </span>
              </div>
            )}

            {eventDate && (
              <p className="text-[10px] sm:text-xs text-amber-800/80 font-medium">
                {eventDate}
              </p>
            )}

            <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium animate-pulse">
              <span>{isEn ? "Entering celebration…" : "កំពុងបើកធៀប…"}</span>
              <Sparkles className="h-3 w-3 text-amber-500" />
            </div>
          </div>

          {/* Lower Pocket & Envelope Front Surface (Sits over the sliding card) */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-20 flex flex-col justify-end p-4 sm:p-5"
            style={{
              clipPath: "polygon(0 38%, 50% 68%, 100% 38%, 100% 100%, 0 100%)",
              background: `linear-gradient(180deg, ${silkPrimary} 0%, ${silkSecondary} 100%)`,
              boxShadow: "inset 0 2px 6px rgba(255,255,255,0.15), 0 -4px 12px rgba(0,0,0,0.3)",
              borderBottom: `2px solid color-mix(in srgb, ${goldAccent} 60%, transparent)`,
            }}
          >
            {/* Gold Embroidered Border on Envelope Pocket V-Shape */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(135deg, transparent 48%, rgba(247,207,114,0.35) 50%, transparent 52%)`,
              }}
            />
          </div>

          {/* Guest Personalization Gold Nameplate on Envelope Front */}
          {cfg.show_guest_name && stage === "sealed" && (
            <div
              className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-25 w-[85%] max-w-[310px] flex flex-col items-center justify-center text-center pointer-events-none"
              style={{
                padding: "8px 16px",
                borderRadius: "12px",
                background: "linear-gradient(180deg, rgba(20, 10, 5, 0.75) 0%, rgba(10, 5, 2, 0.85) 100%)",
                border: "1px solid rgba(247, 207, 114, 0.4)",
                boxShadow: "0 6px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <span className="text-[10px] sm:text-[11px] text-amber-200/90 font-khmer-koulen tracking-wider">
                {isEn ? "CORDIALLY INVITED" : "សូមគោរពអញ្ជើញ"}
              </span>
              <span
                className="text-sm sm:text-base font-bold text-amber-300 font-khmer-moul truncate max-w-full px-1"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(247,207,114,0.4)",
                }}
              >
                {guestName || (isEn ? "Honored Guest" : "ភ្ញៀវកិត្តិយស")}
              </span>
            </div>
          )}

          {/* Traditional Silk Ribbon Wrap */}
          {cfg.ribbon_style !== "none" && (
            <div
              className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-9 sm:w-11 pointer-events-none transition-all duration-700 z-24 ${
                stage !== "sealed" ? "opacity-0 scale-y-0 -translate-y-8" : "opacity-100"
              }`}
              style={{
                background:
                  cfg.ribbon_style === "crimson_brocade"
                    ? "linear-gradient(90deg, #590916 0%, #a8243b 30%, #f3a8b6 50%, #a8243b 70%, #590916 100%)"
                    : cfg.ribbon_style === "emerald_satin"
                    ? "linear-gradient(90deg, #093321 0%, #176845 30%, #9be4c2 50%, #176845 70%, #093321 100%)"
                    : "linear-gradient(90deg, #8a651a 0%, #dfb54b 28%, #fff4c2 50%, #dfb54b 72%, #8a651a 100%)",
                boxShadow: "0 0 10px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.4)",
                borderLeft: "1px solid rgba(255,255,255,0.25)",
                borderRight: "1px solid rgba(0,0,0,0.3)",
              }}
            >
              {/* Ribbon gold stitching lines */}
              <div className="absolute inset-y-0 left-1 w-px border-r border-amber-100/40" />
              <div className="absolute inset-y-0 right-1 w-px border-r border-amber-100/40" />
            </div>
          )}

          {/* 3D Top Flap (Flips open 180 degrees backward) */}
          <div
            className={`absolute top-0 inset-x-0 h-[62%] rounded-t-2xl transition-transform duration-700 ease-in-out origin-top z-25 ${
              stage === "opening_flap" || stage === "card_rising" || stage === "completed"
                ? "-rotate-x-180"
                : "rotate-x-0"
            }`}
            style={{
              transformStyle: "preserve-3d",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              background: `linear-gradient(180deg, ${silkPrimary} 0%, ${silkSecondary} 100%)`,
              borderTop: `1.5px solid color-mix(in srgb, ${goldAccent} 60%, transparent)`,
              boxShadow: "0 8px 20px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top Flap Gold Kbach Accent */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 20%, rgba(255,225,140,0.25) 0%, transparent 60%)`,
              }}
            />
          </div>

          {/* 3D Embossed Cambodian Wax Seal & Monogram Stamp */}
          <div
            className={`absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 transition-all duration-500 cursor-pointer ${
              stage === "breaking" || stage === "opening_flap" || stage === "card_rising" || stage === "completed"
                ? "scale-125 opacity-0 rotate-12"
                : isHovered
                ? "scale-105"
                : "scale-100"
            }`}
          >
            {/* Wax Seal Organic Rim and High-Relief Coin */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-1"
              style={{
                background:
                  cfg.wax_seal_color === "ruby"
                    ? "radial-gradient(circle at 35% 30%, #bf1b34 0%, #700617 70%, #38010a 100%)"
                    : cfg.wax_seal_color === "emerald"
                    ? "radial-gradient(circle at 35% 30%, #1f8558 0%, #0d4a2f 70%, #042114 100%)"
                    : "radial-gradient(circle at 35% 30%, #f3cb65 0%, #bf8a24 60%, #684507 100%)",
                boxShadow:
                  "0 8px 18px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.6)",
                border: "2px solid rgba(255,235,160,0.4)",
              }}
            >
              {/* Realistic Molten Wax Scallop Edge */}
              <div
                aria-hidden
                className="absolute inset-0 rounded-full border border-amber-200/50 opacity-80"
                style={{
                  clipPath:
                    "polygon(50% 0%, 65% 5%, 78% 2%, 88% 12%, 98% 22%, 95% 35%, 100% 50%, 95% 65%, 98% 78%, 88% 88%, 78% 98%, 65% 95%, 50% 100%, 35% 95%, 22% 98%, 12% 88%, 2% 78%, 5% 65%, 0% 50%, 5% 35%, 2% 22%, 12% 12%, 22% 2%, 35% 5%)",
                }}
              />

              {/* Inner Embossed Seal Bed */}
              <div
                className="w-12 h-12 sm:w-15 sm:h-15 rounded-full flex flex-col items-center justify-center text-center border border-amber-900/30"
                style={{
                  background:
                    cfg.wax_seal_color === "ruby"
                      ? "radial-gradient(circle, #850c1e 0%, #520410 100%)"
                      : cfg.wax_seal_color === "emerald"
                      ? "radial-gradient(circle, #105234 0%, #062b1a 100%)"
                      : "radial-gradient(circle, #d49c2e 0%, #875c13 100%)",
                  boxShadow: "inset 0 2px 5px rgba(0,0,0,0.6), 0 1px 2px rgba(255,255,255,0.3)",
                }}
              >
                {cfg.wax_seal_type === "khmer_monogram" ? (
                  <span
                    className="text-xs sm:text-sm font-khmer-moul font-bold"
                    style={{
                      color: "#fff3cc",
                      textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(255,235,160,0.5)",
                    }}
                  >
                    {cfg.monogram_initials || "ស · រ"}
                  </span>
                ) : cfg.wax_seal_type === "royal_lotus" ? (
                  <span className="text-sm sm:text-base leading-none">🪷</span>
                ) : cfg.wax_seal_type === "golden_crest" ? (
                  <span className="text-sm sm:text-base leading-none">⚜️</span>
                ) : (
                  <span className="text-sm sm:text-base leading-none">♾️</span>
                )}

                <span
                  className="text-[8px] sm:text-[9px] font-khmer-koulen mt-0.5 tracking-tighter"
                  style={{ color: "#ffeaa7", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                >
                  {isEn ? (cfg.seal_label_en || "OPEN") : (cfg.seal_label_km || "បើក")}
                </span>
              </div>

              {/* Pulsing Light Glow Ring */}
              <div className="absolute inset-0 rounded-full border border-amber-300 opacity-50 animate-ping pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tactile Interaction Hint & CTA Pill */}
        {stage === "sealed" && (
          <div className="mt-8 flex flex-col items-center gap-2 text-center pointer-events-auto">
            <button
              type="button"
              onClick={triggerUnboxing}
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-amber-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 border border-amber-200/80 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-950 animate-spin" style={{ animationDuration: "4s" }} />
              <span className={isEn ? "font-serif tracking-wide" : "font-khmer-moul"}>
                {isEn ? "Tap to Unbox Invitation" : "ចុចដើម្បីបើកធៀបមង្គល"}
              </span>
              <ChevronRight className="h-4 w-4 text-amber-950 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <p className="text-[11px] sm:text-xs text-amber-200/60 font-khmer-siemreap">
              {isEn ? "✨ Touch the wax seal or ribbon to open" : "✨ ចុចលើត្រាមង្គល ឬខ្សែបូដើម្បីបើក"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

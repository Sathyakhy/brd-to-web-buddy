import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

type Props = {
  guestName: string;
  title: string;
  /** Cover photo behind the floral frame. */
  backgroundUrl?: string | null;
  /** Optional decorative title graphic over the top. */
  titleGraphicUrl?: string | null;
  /** Optional ambient background music URL. When provided, autoplays muted
      and a speaker toggle lets the guest unmute. */
  musicUrl?: string | null;
  /** Optional admin-uploaded ornamental frame (PNG/SVG, transparent center,
      OR an MP4/WebM video). Sourced from the Asset Library. */
  frameUrl?: string | null;
  /** Tells the renderer whether `frameUrl` is an `<img>` or `<video>`.
      Defaults to "image" for backwards compatibility. */
  frameType?: "image" | "video";
  /** Fired when the open button is pressed — parent triggers the fade-out. */
  onOpen: () => void;
  /** When true, the cover starts its exit animation. */
  closing?: boolean;
  /** Positioning mode. `fixed` (default) covers the whole viewport on the
      live invite page. `absolute` keeps the cover inside its parent so it
      can be embedded inside a device-frame preview. */
  positionMode?: "fixed" | "absolute";
  /** Event accent color used to tint the guest-name gradient on the gold
   *  ribbon. Defaults to the template's traditional warm-brown when absent. */
  accentColor?: string | null;
  /** Distinct color configuration specifically for the Open Invitation button.
   *  Defaults to accentColor when not provided. */
  openButtonColor?: string | null;
  /** Language version: "km" (Khmer) or "en" (English) */
  language?: "km" | "en";
};

const FRAME = "/templates/signature-package-01/frame.png";

/**
 * Signature Package cover screen.
 *
 * A premium framed cover that overlays the actual invitation. The cover
 * photo (`backgroundUrl`) appears behind a floral+gold frame, the guest's
 * name sits on a gold ribbon plate, and a glowing play button reveals the
 * invitation underneath via fade-out animation.
 *
 * Optional ambient music plays softly with a top-right speaker toggle.
 */
export default function SignaturePackageCover({
  guestName,
  title,
  backgroundUrl,
  titleGraphicUrl,
  musicUrl,
  frameUrl,
  frameType = "image",
  onOpen,
  closing,
  positionMode = "fixed",
  accentColor,
  openButtonColor,
  language = "km",
}: Props) {
  const isEn = language === "en";
  // Premium 4-stop gradient anchored on the event accent — bright top
  // highlight + mid body + slightly deeper bottom for a metallic shine.
  const accent = accentColor && accentColor.trim() ? accentColor.trim() : "#a87614";
  const nameGradient = `linear-gradient(180deg,
    color-mix(in srgb, ${accent} 18%, #ffffff) 0%,
    color-mix(in srgb, ${accent} 60%, #ffffff) 28%,
    color-mix(in srgb, ${accent} 92%, #ffffff) 62%,
    color-mix(in srgb, ${accent} 78%, #ffffff) 100%)`;
  const frameSrc = frameUrl || FRAME;
  const isVideoFrame = frameType === "video" && !!frameUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Try a soft autoplay (muted) so the audio element is primed for an
  // unmute click. Most browsers allow muted autoplay.
  useEffect(() => {
    if (!audioRef.current || !musicUrl) return;
    audioRef.current.volume = 0.5;
    audioRef.current.muted = true;
    audioRef.current.play().catch(() => { /* ignore */ });
  }, [musicUrl]);

  const toggleSound = () => {
    if (!audioRef.current) return;
    setHasInteracted(true);
    const next = !muted;
    setMuted(next);
    audioRef.current.muted = next;
    if (!next) audioRef.current.play().catch(() => {});
  };

  const handleOpen = () => {
    // Ensure audio kicks off if the user opens before toggling sound.
    if (audioRef.current && !muted) audioRef.current.play().catch(() => {});
    onOpen();
  };

  return (
    <div
      lang="km"
      aria-hidden={closing}
      className={[
        positionMode === "fixed" ? "fixed inset-0 z-50" : "absolute inset-0 z-30",
        "flex items-center justify-center overflow-hidden",
        "transition-all duration-700 ease-in-out",
        closing ? "opacity-0 scale-110 pointer-events-none" : "opacity-100 scale-100",
      ].join(" ")}
      style={{
        background:
          "radial-gradient(ellipse at center, #2a1a0a 0%, #0d0500 100%)",
      }}
    >
      {/* Cover photo — fills the frame, sits behind the floral border */}
      <div className="absolute inset-0">
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="h-full w-full object-cover sp-cover-fade"
            style={{
              filter: "saturate(1.05) brightness(0.95)",
            }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background:
                "linear-gradient(160deg, #c9a766 0%, #6b4f1f 60%, #2a1a0a 100%)",
            }}
          />
        )}
        {/* Soft inner vignette to lift center subjects */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>

      {/* Floral + gold frame overlay (slightly oversized so the edges
          spill off-screen for a cleaner, more immersive look on mobile).
          Renders as <video> when the chosen library asset is a video; the
          underlying transparency is preserved so cover photo + content
          show through the centre window. */}
      {isVideoFrame ? (
        <video
          src={frameSrc}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            top: "50%",
            left: "50%",
            width: "112%",
            height: "112%",
            transform: "translate(-50%, -50%)",
            objectFit: "fill",
            filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.45))",
          }}
        />
      ) : (
        <img
          src={frameSrc}
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            top: "50%",
            left: "50%",
            width: "112%",
            height: "112%",
            transform: "translate(-50%, -50%)",
            objectFit: "fill",
            filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.45))",
          }}
        />
      )}

      {/* Top-right music & menu controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {musicUrl && (
          <button
            type="button"
            onClick={toggleSound}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            className="h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
              border: "1px solid #d4a93a",
            }}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" style={{ color: "#7a4e0b" }} />
            ) : (
              <Volume2 className="h-5 w-5" style={{ color: "#7a4e0b" }} />
            )}
          </button>
        )}
      </div>

      {/* Centered content stack — sits inside the frame */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-md mx-auto px-10 sm:px-14 py-10 sm:py-14 pointer-events-none">
        {/* Title graphic at top */}
        <div className="flex items-center justify-center mt-4 sm:mt-6 pointer-events-auto">
          {titleGraphicUrl ? (
            <img
              src={titleGraphicUrl}
              alt={title}
              className="w-[200px] sm:w-[240px] max-w-[70vw]"
              style={{
                filter:
                  "drop-shadow(0 2px 6px rgba(255,255,255,0.5)) drop-shadow(0 0 14px rgba(255,196,70,0.5))",
              }}
            />
          ) : (
            <h1
              className="text-center font-khmer-moul"
              style={{
                fontSize: "clamp(1.4rem, 5vw, 2.2rem)",
                color: "#f5d76e",
                textShadow:
                  "0 1px 0 #b8861f, 0 2px 8px rgba(0,0,0,0.5), 0 0 16px rgba(245,215,110,0.6)",
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}
        </div>

        {/* Spacer middle (cover photo shows here) */}
        <div className="flex-1" />

        {/* Bottom invite block */}
        <div className="w-full flex flex-col items-center gap-3 pointer-events-auto">
          <p
            className={`text-center ${isEn ? "font-serif tracking-widest uppercase font-semibold text-sm sm:text-base" : "font-khmer-moul"}`}
            style={{
              fontSize: isEn ? undefined : "clamp(1.1rem, 4vw, 1.5rem)",
              color: "#fff8dc",
              textShadow: "0 2px 6px rgba(0,0,0,0.6), 0 0 10px rgba(245,215,110,0.5)",
            }}
          >
            {isEn ? "Cordially Invites You" : "សូមគោរពអញ្ជើញ"}
          </p>

          {/* Gold name ribbon */}
          <div
            className="relative w-[90%] max-w-[340px] flex items-center justify-center"
            style={{
              padding: "10px 24px",
              borderRadius: 999,
              background:
                "linear-gradient(180deg, #f5d76e 0%, #d4a93a 50%, #a87614 100%)",
              boxShadow:
                "0 6px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 6px rgba(120,70,0,0.35)",
              border: "1px solid #fff3b0",
            }}
          >
            <span
              className="block w-full text-center font-serif font-bold truncate sp-name-shimmer"
              style={{
                fontSize: "clamp(1.05rem, 4vw, 1.35rem)",
                letterSpacing: "0.04em",
                background: nameGradient,
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: [
                  "drop-shadow(0 1px 0 rgba(255,255,255,0.6))",
                  `drop-shadow(0 2px 5px color-mix(in srgb, ${accent} 55%, transparent))`,
                  "drop-shadow(0 3px 10px rgba(60,30,0,0.4))",
                ].join(" "),
              }}
              title={guestName}
            >
              {guestName}
            </span>
          </div>

          {/* Open label */}
          <p
            className={`mt-3 ${isEn ? "font-serif font-bold tracking-wider text-sm sm:text-base" : "font-khmer-moul"}`}
            style={{
              fontSize: isEn ? undefined : "clamp(0.95rem, 3.4vw, 1.15rem)",
              color: "#fff8dc",
              textShadow: "0 2px 4px rgba(0,0,0,0.6)",
            }}
          >
            {isEn ? "Open Invitation" : "បើកសំបុត្រ"}
          </p>

          {/* Premium gold play button */}
          {(() => {
            const btnColor = (openButtonColor && openButtonColor.trim())
              ? openButtonColor.trim()
              : accent;
            return (
              <button
                type="button"
                onClick={handleOpen}
                aria-label="Open invitation"
                className="relative inline-flex items-center justify-center sp-pulse transition-transform hover:scale-110 active:scale-95"
                style={{
                  height: 64,
                  width: 64,
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${btnColor} 25%, #ffffff) 0%, color-mix(in srgb, ${btnColor} 60%, #ffffff) 35%, ${btnColor} 70%, color-mix(in srgb, ${btnColor} 85%, #000000) 100%)`,
                  boxShadow: `0 10px 24px rgba(0,0,0,0.5), 0 0 24px color-mix(in srgb, ${btnColor} 65%, transparent), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -3px 8px rgba(0,0,0,0.45)`,
                  border: `2px solid color-mix(in srgb, ${btnColor} 30%, #ffffff)`,
                  cursor: "pointer",
                }}
              >
                <Play
                  className="h-7 w-7 ml-1"
                  style={{ color: "#2a1800", filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.4))" }}
                  fill="currentColor"
                />
                {/* Ping ring */}
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full opacity-70 animate-ping"
                  style={{ border: `2px solid ${btnColor}` }}
                />
              </button>
            );
          })()}
        </div>
      </div>

      {/* Hidden audio element */}
      {musicUrl && (
        <audio ref={audioRef} src={musicUrl} loop preload="auto" />
      )}

      {/* Local animations — kept in component to avoid touching global CSS */}
      <style>{`
        @keyframes sp-cover-fade-in {
          0% { opacity: 0; transform: scale(1.06); }
          100% { opacity: 1; transform: scale(1); }
        }
        .sp-cover-fade {
          animation: sp-cover-fade-in 1.6s ease-out both;
        }
        @keyframes sp-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .sp-pulse {
          animation: sp-pulse 2s ease-in-out infinite;
        }
        @keyframes sp-name-shimmer {
          0%   { background-position: 200% 50%; }
          100% { background-position: -100% 50%; }
        }
        .sp-name-shimmer {
          animation: sp-name-shimmer 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

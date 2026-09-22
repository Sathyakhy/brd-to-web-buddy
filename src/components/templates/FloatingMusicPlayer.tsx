import { useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";

type Props = {
  musicUrl?: string | null;
  /** Accent colour used for borders, glow, and icon (defaults to gold #db9b0f). */
  accentColor?: string;
  /** Position on screen: bottom-right (default), top-right, or bottom-left. */
  position?: "bottom-right" | "top-right" | "bottom-left";
  /** Optional container positioning mode. Defaults to "fixed". */
  positionMode?: "fixed" | "absolute";
  /** If true, do not attempt automatic playback on mount; wait for explicit click. */
  disableAutoPlay?: boolean;
  /** If a bottom-right floating contact widget is active, offset this player so they stack neatly without overlap. */
  hasBottomContact?: boolean;
};

export default function FloatingMusicPlayer({
  musicUrl,
  accentColor = "#db9b0f",
  position = "bottom-right",
  positionMode = "fixed",
  disableAutoPlay = false,
  hasBottomContact = false,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const userPausedRef = useRef(false);

  useEffect(() => {
    if (!musicUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    userPausedRef.current = false;
    audio.volume = 0.55;

    if (disableAutoPlay) {
      return () => {
        audio.pause();
      };
    }

    // Try initiating playback. Browsers may reject without prior user interaction.
    const startPlay = () => {
      if (userPausedRef.current) return;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    };

    // Attempt direct play (e.g. if opened after a click on gate/cover)
    startPlay();

    // Set up one-time user interaction handlers to start audio as soon as
    // guest touches or clicks the invitation page.
    const onFirstUserAction = () => {
      if (!userPausedRef.current) {
        startPlay();
      }
      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener("pointerdown", onFirstUserAction);
      window.removeEventListener("touchstart", onFirstUserAction);
      window.removeEventListener("click", onFirstUserAction);
      window.removeEventListener("scroll", onFirstUserAction, { capture: true });
    };

    window.addEventListener("pointerdown", onFirstUserAction, { once: true });
    window.addEventListener("touchstart", onFirstUserAction, { once: true, passive: true });
    window.addEventListener("click", onFirstUserAction, { once: true });
    window.addEventListener("scroll", onFirstUserAction, { once: true, capture: true, passive: true });

    return () => {
      cleanupListeners();
      audio.pause();
    };
  }, [musicUrl, disableAutoPlay]);

  if (!musicUrl || !musicUrl.trim()) return null;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    setHasInteracted(true);
    if (isPlaying) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Could not play audio:", err);
        });
    }
  };

  let posClass: string;
  if (positionMode === "absolute") {
    if (position === "bottom-right") {
      posClass = "absolute bottom-4 right-4 z-40";
    } else if (position === "top-right") {
      posClass = "absolute top-3 right-3 z-40";
    } else {
      posClass = "absolute bottom-4 left-4 z-40";
    }
  } else {
    if (position === "bottom-right") {
      posClass = hasBottomContact
        ? "fixed bottom-24 right-5 z-[9999] sm:bottom-28 sm:right-6"
        : "fixed bottom-5 right-5 z-[9999] sm:bottom-6 sm:right-6";
    } else if (position === "top-right") {
      posClass = "fixed top-4 right-4 z-40 sm:top-6 sm:right-6";
    } else {
      posClass = "fixed bottom-5 left-5 z-40 sm:bottom-6 sm:left-6";
    }
  }

  return (
    <div className={posClass}>
      <audio
        ref={audioRef}
        src={musicUrl}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause background music" : "Play background music"}
        title={isPlaying ? "Music playing — tap to pause" : "Music paused — tap to play"}
        className="group relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 focus:outline-none"
        style={{
          background: isPlaying
            ? "radial-gradient(circle at 35% 35%, rgba(35, 25, 12, 0.95), rgba(10, 8, 4, 0.98))"
            : "radial-gradient(circle at 35% 35%, rgba(20, 20, 20, 0.85), rgba(5, 5, 5, 0.95))",
          border: `1.5px solid ${isPlaying ? accentColor : "rgba(255, 255, 255, 0.2)"}`,
          boxShadow: isPlaying
            ? `0 0 16px ${accentColor}50, 0 4px 12px rgba(0, 0, 0, 0.6)`
            : "0 4px 10px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Subtle spinning vinyl groove rings */}
        <div
          className={`absolute inset-1 rounded-full border border-white/10 pointer-events-none transition-transform duration-700 ${
            isPlaying ? "animate-[spin_6s_linear_infinite]" : ""
          }`}
          style={{
            backgroundImage:
              "repeating-radial-gradient(circle at center, transparent 0, transparent 2px, rgba(255, 255, 255, 0.05) 3px, transparent 4px)",
          }}
        />

        {/* Music note icon */}
        <div className="relative z-10 flex items-center justify-center">
          <Music
            className={`h-5 w-5 transition-all duration-300 ${
              isPlaying
                ? "animate-[musicPulse_2s_ease-in-out_infinite]"
                : "text-white/60 group-hover:text-white"
            }`}
            style={{
              color: isPlaying ? accentColor : undefined,
              filter: isPlaying ? `drop-shadow(0 0 6px ${accentColor}90)` : undefined,
            }}
          />
          {/* Subtle slash line when paused to indicate mute/off state */}
          {!isPlaying && (
            <span
              className="absolute w-[20px] h-[1.8px] bg-white/70 rotate-45 rounded-full pointer-events-none shadow-sm"
              style={{ top: "45%" }}
            />
          )}
        </div>

        {/* Floating audio ripple badge when playing */}
        {isPlaying && (
          <span
            className="absolute -top-1 -right-1 flex h-3 w-3"
            aria-hidden="true"
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: accentColor }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ background: accentColor }}
            />
          </span>
        )}
      </button>

      {/* Embedded CSS for keyframes */}
      <style>{`
        @keyframes musicPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.12) rotate(6deg);
          }
        }
      `}</style>
    </div>
  );
}

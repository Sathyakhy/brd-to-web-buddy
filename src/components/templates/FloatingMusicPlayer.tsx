import { useCallback, useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";

type Props = {
  musicUrl?: string | null;
  /** Accent colour used for borders, glow, and icon (defaults to gold #db9b0f). */
  accentColor?: string;
  /** Position on screen: bottom-right (default), top-right, or bottom-left. */
  position?: "bottom-right" | "top-right" | "bottom-left";
  /** Optional container positioning mode. Defaults to "fixed". */
  positionMode?: "fixed" | "absolute" | "inline";
  /** If true, do not attempt automatic playback on mount; wait for explicit click. */
  disableAutoPlay?: boolean;
  /** Imperative trigger (e.g. timestamp or incrementing counter) to immediately start playback, e.g. when opening invitation. */
  playTrigger?: number | boolean;
  /** If a bottom-right floating contact widget is active, offset this player so they stack neatly without overlap. */
  hasBottomContact?: boolean;
};

export default function FloatingMusicPlayer({
  musicUrl,
  accentColor = "#db9b0f",
  position = "bottom-right",
  positionMode = "fixed",
  disableAutoPlay = false,
  playTrigger,
  hasBottomContact = false,
}: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const userPausedRef = useRef(false);
  const cleanupListenersRef = useRef<(() => void) | null>(null);

  const playAudio = useCallback(async (): Promise<boolean> => {
    const audio = audioRef.current;
    if (!audio || !musicUrl || userPausedRef.current) return false;

    try {
      audio.volume = 0.55;
      const promise = audio.play();
      if (promise !== undefined) {
        await promise;
      }
      setIsPlaying(true);
      return true;
    } catch (err) {
      // Browser autoplay policy rejected unmuted playback without prior user interaction
      setIsPlaying(false);
      return false;
    }
  }, [musicUrl]);

  // Imperative play trigger (e.g. user tapped "Open Invitation")
  useEffect(() => {
    if (!playTrigger || !musicUrl) return;
    const audio = audioRef.current;
    if (!audio) return;
    userPausedRef.current = false;
    playAudio();
  }, [playTrigger, musicUrl, playAudio]);

  // Autoplay handler on mount / source change / autoplay enable
  useEffect(() => {
    // Clean up any existing listeners first
    if (cleanupListenersRef.current) {
      cleanupListenersRef.current();
      cleanupListenersRef.current = null;
    }

    if (!musicUrl) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (disableAutoPlay) {
      return;
    }

    userPausedRef.current = false;
    let cancelled = false;

    const events = [
      "click",
      "touchend",
      "touchstart",
      "pointerup",
      "scroll",
      "keydown",
    ] as const;

    const removeEventListeners = () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, onUserInteraction, { capture: true } as any);
        document.removeEventListener(evt, onUserInteraction, { capture: true } as any);
      });
    };

    const onUserInteraction = async () => {
      if (cancelled || userPausedRef.current) {
        removeEventListeners();
        return;
      }
      const started = await playAudio();
      if (started) {
        removeEventListeners();
        cleanupListenersRef.current = null;
      }
    };

    cleanupListenersRef.current = removeEventListeners;

    // 1. Attempt direct immediate playback on link open
    playAudio().then((success) => {
      if (success || cancelled) return;

      // 2. If blocked by browser autoplay policy, listen across user activation events
      events.forEach((evt) => {
        window.addEventListener(evt, onUserInteraction, { capture: true, passive: true });
        document.addEventListener(evt, onUserInteraction, { capture: true, passive: true });
      });

      // Also retry when audio can play in case buffering delayed initial play attempt
      const onCanPlay = () => {
        if (!cancelled && !userPausedRef.current && audio.paused) {
          playAudio().then((ok) => {
            if (ok) {
              removeEventListeners();
              cleanupListenersRef.current = null;
            }
          });
        }
      };
      audio.addEventListener("canplay", onCanPlay, { once: true });
    });

    return () => {
      cancelled = true;
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
    };
  }, [musicUrl, disableAutoPlay, playAudio]);

  // Pause audio when unmounting
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      if (cleanupListenersRef.current) {
        cleanupListenersRef.current();
        cleanupListenersRef.current = null;
      }
    };
  }, []);

  if (!musicUrl || !musicUrl.trim()) return null;

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      userPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
    } else {
      userPausedRef.current = false;
      await playAudio();
    }
  };

  let posClass: string;
  if (positionMode === "inline") {
    posClass = "relative";
  } else if (positionMode === "absolute") {
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
        playsInline
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

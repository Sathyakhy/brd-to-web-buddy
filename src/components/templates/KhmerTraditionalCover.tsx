import { useEffect, useRef, useState } from "react";

function isKhmerChar(ch: string): boolean {
  const cp = ch.codePointAt(0) || 0;
  return (cp >= 0x1780 && cp <= 0x17ff) || (cp >= 0x19e0 && cp <= 0x19ff);
}

function splitByScript(text: string): { text: string; isKhmer: boolean }[] {
  if (!text) return [];
  const segments: { text: string; isKhmer: boolean }[] = [];
  let current = "";
  let currentIsKhmer = isKhmerChar(text[0]);
  for (const ch of text) {
    const khmer = isKhmerChar(ch);
    if (khmer === currentIsKhmer) {
      current += ch;
    } else {
      segments.push({ text: current, isKhmer: currentIsKhmer });
      current = ch;
      currentIsKhmer = khmer;
    }
  }
  if (current) segments.push({ text: current, isKhmer: currentIsKhmer });
  return segments;
}

type Props = {
  guestName: string;
  title: string;
  /** Optional override for the front-page background image (admin upload). */
  backgroundUrl?: string | null;
  /** Optional override for the centered "សិរីនិត" name graphic. */
  nameGraphicUrl?: string | null;
  /** Event accent color used for the guest-name gradient. Defaults to the
   *  template's traditional gold when not provided. */
  accentColor?: string | null;
  /** Language version: "km" (Khmer) or "en" (English) */
  language?: "km" | "en";
  onOpen: () => void;
};

const DEFAULT_BG = "/templates/khmer-traditional/background.webp";
const DEFAULT_NAME = "/templates/khmer-traditional/name.webp";
const DEFAULT_PLATE = "/templates/khmer-traditional/name-plate.webp";
const DEFAULT_CLICK = "/templates/khmer-traditional/click.gif";

/**
 * Khmer Traditional cover screen.
 * Full-bleed ornate background, central decorative name graphic,
 * "សូមគោរពអញ្ជើញ" caption, gold name plate (auto-fit), and
 * pulsing gold "បើកធៀប" pill button with a click-hand cue.
 */
export default function KhmerTraditionalCover({
  guestName,
  title,
  backgroundUrl,
  nameGraphicUrl,
  accentColor,
  language = "km",
  onOpen,
}: Props) {
  const isEn = language === "en";
  const plateRef = useRef<HTMLDivElement | null>(null);
  const nameRef = useRef<HTMLSpanElement | null>(null);
  const [scale, setScale] = useState(1);
  // Wait for the background to actually paint before revealing the rest of
  // the cover (most importantly the guest name). Otherwise on slow networks
  // the name flashes on a blank/white screen for a beat before the
  // ornate background fades in.
  const [bgReady, setBgReady] = useState(false);

  const bg = backgroundUrl || DEFAULT_BG;
  const nameImg = nameGraphicUrl || DEFAULT_NAME;

  // Preload the background and only flip `bgReady` once decoded. Using
  // an Image() + decode() guarantees the pixels are ready to paint, not
  // just downloaded.
  useEffect(() => {
    let cancelled = false;
    setBgReady(false);
    const img = new Image();
    img.src = bg;
    const finish = () => { if (!cancelled) setBgReady(true); };
    if (typeof img.decode === "function") {
      img.decode().then(finish).catch(finish);
    } else {
      img.onload = finish;
      img.onerror = finish;
    }
    // Fallback so a hung request never permanently hides the cover.
    const t = window.setTimeout(finish, 4000);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [bg]);

  // Build a gentle 3-stop gradient from the accent color so the name still
  // pops on the gold name plate. We use CSS `color-mix` to lighten the
  // top stop and darken the bottom — works for any accent the admin picks.
  const accent = accentColor && accentColor.trim() ? accentColor.trim() : "#d68a0c";
  // Solid deep color for maximum legibility on the gold name plate.
  const nameColor = "#3a1a05";

  /* Auto-fit name to one line within the plate — uniform scale (both axes)
     so Khmer glyphs never get horizontally squished and clipped. */
  useEffect(() => {
    if (!plateRef.current || !nameRef.current) return;
    let raf = 0;
    const resize = () => {
      if (!plateRef.current || !nameRef.current) return;
      const plateW = plateRef.current.clientWidth;
      if (plateW <= 0) return;
      const target = plateW * 0.8;
      // Use the *currently rendered* visual width (includes any active
      // transform) and adjust scale by the ratio to the target. This is
      // robust against late font loading because re-running the function
      // after the font swaps in will simply correct the scale again.
      const currentVisualW = nameRef.current.getBoundingClientRect().width;
      if (currentVisualW <= 0) return;
      setScale((prev) => {
        // Only shrink to fit the max width — never enlarge past natural size.
        const next = Math.min(prev * (target / currentVisualW), 1);
        return Math.max(0.05, next);
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(resize);
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(plateRef.current);
    observer.observe(nameRef.current);
    const fonts = (document as any)?.fonts;
    if (fonts?.ready) fonts.ready.then(schedule).catch(() => {});
    if (fonts?.load) {
      Promise.all([
        fonts.load('1em "Khmer OS Moul Light"').catch(() => {}),
        fonts.load('1em "Khmer OS Moul"').catch(() => {}),
        fonts.load('1em "Moul"').catch(() => {}),
      ]).then(schedule).catch(() => {});
    }
    const t1 = window.setTimeout(schedule, 300);
    const t2 = window.setTimeout(schedule, 1200);
    const t3 = window.setTimeout(schedule, 2500);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [guestName, bgReady]);

  return (
    <div
      lang="km"
      className="relative w-full h-full min-h-full flex flex-col items-center justify-center text-center overflow-hidden px-4 py-[clamp(1rem,5vh,2.5rem)]"
    >
      {/* Solid base color shown until the background image is ready, so we
          never flash a white screen behind the guest name. */}
      <div aria-hidden className="absolute inset-0 bg-[#1a1a1a]" />
      {/* Background — fades in once decoded */}
      <img
        src={bg}
        alt=""
        aria-hidden
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: bgReady ? 1 : 0 }}
        onLoad={() => setBgReady(true)}
      />
      {/* Soft veil for legibility */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0) 30%, rgba(255,253,240,0.25) 100%)",
        }}
      />

      {/* Foreground — only revealed once the background has painted, so
          the guest name never appears on a blank screen. */}
      <div
        className="relative z-10 flex flex-col items-center w-full transition-opacity duration-500"
        style={{ opacity: bgReady ? 1 : 0 }}
      >
      {/* Center decorative name graphic */}
      <div className="flex items-center justify-center mt-0 mb-1 sm:mb-2">
        <img
          src={nameImg}
          alt={title}
          className="w-[clamp(220px,22vw,340px)] max-w-[80%] drop-shadow-[0_4px_10px_rgba(255,255,255,0.6)]"
          style={{ filter: "drop-shadow(0 0 14px rgba(255,196,70,0.55))" }}
        />
      </div>

      {/* "សូមគោរពអញ្ជើញ" / "Cordially Invites You" */}
      <p
        className={`relative z-10 text-xl sm:text-2xl mt-0 mb-3 sm:mb-4 underline underline-offset-[6px] decoration-2 ${
          isEn ? "font-serif tracking-widest uppercase font-semibold text-sm sm:text-base" : "font-khmer-koulen"
        }`}
        style={{
          color: "#1a1a1a",
          textDecorationColor: "#1a1a1a",
        }}
      >
        {isEn ? "Cordially Invites You" : "សូមគោរពអញ្ជើញ"}
      </p>

      {/* Name plate using the gold plate graphic */}
      <div
        ref={plateRef}
        className="relative z-10 w-[88%] max-w-[460px] flex items-center justify-center"
        style={{
          minHeight: 90,
          padding: "14px 44px",
          overflow: "visible",
          backgroundImage: `url(${DEFAULT_PLATE})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 100%",
          backgroundPosition: "center",
        }}
      >
        <span
          ref={nameRef}
          className="whitespace-nowrap text-2xl sm:text-3xl"
          style={{
            // Bitter SemiBold for Latin glyphs; per-glyph fallback to
            // Khmer OS Moul Light for Khmer codepoints.
            fontFamily: "'Bitter', 'Khmer OS Moul Light', 'Khmer OS Moul', 'Moul', 'Battambang', serif",
            transform: `scale(${scale})`,
            transformOrigin: "center",
            background: "#f7a60f",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.65,
            padding: "0.14em 0 0.18em",
            letterSpacing: 0,
            display: "inline-block",
          }}
        >
          {splitByScript(guestName).map((seg, i) => (
            <span key={i} style={{ fontWeight: seg.isKhmer ? undefined : 600 }}>
              {seg.text}
            </span>
          ))}
        </span>
      </div>
      {/* Slow shimmer sweep across the gradient for a premium metallic feel */}
      <style>{`
        @keyframes kt-shimmer-sweep {
          0%   { background-position: 200% 50%; }
          100% { background-position: -100% 50%; }
        }
        .kt-name-shimmer {
          animation: kt-shimmer-sweep 6s ease-in-out infinite;
        }
      `}</style>

      {/* Open button with click hand cue */}
      <div className="relative z-10 mt-6 sm:mt-8">
        <button
          type="button"
          onClick={onOpen}
          className="relative inline-flex items-center justify-center"
          style={{
            padding: "14px 40px",
            borderRadius: 999,
            border: "1px solid #ffd07a",
            background: "linear-gradient(180deg, #ffb347 0%, #ff9800 100%)",
            boxShadow:
              "0 8px 22px rgba(255,168,7,0.45), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -2px 8px rgba(180,90,0,0.25)",
            cursor: "pointer",
          }}
        >
          <span
            className={`text-lg sm:text-xl ${isEn ? "font-serif font-bold tracking-wider" : "font-khmer-moul"}`}
            style={{ color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.25)" }}
          >
            {isEn ? "Open Invitation" : "បើកធៀប"}
          </span>
          {/* Pulse ring */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-full opacity-60 animate-ping"
            style={{ border: "1px solid rgba(255,176,70,0.6)" }}
          />
        </button>
        {/* Click-hand cue (decorative) */}
        <img
          src={DEFAULT_CLICK}
          alt=""
          aria-hidden
          className="absolute kt-float pointer-events-none"
          style={{
            width: 72,
            right: -28,
            top: 6,
          }}
        />
      </div>
      </div>
    </div>
  );
}

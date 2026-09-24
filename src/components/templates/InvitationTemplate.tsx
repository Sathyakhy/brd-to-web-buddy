import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, Sparkles, MapPin, Facebook, Instagram, Send } from "lucide-react";
import KhmerGallery from "./KhmerGallery";
import KhmerFloatingContact from "./KhmerFloatingContact";
import FloatingMusicPlayer from "./FloatingMusicPlayer";
import FloatingLanguageSwitch from "./FloatingLanguageSwitch";
import FitText from "./FitText";
import FitParagraph from "./FitParagraph";
import AgendaIconImage from "./AgendaIconImage";
import OrnamentalSideFrame from "./OrnamentalSideFrame";
import { normalizeSideFrameConfig, SideFrameConfig } from "@/lib/sideFrame";
import {
  AgendaDay, AgendaViewStyle, getAgendaIcon, normalizeAgenda, buildLegacyAgenda,
} from "@/lib/agenda";
import { ContactItem, normalizeContacts, buildLegacyContacts } from "@/lib/contacts";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  ResolvedVisibility,
  SectionKey,
  mergeVisibility,
} from "@/lib/sectionVisibility";
import {
  LanguageCode,
  getDualLanguageConfig,
  resolveEventContent,
} from "@/lib/dualLanguage";
import {
  normalizeTextEffectConfig,
  computeTextShadow,
  computeMonogramFilter,
  type TextEffectConfig,
} from "@/lib/textEffects";
import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

export type TemplateData = {
  title: string;
  cover_message: string | null;
  /** Editable headline that sits above the countdown number. Defaults to a
      traditional Khmer wedding invitation phrase when null/empty. */
  countdown_message?: string | null;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  cover_image_url: string | null;
  cover_background_url?: string | null;
  invite_background_url?: string | null;
  gallery_urls: string[] | null;
  gallery_layout?: "grid" | "mosaic" | string | null;
  ceremony_time: string | null;
  reception_time: string | null;
  dress_code: string | null;
  contact_phone: string | null;
  bride_name: string | null;
  groom_name: string | null;
  agenda_days?: unknown;             // jsonb AgendaDay[]
  agenda_view_style?: AgendaViewStyle | string | null;
  contacts?: unknown;                // jsonb ContactItem[]
  /** English content fields for Dual Language mode */
  title_en?: string | null;
  groom_name_en?: string | null;
  bride_name_en?: string | null;
  venue_name_en?: string | null;
  cover_message_en?: string | null;
  countdown_message_en?: string | null;
  apologies_message_en?: string | null;
  thank_you_message_en?: string | null;
  qr_code_message_en?: string | null;
  qr_account_name_en?: string | null;
  agenda_en?: unknown;
  program_schedule_en?: unknown;
  dual_language_enabled?: boolean;
  /** Optional custom Google Maps embed. Accepts either:
      - A full <iframe …> snippet copied from Google Maps "Share → Embed a map", or
      - A direct URL (e.g. the iframe's `src`, or a maps.google.com link).
      When present, this overrides the auto-built embed from the venue link. */
  map_embed?: string | null;
  /** Optional uploaded map image (PNG/JPG). Rendered below the embedded
      iframe at the same width and clickable for a full-screen zoom view. */
  map_image_url?: string | null;
  /** Hex colour replacing the default body / "black" text. */
  text_color_primary?: string | null;
  /** Hex colour replacing the default accent / "gold" text. */
  text_color_accent?: string | null;
  /** Dedicated colour specifically for the Open Invitation button on cover screens. */
  open_button_color?: string | null;
  /** Text drop shadow and visual effects configuration. */
  text_effect_config?: TextEffectConfig | null;
  text_shadow_enabled?: boolean | null;
  text_effect_type?: string | null;
  text_shadow_color?: string | null;
  text_shadow_blur?: number | null;
  text_shadow_offset_x?: number | null;
  text_shadow_offset_y?: number | null;
  text_shadow_opacity?: number | null;
  text_shadow_apply_to?: string | null;
  /** Optional uploaded QR code image (gift transfer). */
  qr_code_url?: string | null;
  /** Editable description above the QR code. */
  qr_code_message?: string | null;
  /** Editable account holder name shown under the QR. */
  qr_account_name?: string | null;
  /** Editable apologies letter body (លិខិតសូមអភ័យទោស). */
  apologies_message?: string | null;
  /** Editable thank-you letter body (លិខិតថ្លែងអំណរគុណ). */
  thank_you_message?: string | null;
  /** Background color (hex, e.g. "#fff8e7") used for the Apologies and
      Thank-you letter cards. When null/empty the cards render with a
      subtle default tint derived from the accent color. */
  letter_bg_color?: string | null;
  /** Opacity 0–100 applied to {@link letter_bg_color}. Defaults to 70. */
  letter_bg_opacity?: number | null;
  /** Background color (hex, e.g. "#fff8e7") used for the Agenda card. */
  agenda_bg_color?: string | null;
  /** Opacity 0–100 applied to {@link agenda_bg_color}. Defaults to 70. */
  agenda_bg_opacity?: number | null;
  /** Custom asset color (hex) for agenda icons, dividers, day badges, and timeline accents. */
  agenda_asset_color?: string | null;
  /** Optional admin-uploaded ornamental frame (Signature Package). */
  frame_url?: string | null;
  /** "image" or "video" — tells the renderer which element to use. */
  frame_type?: "image" | "video";
  /** Optional Khmer body-font override (Google Fonts family name). */
  body_font?: string | null;
  /** Optional background music URL (MP3/audio stream). */
  cover_music_url?: string | null;
  /** Ornamental frame on the side of the screen configuration. */
  side_frame_config?: unknown;
};

/** Convert "#rrggbb" + opacity (0–100) to an rgba() string. Returns the
 *  raw value untouched when it isn't parseable so callers can fall back. */
function hexWithOpacity(hex: string | null | undefined, opacityPct: number | null | undefined): string | null {
  const h = (hex ?? "").trim();
  if (!h) return null;
  const m = h.replace("#", "");
  const valid = /^[0-9a-fA-F]{6}$/.test(m) || /^[0-9a-fA-F]{3}$/.test(m);
  if (!valid) return h; // pass through arbitrary CSS color (e.g. rgba(...))
  const full = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const a = Math.max(0, Math.min(100, opacityPct ?? 100)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export type TemplateProps = {
  event: TemplateData;
  guestName: string;
  children?: React.ReactNode; // RSVP form slot
  /** When true, the template will skip rendering its own fixed background
      layer. Use this when the surrounding container (e.g. the admin
      preview frame) already paints a static background behind the
      scrollable content. */
  hideBackground?: boolean;
  /** When true, the floating contact widget is not rendered. Use this in
      the admin preview where `position: fixed` doesn't behave naturally
      because of the scaled/transformed wrapper. */
  hideFloatingContact?: boolean;
  /** When true, the floating background music widget is not rendered. */
  hideFloatingMusic?: boolean;
  /** When true, the floating language switch widget is not rendered. */
  hideFloatingLanguageSwitch?: boolean;
  /** Resolved per-section visibility map. When omitted every section
      renders (built-in default). The dispatcher merges template +
      event-level overrides before passing it down. */
  visibility?: ResolvedVisibility;
  /** Active language code ("km" or "en"). Defaults to "km" */
  language?: LanguageCode;
  /** Callback fired when user switches language */
  onLanguageChange?: (lang: LanguageCode) => void;
  /** Initial language when uncontrolled */
  initialLanguage?: LanguageCode;
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

const KHMER_DIGITS = ["០","១","២","៣","៤","៥","៦","៧","៨","៩"];
const KHMER_WEEKDAYS = ["អាទិត្យ","ចន្ទ","អង្គារ","ពុធ","ព្រហស្បតិ៍","សុក្រ","សៅរ៍"];
const KHMER_MONTHS = ["មករា","កុម្ភៈ","មីនា","មេសា","ឧសភា","មិថុនា","កក្កដា","សីហា","កញ្ញា","តុលា","វិច្ឆិកា","ធ្នូ"];

function toKhmerNumber(n: number): string {
  return String(n).split("").map((c) => KHMER_DIGITS[Number(c)] ?? c).join("");
}

/** Convert any string by replacing Latin digits 0-9 with Khmer digits.
 *  Non-digit characters (colons, AM/PM, Khmer letters, spaces) pass through. */
function toKhmerDigits(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/[0-9]/g, (d) => KHMER_DIGITS[Number(d)] ?? d);
}

/** Alias used by agenda rendering. Keeps any time-format string (e.g.
 *  "3:00 PM", "07:30") and converts only the digits to Khmer numerals. */
const toKhmerTime = toKhmerDigits;

function formatKhmerDate(d: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  const weekday = KHMER_WEEKDAYS[dt.getDay()];
  const day = toKhmerNumber(dt.getDate());
  const month = KHMER_MONTHS[dt.getMonth()];
  const year = toKhmerNumber(dt.getFullYear());
  return `ថ្ងៃ${weekday} ទី${day} ខែ${month} ឆ្នាំ${year}`;
}

function useCountdown(target: string | null) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      setDays(diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [target]);
  return days;
}

/* ───────────────── KHMER TRADITIONAL ───────────────── */
export function KhmerTraditionalTemplate({ event, guestName, children, hideBackground, hideFloatingContact, visibility, language = "km" }: TemplateProps) {
  const isVisible = useCallback((k: SectionKey) => (visibility ? visibility[k] !== false : true), [visibility]);
  const isEn = language === "en";
  const date = isEn ? formatDate(event.event_date) : formatKhmerDate(event.event_date);
  const couple = event.bride_name && event.groom_name
    ? `${event.groom_name} & ${event.bride_name}` : null;
  const daysLeft = useCountdown(event.event_date);
  const gallery = (event.gallery_urls ?? []).filter(Boolean);
  const { settings: site } = useSiteSettings();
  // Colour scheme — admins can override the default black body text and
  // the default gold accent text from the event editor.
  const colorPrimary = (event.text_color_primary && event.text_color_primary.trim()) || "#000";
  const colorAccent = (event.text_color_accent && event.text_color_accent.trim()) || "#db9b0f";

  // Text drop shadow & visual effects configuration
  const textEffectConfig = useMemo(() => {
    return normalizeTextEffectConfig(
      (event as any).text_effect_config ??
      (event as any).section_visibility?.text_effects ??
      (event as any).section_visibility?.text_effect_config ??
      event
    );
  }, [event]);

  const headingShadow = computeTextShadow(textEffectConfig, true);
  const bodyShadow = computeTextShadow(textEffectConfig, false);
  const monogramFilter = computeMonogramFilter(textEffectConfig);

  // Header and Body font overrides from event or template configuration
  const rawHeaderFont = (event as any).header_font || (event as any).heading_font;
  const headerFont = resolveHeaderFont(rawHeaderFont, isEn);

  const rawBodyFont = (event as any).body_font;
  const bodyFont = (rawBodyFont && rawBodyFont.trim())
    ? resolveBodyFont(rawBodyFont, isEn)
    : undefined;

  // Venue is stored as "Name|URL" — split into a display name + optional link.
  const [venueName, ...venueRest] = (event.venue ?? "").split("|");
  const venueDisplay = (venueName ?? "").trim();
  const venueLink = venueRest.join("|").trim() || null;

  // Build Google Maps embed/open links. Prefer the user-provided link; fall
  // back to a Google Maps search of the venue name.
  const mapsQuery = venueDisplay ? encodeURIComponent(venueDisplay) : null;
  const mapsOpen = venueLink || (mapsQuery ? `https://www.google.com/maps?q=${mapsQuery}` : null);

  // Resolve the embed source. A custom `map_embed` always wins — admins may
  // paste either a full <iframe …> snippet (we extract `src=`) or a bare URL.
  // Otherwise we fall back to the venue link / venue name search.
  const customEmbedSrc = (() => {
    const raw = (event.map_embed ?? "").trim();
    if (!raw) return null;
    // Extract src="…" from an iframe snippet if present.
    const m = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
    if (m && m[1]) return m[1];
    // Bare URL — accept anything starting with http(s).
    if (/^https?:\/\//i.test(raw)) return raw;
    return null;
  })();
  const mapsEmbed = customEmbedSrc
    ?? (venueLink
      ? `https://www.google.com/maps?q=${encodeURIComponent(venueLink)}&output=embed`
      : mapsQuery
        ? `https://www.google.com/maps?q=${mapsQuery}&output=embed`
        : null);

  // Build agenda from saved jsonb (or legacy ceremony/reception fallback)
  const agendaDays: AgendaDay[] = useMemo(() => {
    const days = normalizeAgenda(event.agenda_days);
    if (days.length) return days;
    return buildLegacyAgenda({
      ceremony_time: event.ceremony_time,
      reception_time: event.reception_time,
    });
  }, [event.agenda_days, event.ceremony_time, event.reception_time]);

  const agendaView: AgendaViewStyle = event.agenda_view_style === "card" ? "card" : "list";
  const [activeDay, setActiveDay] = useState(0);
  useEffect(() => { if (activeDay >= agendaDays.length) setActiveDay(0); }, [agendaDays.length, activeDay]);

  // Map image lightbox state — when true, the uploaded map image is shown
  // full-screen with pinch-zoom / scroll-zoom support.
  const [mapZoomOpen, setMapZoomOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  useEffect(() => { if (!mapZoomOpen) setMapZoom(1); }, [mapZoomOpen]);

  // Ornamental side frame configuration
  const eventSideFrame = (event as any).side_frame;
  const eventSecVis = (event as any).section_visibility;
  const sideFrameCfg = useMemo(() => {
    const raw =
      event.side_frame_config ??
      eventSecVis?.side_frame_config ??
      eventSideFrame;
    const cfg = normalizeSideFrameConfig(raw);
    // If section visibility explicitly turned off side_frame, respect that
    if (!isVisible("side_frame")) {
      cfg.enabled = false;
    }
    return cfg;
  }, [event.side_frame_config, eventSecVis, eventSideFrame, isVisible]);

  // Background priority: explicit invite bg → cover bg → default Khmer Traditional ornate bg.
  // This guarantees the second page (after "បើកធៀប") always shows the ornate background,
  // matching the cover screen instead of falling back to a plain gradient.
  const DEFAULT_KT_BG = "/templates/khmer-traditional/background.webp";
  const inviteBg =
    event.invite_background_url || event.cover_background_url || DEFAULT_KT_BG;

  return (
    <div
      className={`${hideBackground ? "" : "kt-bg"} min-h-screen w-full font-khmer-siemreap text-foreground relative`}
      style={{
        // When the background is rendered by a parent (e.g. the admin
        // PreviewPanel paints a static device-frame background), keep this
        // root transparent so the parent's image shows through.
        backgroundColor: hideBackground ? "transparent" : "#fdf5dc",
        overflowX: "hidden",
        letterSpacing: "0.04em",
      }}
    >
      {/* Fixed background layer — mirrors the EJS spec:
          position: fixed; inset: 0; background-size: cover; no-repeat.
          Using `position: fixed` glues the image to the visible viewport so
          it never scrolls with the content and there's no coloured seam at
          the bottom. Inside the admin preview, the parent uses a CSS
          transform which creates a containing block, so `fixed` here fills
          the scaled device frame instead of the whole window — exactly what
          we want. */}
      {!hideBackground && (
        <div
          aria-hidden
          className="pointer-events-none"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${inviteBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {/* Ornamental frame on the side of the screen — fixed to viewport so it does not scroll with page */}
      {!hideBackground && sideFrameCfg.enabled && (
        <OrnamentalSideFrame
          config={sideFrameCfg}
          accentColor={colorAccent}
          positionMode="fixed"
        />
      )}

      {/* Unified content column — every section inside uses w-full so they
          all share the exact same horizontal alignment & width. */}
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 animate-fade-up relative z-10">

        {/* Title — matches EJS #invitation-container h1 spec exactly:
            font-size clamp(1.8rem, 4vw, 2.8rem), Moul, gold #db9b0f,
            single-line with ellipsis on overflow. */}
        {isVisible("title") && (
          <h1
            className="text-center w-full break-words whitespace-normal px-2"
            style={{
              fontFamily: headerFont,
              fontWeight: isEn ? 600 : 400,
              color: colorAccent,
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              marginTop: "2rem",
              marginBottom: "1rem",
              textShadow: headingShadow,
              WebkitTextStroke: isEn ? "none" : "0.2px #b3b3b3",
              lineHeight: 1.4,
              paddingTop: "0.2em",
            }}
          >
            {event.title}
          </h1>
        )}

        {/* Parents grid — strictly 2 rows × 2 columns.
            Row 1 = fathers (col1 groom-side, col2 bride-side).
            Row 2 = mothers (col1 groom-side, col2 bride-side).
            Each cell stores "prefix|firstName|lastName" (pipe-separated). */}
        {isVisible("parents") && (() => {
          const splitLines = (str: string | null | undefined): string[] => {
            if (!str) return [];
            return str.split(/\r?\n/).map(s => s.trim());
          };
          const groomLines = splitLines(event.groom_name);
          const brideLines = splitLines(event.bride_name);

          const defaultFatherPrefix = isEn ? "Mr." : "លោក";
          const defaultMotherPrefix = isEn ? "Mrs." : "លោកស្រី";

          // Parse a stored cell into { prefix, firstName, lastName }.
          // Supports legacy "name", "prefix|name", and new "prefix|first|last".
          const parseCell = (raw: string | undefined, defaultPrefix: string) => {
            if (!raw || !raw.trim()) return null;
            const trimmed = raw.trim();
            const parts = trimmed.split("|").map(s => s.trim());
            if (parts.length >= 3) {
              const prefix = parts[0] || defaultPrefix;
              const firstName = parts[1] || "";
              const lastName = parts.slice(2).join(" ");
              if (!firstName && !lastName) return null;
              return { prefix, firstName, lastName };
            }
            if (parts.length === 2) {
              const prefix = parts[0] || defaultPrefix;
              const firstName = parts[1] || "";
              if (!firstName) return null;
              return { prefix, firstName, lastName: "" };
            }
            // Single part
            const single = parts[0];
            if (!single) return null;
            const KNOWN_PREFIXES = [
              "លោកឧកញ្ញ៉ា", "លោកជំទាវ", "ឯកឧត្តម", "លោកស្រី", "លោក",
              "Mr.", "Mrs.", "Oknha", "Lok Chumteav", "H.E.", "Dr.", "Prof.",
            ];
            for (const p of KNOWN_PREFIXES) {
              if (single === p) return null; // Only prefix entered
              if (single.startsWith(p + " ") || single.startsWith(p + "\t")) {
                const nameRest = single.slice(p.length).trim();
                if (!nameRest) return null;
                return { prefix: p, firstName: nameRest, lastName: "" };
              }
            }
            return { prefix: defaultPrefix, firstName: single, lastName: "" };
          };

          const gf = parseCell(groomLines[0], defaultFatherPrefix);
          const gm = parseCell(groomLines[1], defaultMotherPrefix);
          const bf = parseCell(brideLines[0], defaultFatherPrefix);
          const bm = parseCell(brideLines[1], defaultMotherPrefix);

          if (!gf && !gm && !bf && !bm) return null;

          const renderCell = (cell: ReturnType<typeof parseCell>, key: string, side: "left" | "right" = "left") => {
            if (!cell) return <div key={key} className="min-h-[1.7em]" />;
            const fullName = [cell.firstName, cell.lastName].filter(Boolean).join(" ");
            if (!fullName) return <div key={key} className="min-h-[1.7em]" />;
            return (
              <div
                key={key}
                className={`min-w-0 flex items-baseline ${side === "right" ? "justify-end text-right" : "justify-start text-left"} ${isEn ? "font-serif text-sm sm:text-base font-semibold" : "font-khmer-koulen"}`}
                style={{
                  color: colorPrimary,
                  fontFamily: isEn ? undefined : bodyFont,
                  textShadow: bodyShadow,
                  fontSize: isEn ? "0.95rem" : "1.05rem",
                  lineHeight: 1.7,
                  paddingTop: "0.25em",
                }}
              >
                <span className="opacity-95 mr-1.5 shrink-0">{cell.prefix}</span>
                <span
                  className={isEn ? "font-serif font-bold tracking-wide" : "font-khmer-moul"}
                  style={{ color: colorPrimary, letterSpacing: isEn ? "0.02em" : "0.04em" }}
                >
                  {fullName}
                </span>
              </div>
            );
          };
          return (
            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 sm:gap-y-4 mb-6 w-full px-2 sm:px-3 items-baseline">
              {/* Row 1 — fathers */}
              {renderCell(gf, "g-0", "left")}
              {renderCell(bf, "b-0", "right")}
              {/* Row 2 — mothers */}
              {renderCell(gm, "g-1", "left")}
              {renderCell(bm, "b-1", "right")}
            </div>
          );
        })()}

        {/* "សូមគោរពអញ្ជើញ" + honorific paragraph form one logical "honorific" section. */}
        {isVisible("honorific") && (
          <p
            className={`text-center mt-4 mb-4 ${isEn ? "font-serif uppercase tracking-widest text-sm sm:text-base font-semibold" : "text-base"}`}
            style={{
              fontFamily: headerFont,
              color: colorPrimary,
              textShadow: headingShadow,
              letterSpacing: isEn ? "0.15em" : 0,
              wordSpacing: "normal",
            }}
          >
            {isEn ? "Cordially Invites You" : "សូមគោរពអញ្ជើញ"}
          </p>
        )}

        {/* Honorific invitation block — editable via `cover_message`.
            Stored as free-form text (line breaks optional). Rendered as a
            SINGLE flowing sentence that wraps naturally and is auto-shrunk
            so the rendered block never exceeds 4 lines on any viewport. */}
        {isVisible("honorific") && (() => {
          const DEFAULT_TEXT = isEn
            ? "Request the honour of your gracious presence to celebrate the joyous wedding of our beloved children and bless their eternal union."
            : "ឯកឧត្តម លោកឧកញ្ញ៉ា លោកជំទាវ លោក​ លោកស្រី អ្នកនាង កញ្ញាអញ្ចើញចូលរួម ជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរិសួស្តីជ័យមង្គល​ ក្នុងពិធីរៀបអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ";
          const raw = (event.cover_message ?? "").trim();
          // Collapse any line breaks the editor inserted into spaces so the
          // copy flows as one sentence and wraps naturally based on width.
          const text = raw
            ? raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(" ")
            : DEFAULT_TEXT;
          return (
            <FitParagraph
              as="div"
              maxLines={{ 0: 4, 640: 3, 1024: 3 }}
              maxPx={16}
              minPx={5}
              lineHeight={1.7}
              className="font-khmer-siemreap text-center mb-4 px-4 sm:px-6 text-base"
              style={{
                color: colorPrimary, fontFamily: bodyFont,
                textShadow: bodyShadow,
                letterSpacing: 0,
                wordSpacing: "normal",
              }}
            >
              {text}
            </FitParagraph>
          );
        })()}

        {isVisible("description") && event.description && (
          <p
            className="font-khmer-siemreap text-center leading-[1.9] mb-2 w-full text-base"
            style={{ color: colorPrimary, fontFamily: bodyFont, textShadow: bodyShadow }}
          >
            {event.description}
          </p>
        )}

        {/* Names block: center image + nametag/couple grid */}
        {isVisible("couple_names") && (
        <div className="flex flex-col items-center text-center my-8 w-full">
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="block mx-auto"
              style={{
                width: "70%",
                maxWidth: 220,
                height: "auto",
                filter: monogramFilter,
              }}
            />
          )}

          {(() => {
            const groomRawLines = (event.groom_name ?? "").split(/\r?\n/).map(s => s.trim());
            const brideRawLines = (event.bride_name ?? "").split(/\r?\n/).map(s => s.trim());
            // The couple's own name lives at line index 2 (after the two parent
            // lines). If only 1 line is present, use that.
            const pickCouple = (lines: string[]) => {
              if (lines.length >= 3 && lines[2]) return lines[2];
              if (lines.length === 1 && lines[0]) return lines[0];
              const nonParent = lines.find((l, idx) => idx >= 2 && l);
              if (nonParent) return nonParent;
              return lines[lines.length - 1] || "";
            };
            const groomCouple = pickCouple(groomRawLines);
            const brideCouple = pickCouple(brideRawLines);
            // Couple line is stored as "firstName|lastName" (legacy: a single
            // value, or "prefix|name" — strip leading prefix when 3+ parts).
            const splitCoupleName = (s: string): { first: string; last: string } => {
              const parts = s.split("|").map(p => p.trim());
              if (parts.length >= 3) {
                // legacy "prefix|first|last"
                return { first: parts[1] ?? "", last: parts.slice(2).join(" ") };
              }
              if (parts.length === 2) return { first: parts[0], last: parts[1] };
              return { first: parts[0] ?? "", last: "" };
            };
            const groomParts = splitCoupleName(groomCouple);
            const brideParts = splitCoupleName(brideCouple);
            if (!groomCouple && !brideCouple) return null;
            // Shared sizing group: groom first/last + bride first/last all
            // shrink together so the couple names look uniform and fit on
            // every viewport (same behaviour as the parent name cells).
            const coupleGroupId = `couple-${(event as any).slug ?? event.title ?? "event"}`;
            const renderName = (p: { first: string; last: string }, side: "g" | "b") => (
              <span className="flex flex-col items-center w-full text-center" style={{ lineHeight: 1.5 }}>
                {p.first && (
                  <FitText
                    as="div"
                    maxPx={22}
                    minPx={10}
                    groupId={coupleGroupId}
                    style={{ paddingTop: "0.3em", lineHeight: 1.5 }}
                  >
                    {p.first}
                  </FitText>
                )}
                {p.last && (
                  <FitText
                    as="div"
                    maxPx={22}
                    minPx={10}
                    groupId={coupleGroupId}
                    style={{ paddingTop: "0.3em", lineHeight: 1.5 }}
                  >
                    {p.last}
                  </FitText>
                )}
              </span>
            );
            return (
              <div className="flex flex-col items-center gap-3 mt-4 w-full px-2">
                <div
                  className={`grid grid-cols-2 gap-x-4 sm:gap-x-12 w-full text-center text-base ${isEn ? "font-serif uppercase tracking-widest font-semibold text-xs sm:text-sm" : "font-khmer-bokor"}`}
                  style={{ color: colorPrimary, fontFamily: isEn ? undefined : bodyFont, textShadow: bodyShadow }}
                >
                  <span>{isEn ? "Groom" : "កូនប្រុសនាម"}</span>
                  <span>{isEn ? "Bride" : "កូនស្រីនាម"}</span>
                </div>
                <div
                  className={`grid grid-cols-2 gap-x-4 sm:gap-x-12 w-full ${isEn ? "font-serif font-bold text-lg sm:text-xl" : ""}`}
                  style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
                >
                  {renderName(groomParts, "g")}
                  {renderName(brideParts, "b")}
                </div>
              </div>
            );
          })()}
        </div>
        )}

        {/* Details block — date sentence + map button (matches EJS .details) */}
        {isVisible("details") && (date || venueDisplay || event.reception_time || event.ceremony_time) && (
          <div
            className="font-khmer-siemreap text-center leading-[1.7] mb-6 w-full space-y-2 text-base"
            style={{ color: colorPrimary, fontFamily: bodyFont, textShadow: bodyShadow }}
          >
            {isEn ? (
              <>
                <p className="font-serif italic font-semibold text-lg" style={{ color: colorAccent }}>
                  Banquet & Reception
                </p>
                <p>
                  To be celebrated on{" "}
                  {date && (
                    <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                      {date}
                    </b>
                  )}
                  {(event.reception_time || event.ceremony_time) && (
                    <>
                      {" "}at{" "}
                      <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                        {event.reception_time || event.ceremony_time}
                      </b>
                    </>
                  )}
                  {venueDisplay && (
                    <>
                      {" "}at{" "}
                      <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                        {venueDisplay}
                      </b>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <p>និងពិសារភោជនាអាហារ</p>
                <p>
                  ដែលនឹងប្រព្រឹត្តទៅនៅ{" "}
                  {date && (
                    <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                      {date}
                    </b>
                  )}
                  {(event.reception_time || event.ceremony_time) && (
                    <>
                      {" "}វេលាម៉ោង{" "}
                      <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                        {toKhmerDigits(event.reception_time || event.ceremony_time)}
                      </b>
                    </>
                  )}
                  {venueDisplay && (
                    <>
                      {" "}នៅ{" "}
                      <b style={{ color: colorPrimary, fontFamily: bodyFont, fontWeight: 700 }}>
                        {venueDisplay}
                      </b>
                    </>
                  )}
                </p>
              </>
            )}
            {event.dress_code && (
              <p className="uppercase tracking-widest text-base" style={{ color: colorPrimary, fontFamily: bodyFont }}>
                Dress code: <span style={{ color: colorAccent }}>{event.dress_code}</span>
              </p>
            )}
            {mapsOpen && (
              <a
                href={mapsOpen}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-lg font-semibold hover:bg-white transition-colors"
                style={{
                  color: colorAccent,
                  border: `2px solid ${colorAccent}`,
                  background: "rgba(255,255,255,0.36)",
                  fontSize: "1rem",
                }}
              >
                <MapPin className="h-4 w-4" /> {isEn ? "Open Google Maps" : "បើកផែនទី"}
              </a>
            )}
          </div>
        )}

        {/* Agenda (editable, multi-day, list/card) — configurable background color,
            opacity, and dedicated asset/icon color. */}
        {isVisible("agenda") && agendaDays.length > 0 && (() => {
          const fallbackBg = hexWithOpacity("#fff8e7", 70);
          const agendaBgColor = event.agenda_bg_color ?? event.letter_bg_color;
          const agendaBgOpacity = event.agenda_bg_opacity ?? (event.agenda_bg_color ? 70 : (event.letter_bg_opacity ?? 70));
          const cardBg = hexWithOpacity(agendaBgColor, agendaBgOpacity) ?? fallbackBg;
          const agendaAssetColor = event.agenda_asset_color || colorAccent;

          const agendaCardStyle: React.CSSProperties = {
            background: cardBg ?? undefined,
            border: `1px solid ${agendaAssetColor}33`,
            borderRadius: 12,
            backdropFilter: "blur(2px)",
          };
          return (
          <section className="p-5 sm:p-6 my-8 w-full" style={agendaCardStyle}>
            {/* Day tabs (only when more than one day) */}
            {agendaDays.length > 1 && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {agendaDays.map((d, i) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setActiveDay(i)}
                    className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-khmer-koulen transition-colors"
                    style={
                      i === activeDay
                        ? { background: agendaAssetColor, color: "#fff", border: `1px solid ${agendaAssetColor}` }
                        : { background: "rgba(255,255,255,0.5)", color: colorPrimary, fontFamily: bodyFont, border: `1px solid ${agendaAssetColor}73` }
                    }
                  >
                    {d.title || (isEn ? `Day ${i + 1}` : `ថ្ងៃទី${toKhmerNumber(i + 1)}`)}
                  </button>
                ))}
              </div>
            )}

            {/* Day header (reduced size, hidden if empty) */}
            {(() => {
              const dayTitle = agendaDays[activeDay]?.title?.trim();
              if (!dayTitle) return null;
              return (
                <div className="text-center mb-2.5">
                  <h4
                    className={`text-base sm:text-lg ${isEn ? "font-serif font-semibold" : "font-khmer-koulen"}`}
                    style={{ color: agendaAssetColor }}
                  >
                    {dayTitle}
                  </h4>
                </div>
              );
            })()}

            {agendaView === "list" ? (
              <div className="w-full flex flex-col items-stretch gap-3">
                {agendaDays[activeDay]?.items.map((item) => (
                  <div key={item.id} className="flex flex-col">
                    {item.subHeader && (
                      <div
                        className="font-khmer-koulen text-base sm:text-lg mt-1 mb-1 px-2 flex items-center gap-2"
                        style={{ color: agendaAssetColor }}
                      >
                        <span
                          aria-hidden="true"
                          className="inline-block h-px flex-1"
                          style={{ background: `linear-gradient(to right, transparent, ${agendaAssetColor}, transparent)` }}
                        />
                        <span>{item.subHeader}</span>
                        <span
                          aria-hidden="true"
                          className="inline-block h-px flex-1"
                          style={{ background: `linear-gradient(to right, transparent, ${agendaAssetColor}, transparent)` }}
                        />
                      </div>
                    )}
                    <AgendaRow
                      time={item.time}
                      icon={item.icon}
                      iconImageUrl={item.iconImageUrl ?? null}
                      label={item.label}
                      description={item.description}
                      accentColor={colorAccent}
                      assetColor={agendaAssetColor}
                      primaryColor={colorPrimary}
                      bodyFont={bodyFont}
                      language={language}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                {(() => {
                  // Group items by subHeader so the divider sits cleanly above
                  // its group (matching list-view spacing) instead of being a
                  // stretched row inside the cards grid.
                  const items = agendaDays[activeDay]?.items ?? [];
                  const groups: { subHeader: string | null; items: typeof items }[] = [];
                  items.forEach((it) => {
                    if (it.subHeader || groups.length === 0) {
                      groups.push({ subHeader: it.subHeader ?? null, items: [it] });
                    } else {
                      groups[groups.length - 1].items.push(it);
                    }
                  });
                  return groups.map((g, gi) => (
                    <div key={gi} className="flex flex-col">
                      {g.subHeader && (
                        <div
                          className="font-khmer-koulen text-base sm:text-lg mt-1 mb-1 px-2 flex items-center gap-2"
                          style={{ color: agendaAssetColor }}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-block h-px flex-1"
                            style={{ background: `linear-gradient(to right, transparent, ${agendaAssetColor}, transparent)` }}
                          />
                          <span>{g.subHeader}</span>
                          <span
                            aria-hidden="true"
                            className="inline-block h-px flex-1"
                            style={{ background: `linear-gradient(to right, transparent, ${agendaAssetColor}, transparent)` }}
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-2 auto-rows-fr gap-2 items-stretch">
                        {g.items.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg p-2.5 flex flex-col items-center text-center w-full h-full justify-center"
                            style={{ background: "rgba(255,255,255,0.55)", border: `1px solid ${agendaAssetColor}66` }}
                          >
                            {item.iconImageUrl ? (
                              <AgendaIconImage
                                src={item.iconImageUrl}
                                color={agendaAssetColor}
                                className="h-6 w-6 sm:h-8 sm:w-8 mb-1"
                              />
                            ) : item.icon ? (
                              (() => {
                                const IconCmp = getAgendaIcon(item.icon);
                                return <IconCmp className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 mb-1" style={{ color: agendaAssetColor }} />;
                              })()
                            ) : null}
                            <div className="font-khmer-siemreap text-base font-semibold" style={{ color: agendaAssetColor, fontFamily: bodyFont }}>
                              {isEn ? item.time : toKhmerTime(item.time)}
                            </div>
                            <div className="font-khmer-siemreap text-base leading-snug mt-0.5" style={{ color: colorPrimary, fontFamily: bodyFont }}>{item.label}</div>
                            {item.description && (
                              <div className="font-khmer-siemreap text-sm leading-snug mt-0.5 opacity-90" style={{ color: colorPrimary, fontFamily: bodyFont }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </section>
          );
        })()}

        {/* Gallery */}
        {isVisible("gallery") && gallery.length > 0 && (
          <section className="my-8 w-full">
            <h3
              className={`text-center text-2xl sm:text-3xl mb-1 ${isEn ? "font-serif font-bold" : ""}`}
              style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
            >
              {isEn ? "Photo Gallery" : "វិចិត្រសាល"}
            </h3>
            <p className="font-khmer-siemreap text-center text-sm mb-5 kt-glow-text" style={{ fontFamily: isEn ? undefined : bodyFont }}>
              {isEn ? "Click any photo to enlarge" : "ចុចលើរូបភាពដើម្បីពង្រីកធំ"}
            </p>
            <KhmerGallery
              images={gallery.slice(0, 24)}
              layout="mosaic"
            />
          </section>
        )}

        {/* Countdown — always renders. The bottom row adapts to the date:
            • daysLeft > 0  → big number + "X ថ្ងៃទៀត..." (X days remaining)
            • daysLeft = 0  → "ថ្ងៃនេះ" (Today is the wedding day) — no number
            • daysLeft < 0  → "សូមអរគុណ​ដែលបានចូលរួម" (Thanks for joining) — no number
            The headline above is editable per event via `countdown_message`. */}
        {isVisible("countdown") && daysLeft !== null && (
          <section className="kt-section-card text-center p-5 sm:p-6 my-8 w-full" style={{ borderColor: colorAccent, boxShadow: `0 0 12px ${colorAccent}40` }}>
            <span className={`text-base ${isEn ? "font-serif uppercase tracking-wider font-semibold text-sm sm:text-base" : "font-khmer-koulen"}`} style={{ color: colorAccent, textShadow: headingShadow }}>
              {(event.countdown_message?.trim()) ||
                (isEn
                  ? "You are cordially invited to celebrate our wedding day!"
                  : "អ្នកត្រូវបានអញ្ជើញមកចូលរួមក្នុងពិធីអាពាហ៍ពិពាហ៍របស់យើងខ្ញុំ!")}
            </span>

            {daysLeft > 0 && (
              <>
                <div className={`text-sm mt-3 ${isEn ? "font-serif uppercase tracking-widest font-semibold" : "font-khmer-koulen"}`} style={{ color: colorAccent, textShadow: headingShadow }}>
                  {isEn ? "Countdown" : "នៅសល់"}
                </div>
                <div className={`${isEn ? "font-serif font-bold" : ""} text-6xl sm:text-7xl my-1`} style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow, lineHeight: 1 }}>
                  {daysLeft}
                </div>
                <span className={`text-sm ${isEn ? "font-serif uppercase tracking-wider font-semibold" : "font-khmer-koulen"}`} style={{ color: colorAccent, textShadow: headingShadow }}>
                  {isEn
                    ? (daysLeft === 1 ? "Day until our wedding" : "Days until our wedding")
                    : "ថ្ងៃទៀតដល់ថ្ងៃរៀបអាពាហ៍ពិពាហ៍"}
                </span>
              </>
            )}

            {daysLeft === 0 && (
              <div className={`${isEn ? "font-serif font-bold text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"} mt-4`} style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow, lineHeight: 1.2 }}>
                {isEn ? "Today is our Wedding Day!" : "ថ្ងៃនេះ​ជាថ្ងៃរៀបអាពាហ៍ពិពាហ៍"}
              </div>
            )}

            {daysLeft < 0 && (
              <div className={`${isEn ? "font-serif font-bold text-xl sm:text-2xl" : "text-2xl sm:text-3xl"} mt-4`} style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow, lineHeight: 1.3 }}>
                {isEn ? "Thank you for celebrating with us!" : "សូមអរគុណ​ដែលបានចូលរួម​ក្នុងពិធីរបស់យើងខ្ញុំ"}
              </div>
            )}
          </section>
        )}

        {/* QR code (gift transfer) — editable description + uploaded QR image.
            Rendered directly over the page background (no card / border / shadow). */}
        {isVisible("qr_code") && (event.qr_code_url || event.qr_code_message || event.qr_account_name) && (() => {
          const DEFAULT_QR_MSG = isEn
            ? "You may also send your heartfelt wedding gift via our QR code below."
            : "លោកអ្នកក៏អាចផ្ញើចំណងដៃតាមរយៈគណនី QR code របស់ពួកយើង រឺចុចប៊ូតុងខាងក្រោម។";
          const msg = (event.qr_code_message?.trim()) || DEFAULT_QR_MSG;
          const account = (event.qr_account_name?.trim()) || "";
          return (
            <section className="text-center my-8 w-full">
              <h3
                className={`text-2xl sm:text-3xl mb-3 ${isEn ? "font-serif font-bold" : ""}`}
                style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
              >
                {isEn ? "Wedding Gift · Bank Transfer" : "ចំណងដៃជូនពរ"}
              </h3>
              <p
                className="font-khmer-siemreap text-base leading-[1.9] mb-3 whitespace-pre-line text-center"
                style={{ color: colorPrimary, fontFamily: isEn ? undefined : bodyFont, textShadow: bodyShadow }}
              >
                {msg}
              </p>
              {account && (
                <p
                  className={`text-base mb-4 ${isEn ? "font-serif font-bold tracking-wider" : ""}`}
                  style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
                >
                  {account}
                </p>
              )}
              {event.qr_code_url && (
                <div className="flex justify-center mt-2 w-full">
                  <img
                    src={event.qr_code_url}
                    alt="QR code"
                    className="block w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              )}
            </section>
          );
        })()}

        {/* Apologies + Thank-you letters — both rendered inside a soft card.
            The card background colour and opacity are configurable per
            template / per event (`letter_bg_color`, `letter_bg_opacity`).
            When no colour is set we fall back to a faint tint derived from
            the page accent so the card always blends in. */}
        {(() => {
          const fallbackBg = hexWithOpacity("#fff8e7", 70);
          const cardBg = hexWithOpacity(event.letter_bg_color, event.letter_bg_opacity ?? 70) ?? fallbackBg;
          const cardStyle: React.CSSProperties = {
            background: cardBg ?? undefined,
            border: `1px solid ${colorAccent}33`,
            borderRadius: 12,
            backdropFilter: "blur(2px)",
          };

          return (
            <>
              {isVisible("apologies") && (() => {
                const DEFAULT_APOLOGY = isEn
                  ? "We, together with our parents, sincerely apologize if we were unable to deliver this invitation in person, or for any inadvertent errors in names or titles. Your presence on our special day would be our greatest joy and honour."
                  : "យើងខ្ញុំជាមាតាបិតា​ កូនប្រុស កូនស្រី សូមអភ័យទោសដោយពុំបានជួបអញ្ជើញដោយផ្ទាល់ និង ការសរសេរឈ្មោះរបស់ ភ្ញៀវកិត្តិយសមិនបានត្រឹមត្រូវ ឬ ពុំបានសរសេរឈ្មោះ។ វត្តមានរបស់ ឯកឧត្តម លោកជំទាវ លោកឧកញ៉ា លោក លោកស្រី អ្នកនាងកញ្ញា នឹង ប្រិយមិត្តទាំងអស់ គឺជាកិត្តិយសដ៏ឧត្តុងឧត្តមសម្រាប់ ក្រុមគ្រួសារយើងខ្ញុំ។";
                const body = (event.apologies_message?.trim()) || DEFAULT_APOLOGY;
                return (
                  <section className="text-center p-5 sm:p-6 my-8 w-full" style={cardStyle}>
                    <h3
                      className={`text-2xl sm:text-3xl mb-2 ${isEn ? "font-serif font-bold" : ""}`}
                      style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
                    >
                      {isEn ? "Letter of Apology" : "លិខិតសូមអភ័យទោស"}
                    </h3>
                    <div
                      aria-hidden="true"
                      className="mx-auto mb-4"
                      style={{
                        height: 2,
                        width: "60%",
                        background: `linear-gradient(to right, transparent, ${colorAccent}, transparent)`,
                      }}
                    />
                    <p
                      className="font-khmer-siemreap text-base leading-[1.9] whitespace-pre-line text-center"
                      style={{ color: colorPrimary, fontFamily: isEn ? undefined : bodyFont, textShadow: bodyShadow }}
                    >
                      {body}
                    </p>
                  </section>
                );
              })()}

              {isVisible("thank_you") && (() => {
                const DEFAULT_THANKS = isEn
                  ? "We and our families express our heartfelt gratitude for honouring us with your presence on our wedding day. Wishing you and your loved ones abundant health, happiness, and prosperity always."
                  : "យើងខ្ញុំជាមាតាបិតា កូនប្រុស កូនស្រី សូមថ្លែងអំណរគុណយ៉ាងជ្រាលជ្រៅចំពោះការអញ្ជើញចូលរួមជាភ្ញៀវកិត្តិយសដ៏ឧត្ដុងឧត្ដមក្នុង ពីធីរៀបអាពាហ៍ពីពាហ៍កូនប្រុស កូនស្រី របស់យើងខ្ញុំ។ សូមជូនពរឯកឧត្តម លោកជំទាវ លោកឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា និងភ្ញៀវកិត្តិយសទាំងអស់មាន សុខភាពល្អ និងទទួលជោកជ័យគ្រប់ភារៈកិច្ចជានិរន្តន៍។ សូមអរគុណ !";
                const body = (event.thank_you_message?.trim()) || DEFAULT_THANKS;
                return (
                  <section className="text-center p-5 sm:p-6 my-8 w-full" style={cardStyle}>
                    <h3
                      className={`text-2xl sm:text-3xl mb-2 ${isEn ? "font-serif font-bold" : ""}`}
                      style={{ fontFamily: headerFont, color: colorAccent, textShadow: headingShadow }}
                    >
                      {isEn ? "Letter of Gratitude" : "លិខិតថ្លែងអំណរគុណ"}
                    </h3>
                    <div
                      aria-hidden="true"
                      className="mx-auto mb-4"
                      style={{
                        height: 2,
                        width: "60%",
                        background: `linear-gradient(to right, transparent, ${colorAccent}, transparent)`,
                      }}
                    />
                    <p
                      className="font-khmer-siemreap text-base leading-[1.9] whitespace-pre-line text-center"
                      style={{ color: colorPrimary, fontFamily: isEn ? undefined : bodyFont, textShadow: bodyShadow }}
                    >
                      {body}
                    </p>
                  </section>
                );
              })()}
            </>
          );
        })()}

        {/* Location / Map */}
        {isVisible("location") && venueDisplay && (
          <section className="my-8 text-center w-full">
            <h3
              className={`text-2xl sm:text-3xl mb-4 inline-block pb-1 ${isEn ? "font-serif font-bold" : ""}`}
              style={{ fontFamily: headerFont, color: colorAccent, borderBottom: `2px solid ${colorAccent}`, textShadow: headingShadow }}
            >
              {isEn ? "Location & Map" : "ទីតាំងកម្មវិធី"}
            </h3>
            <p className="text-base mb-3 mt-2 kt-glow-text px-3 font-bold">{venueDisplay}</p>
            {mapsEmbed && (
              <div className="rounded-xl overflow-hidden shadow-md w-full" style={{ border: `2px solid ${colorAccent}66` }}>
                <iframe
                  src={mapsEmbed}
                  title="venue map"
                  className="w-full h-[260px] sm:h-[320px] border-0 block"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
            {event.map_image_url && (
              <button
                type="button"
                onClick={() => setMapZoomOpen(true)}
                className="mt-3 block w-full rounded-xl overflow-hidden shadow-md cursor-zoom-in group"
                style={{ border: `2px solid ${colorAccent}66` }}
                aria-label="View map full screen"
              >
                <img
                  src={event.map_image_url}
                  alt="Venue map"
                  className="w-full h-auto block transition-transform group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </button>
            )}
            {mapsOpen && (
              <a
                href={mapsOpen}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-white transition-colors"
                style={{ color: colorAccent, border: `2px solid ${colorAccent}`, background: "rgba(255,255,255,0.85)" }}
              >
                <MapPin className="h-4 w-4" /> {isEn ? "Open Google Maps" : "បើកផែនទី"}
              </a>
            )}
          </section>
        )}

        {/* RSVP slot — RsvpCard provides its own kt-section-card framing. */}
        {isVisible("rsvp") && (React.isValidElement(children) ? React.cloneElement(children as React.ReactElement<any>, { language }) : children)}

        {/* Brand footer — driven by global Site Settings (logo + footer
            text + social links). Falls back to sensible defaults so legacy
            events still render even before settings are configured. */}
        {isVisible("footer") && (
        <footer className="text-center mt-12 pb-24 opacity-90 flex flex-col items-center gap-4">
          {site.logo_url && (
            <img
              src={site.logo_url}
              alt="Logo"
              className="h-16 w-auto object-contain"
              loading="lazy"
            />
          )}
          <p className="font-khmer-siemreap text-sm px-4" style={{ color: "#3a2a00" }}>
            {site.footer_text || (
              <>
                Invitation made with{" "}
                <Heart className="inline h-3.5 w-3.5" style={{ color: colorAccent }} fill="currentColor" />{" "}
                by <span className="font-semibold" style={{ color: colorAccent }}>21Invite.Online</span>
              </>
            )}
          </p>
          {(site.facebook_url || site.instagram_url || site.tiktok_url || site.telegram_url) && (
            <div className="flex items-center justify-center gap-4">
              {site.facebook_url && (
                <a
                  href={site.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
                  style={{ background: "#1877F2" }}
                >
                  <Facebook className="h-5 w-5" fill="currentColor" />
                </a>
              )}
              {site.instagram_url && (
                <a
                  href={site.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
                  style={{
                    background:
                      "linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)",
                  }}
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {site.tiktok_url && (
                <a
                  href={site.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
                  style={{ background: "#000" }}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
                    <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.5v3a8.5 8.5 0 0 1-4.5-1.36V15a6 6 0 1 1-6-6c.34 0 .67.03 1 .09v3.16A3 3 0 1 0 13.5 15V3z" />
                  </svg>
                </a>
              )}
              {site.telegram_url && (
                <a
                  href={site.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110"
                  style={{ background: "#229ED9" }}
                >
                  <Send className="h-5 w-5" fill="currentColor" />
                </a>
              )}
            </div>
          )}
        </footer>
        )}
      </div>

      {/* Floating contact — hidden in admin preview because the scaled
          wrapper makes `position: fixed` behave like absolute. */}
      {isVisible("floating_contact") && !hideFloatingContact && (
        <KhmerFloatingContact
          accentColor={colorAccent}
          language={language}
          contacts={(() => {
            const list: ContactItem[] = normalizeContacts(event.contacts);
            if (list.length) return list;
            return buildLegacyContacts(event.contact_phone);
          })()}
        />
      )}

      {/* Map image lightbox — full-screen overlay with zoom controls. */}
      {mapZoomOpen && event.map_image_url && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex flex-col"
          onClick={() => setMapZoomOpen(false)}
        >
          <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
                onClick={() => setMapZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              >−</button>
              <span className="text-xs tabular-nums w-12 text-center">{Math.round(mapZoom * 100)}%</span>
              <button
                type="button"
                className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
                onClick={() => setMapZoom((z) => Math.min(5, +(z + 0.25).toFixed(2)))}
              >+</button>
              <button
                type="button"
                className="ml-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs"
                onClick={() => setMapZoom(1)}
              >Reset</button>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-sm"
              onClick={() => setMapZoomOpen(false)}
              aria-label="Close"
            >✕</button>
          </div>
          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              setMapZoom((z) => Math.max(0.5, Math.min(5, +(z + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))));
            }}
          >
            <img
              src={event.map_image_url}
              alt="Venue map"
              style={{ transform: `scale(${mapZoom})`, transformOrigin: "center center", transition: "transform 0.1s ease-out" }}
              className="max-w-full max-h-full select-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* Agenda row helper */
function AgendaRow({
  time, icon, iconImageUrl, label, description,
  accentColor = "#db9b0f", assetColor, primaryColor = "#3a2a00", bodyFont,
  language = "km",
}: {
  time: string;
  icon?: any;
  iconImageUrl?: string | null;
  label: string;
  description?: string | null;
  accentColor?: string;
  assetColor?: string;
  primaryColor?: string;
  bodyFont?: string;
  language?: LanguageCode;
}) {
  const resolvedAssetColor = assetColor || accentColor;
  return (
    <div className="flex items-center gap-2 py-1.5 px-1 w-full">
      <div
        className="font-khmer-siemreap text-base shrink-0 text-left tabular-nums"
        style={{ color: primaryColor, fontFamily: language === "en" ? undefined : bodyFont }}
      >
        {language === "en" ? time : toKhmerDigits(time)}
      </div>
      <div
        aria-hidden="true"
        className="shrink-0 rounded-full"
        style={{
          width: 2,
          height: 22,
          background: `linear-gradient(to bottom, transparent, ${resolvedAssetColor}, transparent)`,
        }}
      />
      {iconImageUrl ? (
        <div className="shrink-0 flex items-center justify-center">
          <AgendaIconImage
            src={iconImageUrl}
            color={resolvedAssetColor}
            className="h-6 w-6 sm:h-7 sm:w-7"
          />
        </div>
      ) : icon ? (
        <div className="shrink-0 flex items-center justify-center">
          {(() => {
            const IconCmp = getAgendaIcon(icon);
            return <IconCmp className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" style={{ color: resolvedAssetColor }} />;
          })()}
        </div>
      ) : null}
      <div className="flex-1 min-w-0">
        <p className="font-khmer-siemreap text-base leading-snug" style={{ color: primaryColor, fontFamily: bodyFont }}>
          {label}
        </p>
        {description && (
          <p className="font-khmer-siemreap text-sm leading-snug mt-0.5 opacity-90" style={{ color: primaryColor, fontFamily: bodyFont }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────────── SIGNATURE PACKAGE 01 ─────────────────
   Reuses the Khmer Traditional layout (same configurable fields)
   but wraps it in a premium cream paper backdrop with a fixed
   floral + gold frame overlay, plus richer default gold/brown
   typography colors. The cover screen lives in
   `SignaturePackageCover` and is composed by InvitePage so it can
   fade out without a route change. */
export function SignaturePackageTemplate(props: TemplateProps) {
  const { event } = props;
  // Override default colors only when the event itself hasn't set them.
  // Deeper warm gold + chocolate brown to match the sample invite card.
  const eventWithDefaults: TemplateData = {
    ...event,
    text_color_primary:
      (event.text_color_primary && event.text_color_primary.trim()) || "#5a3a14",
    text_color_accent:
      (event.text_color_accent && event.text_color_accent.trim()) || "#a87614",
  };
  // Background priority: explicit invite bg → cream paper texture.
  const PAPER_BG = "/templates/signature-package-01/paper-bg.jpg";
  const DEFAULT_FRAME = "/templates/signature-package-01/frame.png";
  const FRAME = (event.frame_url && event.frame_url.trim()) || DEFAULT_FRAME;
  const isVideoFrame = (event.frame_type === "video") && !!event.frame_url;
  const inviteBg = event.invite_background_url || PAPER_BG;

  return (
    <div className="relative min-h-screen w-full">
      {/* Cream paper background (fixed) */}
      {!props.hideBackground && (
        <div
          aria-hidden
          className="pointer-events-none"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            backgroundImage: `url(${inviteBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
            backgroundRepeat: "repeat",
          }}
        />
      )}

      {/* Floral frame overlay (fixed) — sits above content as a decorative
          border. Renders as <video> when the chosen frame is animated. */}
      {isVideoFrame ? (
        <video
          src={FRAME}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 30,
            maxWidth: 768,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      ) : (
        <img
          src={FRAME}
          alt=""
          aria-hidden
          className="pointer-events-none select-none"
          style={{
            position: "fixed",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
            zIndex: 30,
            maxWidth: 768,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      )}

      {/* Render the shared invitation body. We always hide the inner
          background because we paint our own cream paper above. */}
      <KhmerTraditionalTemplate
        {...props}
        event={eventWithDefaults}
        hideBackground
      />
    </div>
  );
}

/* ───────────────── MODERN LUXURY ───────────────── */
export function ModernLuxuryTemplate({ event, guestName, children }: TemplateProps) {
  const date = formatDate(event.event_date);
  // Accent-driven 3-stop gradient for the guest name so it really pops
  // against the dark luxury card. Falls back to the template's signature
  // gold when the admin hasn't set an accent.
  const accent = ((event as any).text_color_accent as string | undefined)?.trim() || "#d4a93a";
  const nameGradient = `linear-gradient(180deg,
    color-mix(in srgb, ${accent} 35%, #ffffff) 0%,
    color-mix(in srgb, ${accent} 85%, #ffffff) 50%,
    color-mix(in srgb, ${accent} 80%, #ffffff) 100%)`;

  return (
    <div className="min-h-screen text-foreground py-16 px-4 bg-gradient-hero">
      <div className="max-w-2xl mx-auto animate-fade-up">
        <article className="relative rounded-2xl border border-gold/20 bg-card p-0 shadow-elegant overflow-hidden">
          {event.cover_image_url && (
            <div className="aspect-[16/10] overflow-hidden">
              <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8 md:p-12 text-center relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.2),transparent_70%)] pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-gold text-xs tracking-widest uppercase mb-6">
                <Sparkles className="h-3 w-3" /> Personal invitation
              </div>

              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-3">Dear</p>
              <h2
                className="font-serif font-bold text-3xl sm:text-4xl md:text-5xl mb-2 break-words"
                style={{
                  background: nameGradient,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.35)) drop-shadow(0 2px 8px color-mix(in srgb, ${accent} 50%, transparent))`,
                }}
              >
                {guestName}
              </h2>

              <div className="gold-divider my-8" />

              {event.cover_message && (
                <p className="font-serif text-xl italic text-foreground/85 mb-6">"{event.cover_message}"</p>
              )}

              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl mb-4 break-words">{event.title}</h1>

              <div className="space-y-1 text-sm text-muted-foreground tracking-wider uppercase">
                {date && <div className="text-gold">{date}</div>}
                {event.venue && <div>{event.venue}</div>}
              </div>

              {(event.ceremony_time || event.reception_time) && (
                <div className="grid sm:grid-cols-2 gap-3 my-6 text-sm">
                  {event.ceremony_time && (
                    <div className="p-4 rounded-lg border border-gold/20 bg-secondary/30">
                      <div className="text-xs uppercase tracking-widest text-gold mb-1">Ceremony</div>
                      <div>{event.ceremony_time}</div>
                    </div>
                  )}
                  {event.reception_time && (
                    <div className="p-4 rounded-lg border border-gold/20 bg-secondary/30">
                      <div className="text-xs uppercase tracking-widest text-gold mb-1">Reception</div>
                      <div>{event.reception_time}</div>
                    </div>
                  )}
                </div>
              )}

              {event.dress_code && (
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3">
                  Dress code: <span className="text-gold">{event.dress_code}</span>
                </p>
              )}

              {event.description && (
                <p className="text-sm text-muted-foreground mt-6 max-w-md mx-auto leading-relaxed">{event.description}</p>
              )}

              <div className="gold-divider my-10" />

              {children}

              {event.contact_phone && (
                <p className="text-xs text-muted-foreground mt-8">
                  Inquiries: <span className="text-gold">{event.contact_phone}</span>
                </p>
              )}
            </div>
          </div>
        </article>

        <p className="text-center text-xs text-muted-foreground mt-6 inline-flex items-center gap-1.5 w-full justify-center">
          Made with <Heart className="h-3 w-3 text-gold" /> on 21Invitation
        </p>
      </div>
    </div>
  );
}

/* ───────────────── FLORAL ROMANTIC ───────────────── */
export function FloralRomanticTemplate({ event, guestName, children }: TemplateProps) {
  const date = formatDate(event.event_date);
  const couple = event.bride_name && event.groom_name
    ? `${event.bride_name} & ${event.groom_name}` : null;
  // Accent-driven gradient for the guest name. Defaults to a warm rose
  // that matches the romantic floral palette when no accent is set.
  const accent = ((event as any).text_color_accent as string | undefined)?.trim() || "hsl(340 60% 45%)";
  const nameGradient = `linear-gradient(180deg,
    color-mix(in srgb, ${accent} 35%, #ffffff) 0%,
    color-mix(in srgb, ${accent} 85%, #ffffff) 50%,
    color-mix(in srgb, ${accent} 80%, #ffffff) 100%)`;

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{
        background: "linear-gradient(180deg, hsl(340 50% 96%) 0%, hsl(20 40% 94%) 100%)",
        color: "hsl(340 30% 25%)",
      }}
    >
      <div className="max-w-2xl mx-auto animate-fade-up">
        <article className="relative rounded-2xl overflow-hidden shadow-xl"
          style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(340 30% 88%)" }}>

          {event.cover_image_url && (
            <div className="aspect-[4/3] overflow-hidden">
              <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
            </div>
          )}

          {/* Floral decorative top */}
          <div className="text-center pt-10 pb-2 text-4xl" style={{ color: "hsl(340 60% 70%)" }}>
            ❀ ❀ ❀
          </div>

          <div className="px-6 sm:px-8 md:px-14 py-8 text-center">
            <p className="text-xs uppercase tracking-[0.4em] mb-2" style={{ color: "hsl(340 30% 50%)" }}>
              Together with our families
            </p>

            {couple && (
              <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl italic mb-2 break-words" style={{ color: "hsl(340 50% 35%)" }}>
                {couple}
              </h1>
            )}
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl mb-6 break-words" style={{ color: "hsl(340 30% 35%)" }}>
              {event.title}
            </h2>

            <div className="my-6 flex items-center justify-center gap-3 text-xl" style={{ color: "hsl(340 60% 70%)" }}>
              <div className="h-px w-12" style={{ background: "hsl(340 40% 75%)" }} />
              <span>✿</span>
              <div className="h-px w-12" style={{ background: "hsl(340 40% 75%)" }} />
            </div>

            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "hsl(340 30% 55%)" }}>Specially for</p>
            <p
              className="font-serif font-bold text-2xl sm:text-3xl md:text-4xl italic mb-8 break-words"
              style={{
                background: nameGradient,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.5)) drop-shadow(0 2px 6px color-mix(in srgb, ${accent} 45%, transparent))`,
              }}
            >
              {guestName}
            </p>

            {event.cover_message && (
              <p className="font-serif italic text-lg mb-8 leading-relaxed" style={{ color: "hsl(340 30% 40%)" }}>
                "{event.cover_message}"
              </p>
            )}

            {date && (
              <div className="inline-block px-6 py-3 rounded-full mb-6"
                style={{ background: "hsl(340 50% 96%)", color: "hsl(340 50% 35%)" }}>
                <div className="text-sm tracking-widest uppercase">{date}</div>
              </div>
            )}

            {(event.ceremony_time || event.reception_time) && (
              <div className="grid sm:grid-cols-2 gap-3 my-6 text-sm">
                {event.ceremony_time && (
                  <div className="p-4 rounded-lg" style={{ background: "hsl(340 50% 97%)" }}>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "hsl(340 50% 50%)" }}>Ceremony</div>
                    <div style={{ color: "hsl(340 30% 30%)" }}>{event.ceremony_time}</div>
                  </div>
                )}
                {event.reception_time && (
                  <div className="p-4 rounded-lg" style={{ background: "hsl(340 50% 97%)" }}>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "hsl(340 50% 50%)" }}>Reception</div>
                    <div style={{ color: "hsl(340 30% 30%)" }}>{event.reception_time}</div>
                  </div>
                )}
              </div>
            )}

            {event.venue && (
              <p className="text-sm tracking-wider" style={{ color: "hsl(340 30% 40%)" }}>{event.venue}</p>
            )}
            {event.dress_code && (
              <p className="text-xs uppercase tracking-widest mt-2" style={{ color: "hsl(340 30% 55%)" }}>
                Dress code: {event.dress_code}
              </p>
            )}

            {event.description && (
              <p className="text-sm mt-6 leading-relaxed max-w-md mx-auto" style={{ color: "hsl(340 25% 45%)" }}>
                {event.description}
              </p>
            )}

            <div className="my-8" style={{ borderTop: "1px dashed hsl(340 40% 80%)" }} />

            {children}

            {event.contact_phone && (
              <p className="text-xs mt-8" style={{ color: "hsl(340 30% 50%)" }}>
                Inquiries: <span style={{ color: "hsl(340 60% 45%)" }}>{event.contact_phone}</span>
              </p>
            )}
          </div>

          <div className="text-center pb-8 text-3xl" style={{ color: "hsl(340 60% 70%)" }}>
            ❀ ❀ ❀
          </div>
        </article>
      </div>
    </div>
  );
}

/* ───────────────── DISPATCHER ───────────────── */
export function InvitationTemplate({
  template,
  templateVisibility,
  eventVisibility,
  templateDefaults,
  ...props
}: TemplateProps & {
  template: string;
  /** Defaults from templates.config.section_visibility. */
  templateVisibility?: unknown;
  /** Per-event override map (events.section_visibility). */
  eventVisibility?: unknown;
  /** Optional template-level defaults for fields that fall back when the
      event leaves them blank (QR, apologies, thank-you). */
  templateDefaults?: Partial<Pick<TemplateData,
    "qr_code_url" | "qr_code_message" | "qr_account_name" |
    "apologies_message" | "thank_you_message" |
    "letter_bg_color" | "letter_bg_opacity" | "frame_url" | "frame_type" |
    "cover_music_url"
  >>;
}) {
  const visibility = mergeVisibility(templateVisibility, eventVisibility);
  // Merge template defaults onto event for fields that haven't been set
  // per-event. Empty strings count as unset so admins can clear a default
  // by saving an explicit blank — null/undefined means "inherit".
  const ev = props.event;
  const fallback = <K extends keyof TemplateData>(k: K) => {
    const v = ev[k];
    if (v === null || v === undefined || v === "") {
      return (templateDefaults as any)?.[k] ?? null;
    }
    return v;
  };
  const mergedEvent: TemplateData = templateDefaults
    ? {
        ...ev,
        qr_code_url: fallback("qr_code_url") as any,
        qr_code_message: fallback("qr_code_message") as any,
        qr_account_name: fallback("qr_account_name") as any,
        apologies_message: fallback("apologies_message") as any,
        thank_you_message: fallback("thank_you_message") as any,
        letter_bg_color: fallback("letter_bg_color") as any,
        letter_bg_opacity: fallback("letter_bg_opacity") as any,
        frame_url: fallback("frame_url") as any,
        frame_type: fallback("frame_type") as any,
        cover_music_url: fallback("cover_music_url") as any,
      }
    : ev;

  const dualConfig = getDualLanguageConfig(
    (mergedEvent as any).dual_language_config ??
    (mergedEvent as any).section_visibility?.dual_language ??
    (mergedEvent as any).section_visibility,
    mergedEvent
  );
  const [internalLanguage, setInternalLanguage] = useState<LanguageCode>(
    props.language || props.initialLanguage || dualConfig.default_language || "km"
  );
  const currentLanguage = props.language ?? internalLanguage;
  const handleLanguageChange = (newLang: LanguageCode) => {
    setInternalLanguage(newLang);
    props.onLanguageChange?.(newLang);
  };

  // Resolve event content dynamically based on current language
  const resolvedEvent = resolveEventContent(mergedEvent, currentLanguage, dualConfig);
  const merged = {
    ...props,
    event: resolvedEvent,
    language: currentLanguage,
    onLanguageChange: handleLanguageChange,
    visibility,
  };

  const musicUrl = resolvedEvent.cover_music_url;
  const showFloatingMusic =
    visibility.background_music !== false &&
    !props.hideFloatingMusic &&
    !!musicUrl &&
    !!musicUrl.trim();
  const showFloatingLanguageSwitch =
    dualConfig.enabled &&
    !props.hideFloatingLanguageSwitch;
  const accentColor = (resolvedEvent.text_color_accent && resolvedEvent.text_color_accent.trim()) || "#db9b0f";
  const hasBottomContact =
    visibility.floating_contact !== false &&
    !props.hideFloatingContact &&
    (normalizeContacts(resolvedEvent.contacts).length > 0 || !!(resolvedEvent as any).contact_phone);

  let content: React.ReactNode;
  switch (template) {
    case "signature-package-01":
      content = <SignaturePackageTemplate {...merged} />;
      break;
    case "modern-luxury":
    case "modern-minimal":
      content = <ModernLuxuryTemplate {...merged} />;
      break;
    case "floral-romantic":
      content = <FloralRomanticTemplate {...merged} />;
      break;
    case "essentials-package-01":
    case "essentials-package":
    case "khmer-traditional":
    default:
      content = <KhmerTraditionalTemplate {...merged} />;
      break;
  }

  return (
    <>
      {content}

      {/* Floating Controls at bottom-right: Music icon on top, Language Switch below */}
      {(showFloatingMusic || showFloatingLanguageSwitch) && (
        <div
          className={`fixed ${
            hasBottomContact
              ? "bottom-24 right-5 sm:bottom-28 sm:right-6"
              : "bottom-5 right-5 sm:bottom-6 sm:right-6"
          } z-[9999] flex flex-col items-center gap-2 pointer-events-none select-none`}
        >
          {showFloatingMusic && (
            <div className="pointer-events-auto">
              <FloatingMusicPlayer
                musicUrl={musicUrl}
                accentColor={accentColor}
                position="bottom-right"
                positionMode="inline"
              />
            </div>
          )}
          {showFloatingLanguageSwitch && (
            <div className="pointer-events-auto">
              <FloatingLanguageSwitch
                language={currentLanguage}
                onLanguageChange={handleLanguageChange}
                accentColor={accentColor}
                positionMode="inline"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export const TEMPLATES = [
  { value: "essentials-package-01", label: "essentials-package-01", desc: "Deep red & gold, ornate" },
  { value: "signature-package-01", label: "signature-package-01", desc: "Navy & champagne, minimal" },
];

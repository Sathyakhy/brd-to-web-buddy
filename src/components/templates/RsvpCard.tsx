import { useState } from "react";
import { Check, X, Heart, Minus, Plus, Sparkles, User, MessageSquareHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { computeRsvpCardShadow, computeRsvpHeaderShadow } from "@/lib/rsvpStyle";
import { resolveHeaderFont, resolveBodyFont } from "@/lib/fonts";

type Props = {
  guestName: string;
  isOpenInvite?: boolean;
  openNameLabel?: string | null;
  openNameLabelEn?: string | null;
  openNamePlaceholder?: string | null;
  openNamePlaceholderEn?: string | null;
  wishesLabel?: string | null;
  wishesLabelEn?: string | null;
  wishesPlaceholder?: string | null;
  wishesPlaceholderEn?: string | null;
  partySizeLabel?: string | null;
  partySizeLabelEn?: string | null;
  attendingLabel?: string | null;
  attendingLabelEn?: string | null;
  decliningLabel?: string | null;
  decliningLabelEn?: string | null;
  status?: "pending" | "yes" | "no" | string;
  initialPartySize?: number;
  initialMessage?: string;
  submitting?: boolean;
  /** When true, the form is read-only (used for admin preview). */
  preview?: boolean;
  onSubmit?: (status: "yes" | "no", partySize: number, message: string, guestName?: string) => void;
  /** Accent (gold) and primary (body) colours — fall through to the
      Khmer Traditional defaults when omitted. Pass-through from the
      parent so all "border-like" / heading colours follow the event's
      configured accent rather than being hard-coded. */
  accentColor?: string;
  primaryColor?: string;
  /** Custom background color (hex) for the RSVP section card. */
  bgColor?: string | null;
  /** Custom background opacity (0-100) for the RSVP section card. */
  bgOpacity?: number | null;
  /** Header font name (Khmer or general) */
  headerFont?: string | null;
  /** English header font name */
  headerFontEn?: string | null;
  /** Body font name (Khmer or general) */
  bodyFont?: string | null;
  /** English body font name */
  bodyFontEn?: string | null;
  /** Header text effect preset / type */
  headerEffect?: string | null;
  headerEffectColor?: string | null;
  headerEffectBlur?: number | null;
  headerEffectX?: number | null;
  headerEffectY?: number | null;
  headerEffectOpacity?: number | null;
  /** Card shadow preset / type */
  cardShadowType?: string | null;
  cardShadowColor?: string | null;
  cardShadowBlur?: number | null;
  cardShadowSpread?: number | null;
  cardShadowX?: number | null;
  cardShadowY?: number | null;
  cardShadowOpacity?: number | null;
  /** Pre-computed custom card box-shadow string override */
  cardShadow?: string | null;
  /** Pre-computed custom header text-shadow string override */
  headerTextShadow?: string | null;
  /** Custom RSVP card title / question */
  rsvpTitle?: string | null;
  /** English RSVP card title / question */
  rsvpTitleEn?: string | null;
  /** Language version: "km" (Khmer, default) or "en" (English) */
  language?: "km" | "en";
};

/**
 * Premium RSVP card — used by the live invite page and the admin preview.
 * Supports both named invitations (pre-assigned tokens) and open broadcast links
 * with guest self-registration name input.
 */
export default function RsvpCard({
  guestName,
  isOpenInvite = false,
  openNameLabel,
  openNameLabelEn,
  openNamePlaceholder,
  openNamePlaceholderEn,
  wishesLabel,
  wishesLabelEn,
  wishesPlaceholder,
  wishesPlaceholderEn,
  partySizeLabel,
  partySizeLabelEn,
  attendingLabel,
  attendingLabelEn,
  decliningLabel,
  decliningLabelEn,
  status = "pending",
  initialPartySize = 1,
  initialMessage = "",
  submitting = false,
  preview = false,
  onSubmit,
  accentColor,
  primaryColor,
  bgColor,
  bgOpacity,
  headerFont,
  headerFontEn,
  bodyFont,
  bodyFontEn,
  headerEffect,
  headerEffectColor,
  headerEffectBlur,
  headerEffectX,
  headerEffectY,
  headerEffectOpacity,
  cardShadowType,
  cardShadowColor,
  cardShadowBlur,
  cardShadowSpread,
  cardShadowX,
  cardShadowY,
  cardShadowOpacity,
  cardShadow,
  headerTextShadow,
  rsvpTitle,
  rsvpTitleEn,
  language = "km",
}: Props) {
  const isGenericOpenGuest =
    isOpenInvite ||
    !guestName ||
    guestName === "Honored Guest" ||
    guestName === "ភ្ញៀវកិត្តិយស" ||
    guestName === "open" ||
    guestName === "preview";

  // For open broadcast links, never auto-populate any placeholder/guest name or message into input fields
  const [customName, setCustomName] = useState(isGenericOpenGuest ? "" : (guestName || ""));
  const [partySize, setPartySize] = useState(isGenericOpenGuest ? 1 : (initialPartySize || 1));
  const [message, setMessage] = useState(isGenericOpenGuest ? "" : (initialMessage || ""));

  const accent = accentColor || "#db9b0f";
  const primary = primaryColor || "#3a2a00";
  const isEn = language === "en";

  const resolvedRsvpBg = (() => {
    if (bgColor || typeof bgOpacity === "number") {
      const base = bgColor && /^#[0-9a-fA-F]{3,6}$/.test(bgColor.replace("#", "")) ? bgColor : "#ffffff";
      const op = typeof bgOpacity === "number" ? Math.max(0, Math.min(100, bgOpacity)) : 25;
      const m = base.replace("#", "");
      const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
      if (/^[0-9a-fA-F]{6}$/.test(full)) {
        const r = parseInt(full.slice(0, 2), 16);
        const g = parseInt(full.slice(2, 4), 16);
        const b = parseInt(full.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${op / 100})`;
      }
      return base;
    }
    return null;
  })();

  const resolvedCardShadow =
    cardShadow ||
    computeRsvpCardShadow(
      {
        card_shadow_type: cardShadowType,
        card_shadow_color: cardShadowColor,
        card_shadow_blur: cardShadowBlur,
        card_shadow_spread: cardShadowSpread,
        card_shadow_x: cardShadowX,
        card_shadow_y: cardShadowY,
        card_shadow_opacity: cardShadowOpacity,
      },
      accent
    );

  const resolvedHeaderShadow =
    headerTextShadow ||
    computeRsvpHeaderShadow(
      {
        header_effect: headerEffect,
        header_effect_color: headerEffectColor,
        header_effect_blur: headerEffectBlur,
        header_effect_x: headerEffectX,
        header_effect_y: headerEffectY,
        header_effect_opacity: headerEffectOpacity,
      },
      accent
    );

  const rawHeaderFont = isEn ? (headerFontEn || headerFont) : (headerFont || headerFontEn);
  const resolvedHeaderFont = rawHeaderFont ? resolveHeaderFont(rawHeaderFont, isEn) : undefined;

  const rawBodyFont = isEn ? (bodyFontEn || bodyFont) : (bodyFont || bodyFontEn);
  const resolvedBodyFont = rawBodyFont ? resolveBodyFont(rawBodyFont, isEn) : undefined;

  // Same accent-driven 3-stop gradient used on the cover screens so the
  // guest's name reads as a vibrant gold inside the RSVP card too.
  const nameGradient = `linear-gradient(180deg,
    color-mix(in srgb, ${accent} 35%, #ffffff) 0%,
    color-mix(in srgb, ${accent} 85%, #ffffff) 50%,
    color-mix(in srgb, ${accent} 80%, #ffffff) 100%)`;

  const statusLabel = isEn
    ? status === "yes"
      ? (attendingLabelEn?.trim() || "Attending")
      : status === "no"
      ? (decliningLabelEn?.trim() || "Unable to attend")
      : "Awaiting response"
    : status === "yes"
    ? (attendingLabel?.trim() || "នឹងចូលរួម")
    : status === "no"
    ? (decliningLabel?.trim() || "សុំទោស មិនអាចចូលរួមបាន")
    : "កំពុងរង់ចាំការឆ្លើយតប";

  const statusBg =
    status === "yes" ? "rgba(34,197,94,0.15)" :
    status === "no" ? "rgba(239,68,68,0.15)" :
                      `${accent}26`;
  const statusColor =
    status === "yes" ? "#16a34a" :
    status === "no" ? "#dc2626" : accent;

  const handleAction = (chosenStatus: "yes" | "no") => {
    if (preview) return;
    if (isOpenInvite && !customName.trim()) {
      toast.error(isEn ? "Please enter your name or family name" : "សូមបញ្ចូលឈ្មោះរបស់អ្នក ឬគ្រួសារ");
      return;
    }
    onSubmit?.(chosenStatus, partySize, message, isOpenInvite ? customName.trim() : guestName);
  };

  const displayName = isOpenInvite ? (customName.trim() || (isEn ? "Honored Guest" : "ភ្ញៀវកិត្តិយស")) : (guestName || (isEn ? "Honored Guest" : "ភ្ញៀវកិត្តិយស"));

  return (
    <section
      className="kt-section-card p-5 sm:p-8 my-6 mx-auto w-full max-w-xl relative overflow-hidden"
      style={{
        borderColor: accent,
        boxShadow: resolvedCardShadow,
        ...(resolvedRsvpBg ? { backgroundColor: resolvedRsvpBg, background: resolvedRsvpBg } : {}),
      }}
    >
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-3">
          <span className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${accent})` }} />
          <Sparkles className="h-4 w-4" style={{ color: accent }} />
          <span className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${accent})` }} />
        </div>
        <p
          className="text-[10px] sm:text-xs tracking-[0.4em] uppercase"
          style={{
            color: accent,
            fontFamily: resolvedHeaderFont,
          }}
        >
          R · S · V · P
        </p>
        <h3
          className={`leading-snug break-words whitespace-normal px-2 ${resolvedHeaderFont ? "font-bold" : (isEn ? "font-serif font-bold text-xl sm:text-2xl" : "font-khmer-moul")}`}
          style={{
            fontSize: isEn ? (resolvedHeaderFont ? "1.45rem" : undefined) : "clamp(0.95rem, 3.2vw, 1.35rem)",
            color: accent,
            fontFamily: resolvedHeaderFont,
            textShadow: resolvedHeaderShadow,
          }}
        >
          {isEn
            ? (rsvpTitleEn?.trim() || rsvpTitle?.trim() || "Will you be attending our wedding celebration?")
            : (rsvpTitle?.trim() || "តើលោកអ្នកនឹងអញ្ជើញមកចូលរួមដែរឬទេ?")}
        </h3>

        {!isOpenInvite ? (
          <p
            className={`${resolvedBodyFont ? "" : (isEn ? "font-sans" : "font-khmer-siemreap")} text-sm sm:text-base max-w-md mx-auto leading-relaxed`}
            style={{
              color: primary,
              fontFamily: resolvedBodyFont,
            }}
          >
            {isEn ? (
              <>
                Dear{" "}
                <span
                  className="font-bold"
                  style={{
                    background: nameGradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.5))`,
                  }}
                >
                  {displayName}
                </span>
                , your presence would be our greatest honor and blessing.
              </>
            ) : (
              <>
                ជូនចំពោះ{" "}
                <span
                  className="font-bold"
                  style={{
                    background: nameGradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: `drop-shadow(0 1px 0 rgba(255,255,255,0.5))`,
                  }}
                >
                  {displayName}
                </span>{" "}
                វត្តមានរបស់លោកអ្នក គឺជាកិត្តិយសដ៏ធំធេងសម្រាប់ពិធីរបស់យើងខ្ញុំ។
              </>
            )}
          </p>
        ) : (
          <p
            className={`${resolvedBodyFont ? "" : (isEn ? "font-sans" : "font-khmer-siemreap")} text-xs sm:text-sm max-w-md mx-auto leading-relaxed opacity-90`}
            style={{
              color: primary,
              fontFamily: resolvedBodyFont,
            }}
          >
            {isEn
              ? "Please fill in your name and let us know if you can join our celebration."
              : "សូមបំពេញឈ្មោះរបស់អ្នក និងជម្រាបជូនអំពីវត្តមាននៃការចូលរួម។"}
          </p>
        )}

        <span
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium border"
          style={{ background: statusBg, color: statusColor, borderColor: `${statusColor}55`, fontFamily: resolvedBodyFont }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {statusLabel}
        </span>
      </div>

      <div className="my-5 flex items-center justify-center">
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
        <Heart className="h-3.5 w-3.5 mx-3" style={{ color: accent }} />
        <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
      </div>

      {/* Guest Name input field (for Open Broadcast Links) */}
      {isOpenInvite && (
        <div className="mb-5 space-y-1.5 text-left">
          <Label
            className={`flex items-center gap-1.5 text-xs sm:text-sm ${resolvedBodyFont ? "font-semibold" : (isEn ? "font-medium" : "font-khmer-koulen")}`}
            style={{ color: accent, fontFamily: resolvedBodyFont }}
          >
            <User className="h-3.5 w-3.5" style={{ color: accent }} />
            {isEn
              ? (openNameLabelEn?.trim() || "Your Name / Family Name")
              : (openNameLabel?.trim() || "ឈ្មោះរបស់អ្នក ឬគ្រួសារ")}
            <span className="text-red-500 font-bold">*</span>
          </Label>
          <Input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            disabled={preview || submitting}
            placeholder={
              isEn
                ? (openNamePlaceholderEn?.trim() || "e.g. Mr. John Smith & Guest")
                : (openNamePlaceholder?.trim() || "ឧ. លោក សុខ សំណាង និងភរិយា")
            }
            className={`h-11 sm:h-12 text-sm sm:text-base border transition-all ${
              resolvedBodyFont ? "" : (isEn ? "font-sans" : "font-khmer-siemreap")
            }`}
            style={{
              background: "rgba(255,255,255,0.65)",
              borderColor: `${accent}66`,
              color: primary,
              fontFamily: resolvedBodyFont,
            }}
          />
        </div>
      )}

      {/* Party Size Counter */}
      <div className="space-y-3">
        <Label
          className={`block text-center text-xs sm:text-sm ${resolvedBodyFont ? "font-semibold" : (isEn ? "font-medium uppercase tracking-wider" : "font-khmer-koulen")}`}
          style={{ color: accent, fontFamily: resolvedBodyFont }}
        >
          {isEn
            ? (partySizeLabelEn?.trim() || "Number of Guests")
            : (partySizeLabel?.trim() || "ចំនួនភ្ញៀវ")}
        </Label>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPartySize(Math.max(1, partySize - 1))}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{ border: `1px solid ${accent}66`, background: "rgba(255,255,255,0.55)", color: accent }}
            disabled={preview || partySize <= 1}
            aria-label="Decrease guests"
          >
            <Minus className="h-4 w-4" />
          </button>
          <div className="min-w-[80px] text-center">
            <div className={`text-4xl sm:text-5xl leading-none ${resolvedHeaderFont ? "font-bold" : (isEn ? "font-serif font-bold" : "font-khmer-moul")}`} style={{ color: accent, fontFamily: resolvedHeaderFont }}>
              {partySize.toString().padStart(2, "0")}
            </div>
            <div
              className={`text-xs mt-1 ${resolvedBodyFont ? "font-medium" : (isEn ? "font-sans uppercase tracking-wider" : "font-khmer-koulen")}`}
              style={{ color: primary, fontFamily: resolvedBodyFont }}
            >
              {isEn ? (partySize > 1 ? "Guests" : "Guest") : "នាក់"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPartySize(Math.min(20, partySize + 1))}
            className="h-11 w-11 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
            style={{ border: `1px solid ${accent}66`, background: "rgba(255,255,255,0.55)", color: accent }}
            disabled={preview || partySize >= 20}
            aria-label="Increase guests"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Wishes / Message Field */}
      <div className="mt-5 space-y-2 text-left">
        <Label
          className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm text-center ${resolvedBodyFont ? "font-semibold" : (isEn ? "font-medium uppercase tracking-wider" : "font-khmer-koulen")}`}
          style={{ color: accent, fontFamily: resolvedBodyFont }}
        >
          <MessageSquareHeart className="h-3.5 w-3.5" style={{ color: accent }} />
          {isEn
            ? (wishesLabelEn?.trim() || "Leave a warm message for the couple")
            : (wishesLabel?.trim() || "សារជូនពរដល់ម្ចាស់ពិធី")}
        </Label>
        <Textarea
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          readOnly={preview}
          placeholder={
            isEn
              ? (wishesPlaceholderEn?.trim() || "Wishing you both a lifetime of love, health, and joy...")
              : (wishesPlaceholder?.trim() || "សូមជូនពរឱ្យមានសុភមង្គល និងសេចក្តីស្រឡាញ់ជារៀងរហូត…")
          }
          className={`resize-none text-center ${resolvedBodyFont ? "" : (isEn ? "font-sans" : "font-khmer-siemreap")}`}
          style={{
            background: "rgba(255,255,255,0.55)",
            border: `1px solid ${accent}55`,
            color: primary,
            fontFamily: resolvedBodyFont,
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          size="lg"
          type="button"
          onClick={() => handleAction("yes")}
          disabled={preview || submitting}
          className={`h-12 tracking-wide text-white hover:opacity-95 ${resolvedBodyFont ? "font-semibold" : (isEn ? "font-semibold" : "font-khmer-koulen")}`}
          style={{ background: accent, boxShadow: `0 6px 18px ${accent}55`, fontFamily: resolvedBodyFont }}
        >
          <Check className="h-4 w-4 mr-2" />
          {isEn
            ? (attendingLabelEn?.trim() || "Joyfully Accept")
            : (attendingLabel?.trim() || "យល់ព្រមចូលរួម")}
        </Button>
        <Button
          size="lg"
          type="button"
          variant="outline"
          onClick={() => handleAction("no")}
          disabled={preview || submitting}
          className={`h-12 tracking-wide bg-transparent hover:bg-white/40 ${resolvedBodyFont ? "font-semibold" : (isEn ? "font-semibold" : "font-khmer-koulen")}`}
          style={{ borderColor: `${accent}66`, color: primary, fontFamily: resolvedBodyFont }}
        >
          <X className="h-4 w-4 mr-2" />
          {isEn
            ? (decliningLabelEn?.trim() || "Regretfully Decline")
            : (decliningLabel?.trim() || "សុំទោស មិនអាចចូលរួម")}
        </Button>
      </div>

      <p className={`mt-4 text-center text-[11px] ${resolvedBodyFont ? "" : (isEn ? "font-sans" : "font-khmer-siemreap")}`} style={{ color: `${primary}99`, fontFamily: resolvedBodyFont }}>
        {preview
          ? isEn
            ? "Preview only — guests will click to submit their RSVP"
            : "មើលជាមុន — ភ្ញៀវនឹងចុចដើម្បីឆ្លើយតប"
          : isEn
          ? "Kindly respond at your earliest convenience"
          : "សូមមេត្តាឆ្លើយតបឱ្យបានឆាប់តាមដែលអាចធ្វើបាន"}
      </p>
    </section>
  );
}

